# Database Schema

This file describes the database schema for the Shop Visual Stock & Sales application.

```sql
-- Main Categories for Products
CREATE TABLE `Category` (
    `category_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `emoji` VARCHAR(10) NOT NULL,
    UNIQUE(`name`)
);

-- Products available in the shop
CREATE TABLE `Product` (
    `barcode` VARCHAR(100) PRIMARY KEY,
    `category_id` INT,
    `name` VARCHAR(255) NOT NULL,
    `emoji` VARCHAR(10) NOT NULL,
    `selling_price` DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (`category_id`) REFERENCES `Category`(`category_id`) ON DELETE SET NULL
);

-- Records each batch of stock for a product, assuming FIFO for sales/expiry.
-- The quantity here represents the current amount remaining from that batch.
CREATE TABLE `ProductStock` (
    `stock_id` INT AUTO_INCREMENT PRIMARY KEY,
    `barcode` VARCHAR(100),
    `quantity` INT NOT NULL,
    `buying_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `entry_date` DATETIME NOT NULL,
    -- Expiry date can be used for FIFO or to track perishable goods.
    -- Defaulting to 1 year from entry for simplicity.
    `expiry_date` DATE,
    FOREIGN KEY (`barcode`) REFERENCES `Product`(`barcode`) ON DELETE CASCADE
);

-- Records when new stock is added to the system (e.g., from a supplier).
-- A trigger uses this table to populate the ProductStock table.
CREATE TABLE `StockEntry` (
    `entry_id` INT AUTO_INCREMENT PRIMARY KEY,
    `barcode` VARCHAR(100),
    `quantity` INT NOT NULL,
    `buying_price` DECIMAL(10, 2) NOT NULL,
    `entry_date` DATETIME NOT NULL,
    FOREIGN KEY (`barcode`) REFERENCES `Product`(`barcode`) ON DELETE CASCADE
);

-- Main table for sales transactions.
CREATE TABLE `Transaction` (
    `transaction_id` INT AUTO_INCREMENT PRIMARY KEY,
    `transaction_date` DATETIME NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL
);

-- Details for each transaction, linking products to a transaction.
CREATE TABLE `TransactionDetail` (
    `transaction_detail_id` INT AUTO_INCREMENT PRIMARY KEY,
    `transaction_id` INT,
    `barcode` VARCHAR(100),
    `quantity` INT NOT NULL,
    `price_at_sale` DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (`transaction_id`) REFERENCES `Transaction`(`transaction_id`) ON DELETE CASCADE,
    FOREIGN KEY (`barcode`) REFERENCES `Product`(`barcode`) ON DELETE RESTRICT
);
```
