-- Complex E-commerce Database Schema for Testing
-- Run this in your PostgreSQL test database

-- Drop tables if they exist
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;

-- Customers table
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

COMMENT ON TABLE customers IS 'Stores customer account information';
COMMENT ON COLUMN customers.email IS 'Primary contact email for the customer';
COMMENT ON COLUMN customers.phone IS 'Customer phone number for notifications';
COMMENT ON COLUMN customers.date_of_birth IS 'Used for age verification and birthday promotions';

-- Addresses table
CREATE TABLE addresses (
    address_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    address_type VARCHAR(20) CHECK (address_type IN ('billing', 'shipping')),
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'USA',
    is_default BOOLEAN DEFAULT false,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

COMMENT ON TABLE addresses IS 'Customer shipping and billing addresses';
COMMENT ON COLUMN addresses.address_type IS 'Distinguishes between billing and shipping addresses';
COMMENT ON COLUMN addresses.is_default IS 'Indicates the primary address for this type';

-- Categories table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    parent_category_id INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

COMMENT ON TABLE categories IS 'Product categories with hierarchical structure';
COMMENT ON COLUMN categories.parent_category_id IS 'Self-referencing FK for category hierarchy';

-- Products table
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    cost DECIMAL(10, 2) CHECK (cost >= 0),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    weight_kg DECIMAL(8, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
);

COMMENT ON TABLE products IS 'Product catalog with inventory tracking';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - unique product identifier';
COMMENT ON COLUMN products.cost IS 'Internal cost for margin calculation';
COMMENT ON COLUMN products.stock_quantity IS 'Current available inventory';

-- Orders table
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipping_address_id INTEGER NOT NULL,
    billing_address_id INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(address_id) ON DELETE RESTRICT,
    FOREIGN KEY (billing_address_id) REFERENCES addresses(address_id) ON DELETE RESTRICT
);

COMMENT ON TABLE orders IS 'Customer orders with status tracking';
COMMENT ON COLUMN orders.order_number IS 'Human-readable order reference number';
COMMENT ON COLUMN orders.order_status IS 'Current fulfillment status';
COMMENT ON COLUMN orders.total_amount IS 'Final amount including tax and shipping';

-- Order Items table
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    line_total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT
);

COMMENT ON TABLE order_items IS 'Individual line items within orders';
COMMENT ON COLUMN order_items.unit_price IS 'Price at time of purchase (may differ from current price)';
COMMENT ON COLUMN order_items.line_total IS 'Calculated as (quantity * unit_price) - discount_amount';

-- Payment Methods table
CREATE TABLE payment_methods (
    payment_method_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    payment_type VARCHAR(20) CHECK (payment_type IN ('credit_card', 'debit_card', 'paypal', 'bank_transfer')),
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20),
    expiry_month INTEGER CHECK (expiry_month BETWEEN 1 AND 12),
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

COMMENT ON TABLE payment_methods IS 'Stored payment methods for customers';
COMMENT ON COLUMN payment_methods.card_last_four IS 'Last 4 digits for card identification';
COMMENT ON COLUMN payment_methods.is_default IS 'Primary payment method for this customer';

-- Shipments table
CREATE TABLE shipments (
    shipment_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE,
    tracking_number VARCHAR(100),
    carrier VARCHAR(50),
    shipped_date TIMESTAMP,
    estimated_delivery DATE,
    actual_delivery_date TIMESTAMP,
    shipment_status VARCHAR(20) DEFAULT 'preparing' CHECK (shipment_status IN ('preparing', 'in_transit', 'out_for_delivery', 'delivered', 'failed')),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

COMMENT ON TABLE shipments IS 'Shipment tracking information';
COMMENT ON COLUMN shipments.tracking_number IS 'Carrier-provided tracking number';
COMMENT ON COLUMN shipments.carrier IS 'Shipping company (UPS, FedEx, USPS, etc)';

-- Reviews table
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_title VARCHAR(200),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    helpful_count INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    UNIQUE (product_id, customer_id)
);

COMMENT ON TABLE reviews IS 'Customer product reviews and ratings';
COMMENT ON COLUMN reviews.rating IS 'Star rating from 1 to 5';
COMMENT ON COLUMN reviews.is_verified_purchase IS 'True if customer actually purchased this product';
COMMENT ON COLUMN reviews.helpful_count IS 'Number of users who found this review helpful';

-- Insert some sample data
INSERT INTO customers (email, first_name, last_name, phone, date_of_birth) VALUES
('john.doe@example.com', 'John', 'Doe', '+1-555-0101', '1985-03-15'),
('jane.smith@example.com', 'Jane', 'Smith', '+1-555-0102', '1990-07-22'),
('bob.wilson@example.com', 'Bob', 'Wilson', '+1-555-0103', '1988-11-30');

INSERT INTO categories (category_name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Computers', 'Desktop and laptop computers'),
('Smartphones', 'Mobile phones and accessories');

UPDATE categories SET parent_category_id = 1 WHERE category_name IN ('Computers', 'Smartphones');

INSERT INTO products (category_id, product_name, sku, price, cost, stock_quantity) VALUES
(2, 'Gaming Laptop Pro', 'LAP-001', 1299.99, 899.99, 15),
(2, 'Business Ultrabook', 'LAP-002', 899.99, 599.99, 25),
(3, 'Flagship Smartphone X', 'PHN-001', 999.99, 649.99, 50);

SELECT 'Database schema created successfully!' as status;
