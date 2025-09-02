# Database Triggers

This file contains the database triggers used to automate stock management.

```sql
-- Trigger to add a new batch to ProductStock when a StockEntry is created.
-- This is used for both adding new products and increasing stock of existing ones.
DELIMITER $$
CREATE TRIGGER `trg_after_stockentry_insert`
AFTER INSERT ON `StockEntry`
FOR EACH ROW
BEGIN
    INSERT INTO `ProductStock` (`barcode`, `quantity`, `buying_price`, `entry_date`, `expiry_date`)
    VALUES (NEW.barcode, NEW.quantity, NEW.buying_price, NEW.entry_date, DATE_ADD(NEW.entry_date, INTERVAL 1 YEAR));
END$$
DELIMITER ;


-- Trigger to deduct stock from the oldest batches first (FIFO)
-- when a sale is recorded in TransactionDetail.
DELIMITER $$
CREATE TRIGGER `trg_after_transactiondetail_insert`
AFTER INSERT ON `TransactionDetail`
FOR EACH ROW
BEGIN
    DECLARE remaining_qty_to_deduct INT;
    DECLARE stock_batch_id INT;
    DECLARE stock_batch_qty INT;
    DECLARE done INT DEFAULT FALSE;
    
    -- Cursor to fetch available stock batches for the product, oldest first (FIFO).
    DECLARE stock_cursor CURSOR FOR
        SELECT `stock_id`, `quantity`
        FROM `ProductStock`
        WHERE `barcode` = NEW.barcode AND `quantity` > 0
        ORDER BY `expiry_date` ASC, `entry_date` ASC;
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    SET remaining_qty_to_deduct = NEW.quantity;
    
    OPEN stock_cursor;
    
    read_loop: LOOP
        FETCH stock_cursor INTO stock_batch_id, stock_batch_qty;
        
        IF done OR remaining_qty_to_deduct <= 0 THEN
            LEAVE read_loop;
        END IF;
        
        IF stock_batch_qty >= remaining_qty_to_deduct THEN
            -- This batch has enough stock, deduct from it and finish.
            UPDATE `ProductStock`
            SET `quantity` = `quantity` - remaining_qty_to_deduct
            WHERE `stock_id` = stock_batch_id;
            SET remaining_qty_to_deduct = 0;
        ELSE
            -- This batch doesn't have enough stock, use it all up and continue to the next.
            UPDATE `ProductStock`
            SET `quantity` = 0
            WHERE `stock_id` = stock_batch_id;
            SET remaining_qty_to_deduct = remaining_qty_to_deduct - stock_batch_qty;
        END IF;
    END LOOP;
    
    CLOSE stock_cursor;
    
    -- If after checking all batches, we still need to deduct quantity,
    -- it means there wasn't enough stock. This should ideally be handled
    -- in the application logic before inserting the transaction, but as a
    -- safeguard, we can signal an error.
    IF remaining_qty_to_deduct > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock to complete the transaction.';
    END IF;
END$$
DELIMITER ;
```
