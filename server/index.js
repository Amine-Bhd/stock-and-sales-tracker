require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// --- DATABASE CONNECTION ---
// Create a connection pool to the database
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- API ENDPOINTS ---

// GET all categories
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT category_id as id, name, emoji FROM Category ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        res.status(500).json({ message: 'Error fetching categories from database.' });
    }
});

// POST a new category
app.post('/api/categories', async (req, res) => {
    const { emoji, name } = req.body;
    if (!emoji || !name) {
        return res.status(400).json({ message: 'Emoji and name are required.' });
    }
    try {
        const [result] = await pool.query('INSERT INTO Category (emoji, name) VALUES (?, ?)', [emoji, name]);
        const newCategory = { id: result.insertId, emoji, name };
        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Failed to create category:', error);
        res.status(500).json({ message: 'Error creating category in database.' });
    }
});

// GET all products with their current stock
app.get('/api/products', async (req, res) => {
    const query = `
        SELECT 
            p.barcode as id, 
            p.name, 
            p.emoji, 
            p.selling_price as price, 
            p.category_id as categoryId, 
            COALESCE(SUM(ps.quantity), 0) as stock 
        FROM Product p 
        LEFT JOIN ProductStock ps ON p.barcode = ps.barcode 
        GROUP BY p.barcode, p.name, p.emoji, p.selling_price, p.category_id
        ORDER BY p.name
    `;
    try {
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        res.status(500).json({ message: 'Error fetching products from database.' });
    }
});

// POST a new product and initial stock
app.post('/api/products', async (req, res) => {
    const { categoryId, emoji, name, stock, price, barcode } = req.body;
    if (!barcode || !name || !categoryId || !price) {
        return res.status(400).json({ message: 'Barcode, name, category, and price are required.' });
    }
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Insert product
        await connection.query(
            'INSERT INTO Product (barcode, category_id, emoji, name, selling_price) VALUES (?, ?, ?, ?, ?)',
            [barcode, categoryId, emoji, name, price]
        );

        // Insert initial stock entry if stock > 0
        if (stock > 0) {
            // The trigger trg_after_stockentry_insert will create the ProductStock record
            await connection.query(
                'INSERT INTO StockEntry (barcode, quantity, buying_price, entry_date) VALUES (?, ?, ?, NOW())',
                [barcode, stock, price] // Using selling price as buying price for simplicity
            );
        }

        await connection.commit();

        // Fetch the newly created product with its stock to return to the client
        const [rows] = await connection.query(`
            SELECT p.barcode as id, p.name, p.emoji, p.selling_price as price, p.category_id as categoryId, 
                   COALESCE(SUM(ps.quantity), 0) as stock 
            FROM Product p 
            LEFT JOIN ProductStock ps ON p.barcode = ps.barcode 
            WHERE p.barcode = ?
            GROUP BY p.barcode
        `, [barcode]);

        res.status(201).json(rows[0]);

    } catch (error) {
        await connection.rollback();
        console.error('Failed to create product:', error);
        res.status(500).json({ message: 'Error creating product in database.' });
    } finally {
        connection.release();
    }
});

// PUT (update) a product's stock by a certain amount
app.put('/api/products/:id/stock', async (req, res) => {
    const { amount } = req.body; // amount can be positive or negative
    const barcode = req.params.id;
    
    if (typeof amount !== 'number') {
        return res.status(400).json({ message: 'A numeric amount is required.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        if (amount > 0) {
            // It's a stock increase, create a StockEntry
            // Fetch product's price to use as buying_price
            const [productRows] = await connection.query('SELECT selling_price FROM Product WHERE barcode = ?', [barcode]);
            if (productRows.length === 0) {
                throw new Error('Product not found');
            }
            const price = productRows[0].selling_price;
            await connection.query(
                'INSERT INTO StockEntry (barcode, quantity, buying_price, entry_date) VALUES (?, ?, ?, NOW())',
                [barcode, amount, price]
            );
        } else if (amount < 0) {
            // It's a stock decrease (correction), deduct from ProductStock FIFO
            let remainingQtyToDeduct = Math.abs(amount);
            
            const [batches] = await connection.query(
                'SELECT stock_id, quantity FROM ProductStock WHERE barcode = ? AND quantity > 0 ORDER BY expiry_date ASC, stock_id ASC', 
                [barcode]
            );

            for (const batch of batches) {
                if (remainingQtyToDeduct <= 0) break;

                const deduction = Math.min(batch.quantity, remainingQtyToDeduct);
                await connection.query('UPDATE ProductStock SET quantity = quantity - ? WHERE stock_id = ?', [deduction, batch.stock_id]);
                remainingQtyToDeduct -= deduction;
            }
            if (remainingQtyToDeduct > 0) {
                 throw new Error('Not enough stock for correction');
            }
        }
        
        await connection.commit();

        // Fetch the updated product to return
        const [rows] = await connection.query(`
            SELECT p.barcode as id, p.name, p.emoji, p.selling_price as price, p.category_id as categoryId, 
                   COALESCE(SUM(ps.quantity), 0) as stock 
            FROM Product p 
            LEFT JOIN ProductStock ps ON p.barcode = ps.barcode 
            WHERE p.barcode = ?
            GROUP BY p.barcode
        `, [barcode]);

        res.json(rows[0]);

    } catch (error) {
        await connection.rollback();
        console.error(`Failed to update stock for ${barcode}:`, error);
        res.status(500).json({ message: error.message || 'Error updating stock.' });
    } finally {
        connection.release();
    }
});


// DELETE a product
app.delete('/api/products/:id', async (req, res) => {
    const barcode = req.params.id;
    // Note: Assumes ON DELETE CASCADE is set for foreign keys referencing Product.
    // If not, you must delete from child tables (ProductStock, StockEntry, etc.) first.
    try {
        await pool.query('DELETE FROM Product WHERE barcode = ?', [barcode]);
        res.status(204).send();
    } catch (error) {
        console.error(`Failed to delete product ${barcode}:`, error);
        res.status(500).json({ message: 'Error deleting product from database.' });
    }
});


// GET all sales
app.get('/api/sales', async (req, res) => {
    const query = `
        SELECT 
            t.transaction_id as id, 
            t.transaction_date as date, 
            t.total_amount as total,
            td.barcode as productId,
            td.quantity,
            p.emoji,
            p.name,
            td.price_at_sale as priceAtSale
        FROM Transaction t
        JOIN TransactionDetail td ON t.transaction_id = td.transaction_id
        JOIN Product p ON td.barcode = p.barcode
        ORDER BY t.transaction_date DESC
    `;
    try {
        const [rows] = await pool.query(query);
        // Group items by sale
        const salesMap = new Map();
        rows.forEach(row => {
            if (!salesMap.has(row.id)) {
                salesMap.set(row.id, {
                    id: row.id,
                    date: row.date,
                    total: row.total,
                    items: []
                });
            }
            salesMap.get(row.id).items.push({
                productId: row.productId,
                emoji: row.emoji,
                name: row.name,
                quantity: row.quantity,
                priceAtSale: row.priceAtSale
            });
        });
        res.json(Array.from(salesMap.values()));
    } catch (error) {
        console.error('Failed to fetch sales:', error);
        res.status(500).json({ message: 'Error fetching sales from database.' });
    }
});

// POST a new sale (checkout)
app.post('/api/sales', async (req, res) => {
    const { items } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Cannot process an empty sale.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Validate stock and calculate total
        let total = 0;
        const productDetails = [];
        for (const item of items) {
            const [[product]] = await connection.query(`
                SELECT p.barcode, p.name, p.selling_price, COALESCE(SUM(ps.quantity), 0) as stock
                FROM Product p
                LEFT JOIN ProductStock ps ON p.barcode = ps.barcode
                WHERE p.barcode = ?
                GROUP BY p.barcode
            `, [item.productId]);
            
            if (!product || product.stock < item.quantity) {
                throw new Error(`Not enough stock for ${product?.name || item.productId}`);
            }
            total += product.selling_price * item.quantity;
            productDetails.push({ ...product, quantity: item.quantity });
        }

        // 2. Create Transaction
        const [transResult] = await connection.query(
            'INSERT INTO Transaction (transaction_date, total_amount) VALUES (NOW(), ?)',
            [total]
        );
        const transactionId = transResult.insertId;

        // 3. Create TransactionDetail entries (triggers will handle stock deduction)
        for (const product of productDetails) {
            await connection.query(
                'INSERT INTO TransactionDetail (transaction_id, barcode, quantity, price_at_sale) VALUES (?, ?, ?, ?)',
                [transactionId, product.barcode, product.quantity, product.selling_price]
            );
        }

        await connection.commit();
        
        // 4. Fetch the new sale and updated product info to return to client
        const [[newSaleData]] = await connection.query(`
             SELECT transaction_id as id, transaction_date as date, total_amount as total 
             FROM Transaction WHERE transaction_id = ?
        `, [transactionId]);
        
        const newSaleItems = productDetails.map(p => ({
            productId: p.barcode,
            emoji: p.emoji,
            name: p.name,
            quantity: p.quantity,
            priceAtSale: p.selling_price
        }));

        const newSale = { ...newSaleData, items: newSaleItems };

        const updatedProductIds = items.map(i => i.productId);
        const [updatedProducts] = await connection.query(`
            SELECT p.barcode as id, p.name, p.emoji, p.selling_price as price, p.category_id as categoryId, 
                   COALESCE(SUM(ps.quantity), 0) as stock 
            FROM Product p 
            LEFT JOIN ProductStock ps ON p.barcode = ps.barcode 
            WHERE p.barcode IN (?)
            GROUP BY p.barcode
        `, [updatedProductIds]);
        
        res.status(201).json({ newSale, updatedProducts });

    } catch (error) {
        await connection.rollback();
        console.error('Checkout failed:', error);
        res.status(400).json({ message: error.message });
    } finally {
        connection.release();
    }
});


app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});