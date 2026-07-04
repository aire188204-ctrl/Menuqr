-- ============================================================================
-- Mobile Phone Retail & Repair Management POS System
-- Production-Ready PostgreSQL Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TENANTS TABLE (Multi-tenant support)
-- ============================================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_slug ON tenants(slug);

-- ============================================================================
-- BRANDS TABLE
-- ============================================================================
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  country_origin VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_brands_tenant_id ON brands(tenant_id);
CREATE INDEX idx_brands_name ON brands(name);

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- e.g., 'Smartphone', 'Tablet', 'Accessory'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, brand_id, name)
);

CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_category ON products(category);

-- ============================================================================
-- PRODUCT_VARIANTS TABLE
-- ============================================================================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL,
  storage_capacity VARCHAR(50), -- e.g., '128GB', '256GB'
  color VARCHAR(100), -- e.g., 'Black', 'Silver', 'Midnight'
  ram VARCHAR(50), -- e.g., '8GB', '12GB'
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, sku)
);

CREATE INDEX idx_product_variants_tenant_id ON product_variants(tenant_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);

-- ============================================================================
-- IMEI_RECORDS TABLE (Critical - Individual Device Tracking)
-- ============================================================================
CREATE TABLE imei_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  imei_1 VARCHAR(20) NOT NULL,
  imei_2 VARCHAR(20),
  serial_number VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Available'
    CHECK (status IN ('Available', 'Sold', 'Reserved', 'Defective')),
  cost_price DECIMAL(12, 2) NOT NULL,
  selling_price DECIMAL(12, 2) NOT NULL,
  purchase_date DATE,
  warranty_expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, imei_1),
  UNIQUE(tenant_id, serial_number)
);

CREATE INDEX idx_imei_records_tenant_id ON imei_records(tenant_id);
CREATE INDEX idx_imei_records_variant_id ON imei_records(variant_id);
CREATE INDEX idx_imei_records_imei_1 ON imei_records(imei_1); -- Fast IMEI lookup
CREATE INDEX idx_imei_records_serial_number ON imei_records(serial_number); -- Fast serial lookup
CREATE INDEX idx_imei_records_status ON imei_records(status); -- Query by status
CREATE INDEX idx_imei_records_status_variant ON imei_records(status, variant_id); -- Inventory queries

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(20) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  customer_type VARCHAR(50) DEFAULT 'Retail', -- 'Retail', 'Wholesale', 'Corporate'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_phone_number ON customers(phone_number);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================================================
-- SALES TABLE
-- ============================================================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number VARCHAR(100) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50), -- 'Cash', 'Card', 'Check', 'Digital Wallet'
  payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending'
    CHECK (payment_status IN ('Pending', 'Partial', 'Paid', 'Cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, invoice_number)
);

CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_sale_date ON sales(sale_date);
CREATE INDEX idx_sales_payment_status ON sales(payment_status);
CREATE INDEX idx_sales_invoice_number ON sales(invoice_number);

-- ============================================================================
-- SALE_ITEMS TABLE (One-to-One with IMEI_RECORDS)
-- ============================================================================
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  imei_record_id UUID NOT NULL UNIQUE REFERENCES imei_records(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  line_total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sale_items_tenant_id ON sale_items(tenant_id);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_imei_record_id ON sale_items(imei_record_id);
CREATE INDEX idx_sale_items_variant_id ON sale_items(variant_id);

-- ============================================================================
-- INSTALLMENTS TABLE
-- ============================================================================
CREATE TABLE installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  down_payment DECIMAL(12, 2) NOT NULL DEFAULT 0,
  remaining_balance DECIMAL(12, 2) NOT NULL,
  installment_amount DECIMAL(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending'
    CHECK (payment_status IN ('Pending', 'Paid', 'Overdue', 'Cancelled')),
  paid_date TIMESTAMP WITH TIME ZONE,
  paid_amount DECIMAL(12, 2),
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_installments_tenant_id ON installments(tenant_id);
CREATE INDEX idx_installments_sale_id ON installments(sale_id);
CREATE INDEX idx_installments_due_date ON installments(due_date);
CREATE INDEX idx_installments_payment_status ON installments(payment_status);

-- ============================================================================
-- TECHNICIANS TABLE
-- ============================================================================
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(20) NOT NULL,
  specialization VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_technicians_tenant_id ON technicians(tenant_id);
CREATE INDEX idx_technicians_is_active ON technicians(is_active);

-- ============================================================================
-- REPAIRS TABLE
-- ============================================================================
CREATE TABLE repairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_no VARCHAR(50) NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
  device_model VARCHAR(255) NOT NULL,
  serial_or_imei VARCHAR(100),
  issue_description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Diagnosing', 'Awaiting_Parts', 'Completed', 'Delivered')),
  estimated_cost DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2),
  parts_cost DECIMAL(12, 2) DEFAULT 0,
  labor_cost DECIMAL(12, 2) DEFAULT 0,
  repair_start_date TIMESTAMP WITH TIME ZONE,
  repair_completion_date TIMESTAMP WITH TIME ZONE,
  delivery_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, job_no)
);

CREATE INDEX idx_repairs_tenant_id ON repairs(tenant_id);
CREATE INDEX idx_repairs_job_no ON repairs(job_no);
CREATE INDEX idx_repairs_customer_id ON repairs(customer_id);
CREATE INDEX idx_repairs_technician_id ON repairs(technician_id);
CREATE INDEX idx_repairs_status ON repairs(status);
CREATE INDEX idx_repairs_serial_or_imei ON repairs(serial_or_imei); -- Fast device lookup
CREATE INDEX idx_repairs_created_at ON repairs(created_at);

-- ============================================================================
-- REPAIR_PARTS TABLE (Track parts used in repairs)
-- ============================================================================
CREATE TABLE repair_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  repair_id UUID NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
  part_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_cost DECIMAL(12, 2) NOT NULL,
  total_cost DECIMAL(12, 2) NOT NULL,
  supplier VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repair_parts_tenant_id ON repair_parts(tenant_id);
CREATE INDEX idx_repair_parts_repair_id ON repair_parts(repair_id);

-- ============================================================================
-- INVENTORY_MOVEMENTS TABLE (Audit trail for device status changes)
-- ============================================================================
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  imei_record_id UUID NOT NULL REFERENCES imei_records(id) ON DELETE CASCADE,
  from_status VARCHAR(50) NOT NULL,
  to_status VARCHAR(50) NOT NULL,
  related_table VARCHAR(50), -- 'sales', 'repairs', 'inventory_adjustment'
  related_id UUID,
  movement_reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_movements_tenant_id ON inventory_movements(tenant_id);
CREATE INDEX idx_inventory_movements_imei_record_id ON inventory_movements(imei_record_id);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at);

-- ============================================================================
-- AUDIT_LOG TABLE (Track all critical operations)
-- ============================================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  table_name VARCHAR(100) NOT NULL,
  operation VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  changed_by VARCHAR(255),
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Inventory Status Summary
CREATE OR REPLACE VIEW inventory_summary AS
SELECT 
  t.name AS tenant_name,
  b.name AS brand_name,
  p.name AS product_name,
  pv.color,
  pv.storage_capacity,
  COUNT(*) FILTER (WHERE ir.status = 'Available') AS available_count,
  COUNT(*) FILTER (WHERE ir.status = 'Sold') AS sold_count,
  COUNT(*) FILTER (WHERE ir.status = 'Reserved') AS reserved_count,
  COUNT(*) FILTER (WHERE ir.status = 'Defective') AS defective_count,
  COUNT(*) AS total_count
FROM imei_records ir
JOIN tenants t ON ir.tenant_id = t.id
JOIN product_variants pv ON ir.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
JOIN brands b ON p.brand_id = b.id
GROUP BY t.id, t.name, b.id, b.name, p.id, p.name, pv.id, pv.color, pv.storage_capacity;

-- Sales Revenue Summary
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
  t.name AS tenant_name,
  DATE(s.sale_date) AS sale_date,
  COUNT(*) AS transaction_count,
  SUM(s.total_amount) AS total_revenue,
  SUM(s.tax_amount) AS total_tax,
  SUM(s.discount_amount) AS total_discounts
FROM sales s
JOIN tenants t ON s.tenant_id = t.id
GROUP BY t.id, t.name, DATE(s.sale_date);

-- Pending Repairs Summary
CREATE OR REPLACE VIEW pending_repairs_summary AS
SELECT 
  t.name AS tenant_name,
  r.job_no,
  r.customer_name,
  r.device_model,
  r.status,
  r.estimated_cost,
  r.actual_cost,
  CASE 
    WHEN r.actual_cost IS NOT NULL THEN (r.actual_cost - r.estimated_cost)
    ELSE NULL 
  END AS cost_variance,
  AGE(NOW(), r.created_at) AS time_in_repair
FROM repairs r
JOIN tenants t ON r.tenant_id = t.id
WHERE r.status != 'Delivered'
ORDER BY r.created_at DESC;

-- Overdue Installments
CREATE OR REPLACE VIEW overdue_installments AS
SELECT 
  t.name AS tenant_name,
  inst.id AS installment_id,
  s.invoice_number,
  c.first_name || ' ' || c.last_name AS customer_name,
  inst.installment_number,
  inst.installment_amount,
  inst.due_date,
  CURRENT_DATE - inst.due_date AS days_overdue
FROM installments inst
JOIN sales s ON inst.sale_id = s.id
JOIN tenants t ON inst.tenant_id = t.id
LEFT JOIN customers c ON s.customer_id = c.id
WHERE inst.payment_status = 'Pending' AND inst.due_date < CURRENT_DATE
ORDER BY inst.due_date ASC;

-- ============================================================================
-- TRANSACTION SUPPORT
-- ============================================================================
-- Note: All tables include created_at and updated_at timestamps
-- Use BEGIN; ... COMMIT; for multi-table operations to ensure ACID compliance
-- Example:
-- BEGIN;
-- INSERT INTO imei_records (...) RETURNING id;
-- INSERT INTO sale_items (...);
-- INSERT INTO inventory_movements (...);
-- COMMIT;

-- ============================================================================
-- CONSTRAINTS & CHECKS
-- ============================================================================
ALTER TABLE imei_records ADD CONSTRAINT check_imei_prices 
  CHECK (cost_price > 0 AND selling_price > cost_price);

ALTER TABLE sale_items ADD CONSTRAINT check_sale_item_quantity 
  CHECK (quantity > 0);

ALTER TABLE sale_items ADD CONSTRAINT check_sale_item_price 
  CHECK (unit_price > 0);

ALTER TABLE installments ADD CONSTRAINT check_installment_amounts 
  CHECK (total_amount > 0 AND remaining_balance >= 0);

ALTER TABLE repairs ADD CONSTRAINT check_repair_costs 
  CHECK (actual_cost IS NULL OR (actual_cost >= 0 AND actual_cost >= parts_cost + labor_cost));

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================
-- 1. IMEI & Serial Number indexes enable O(log n) lookups for fast scanning
-- 2. Composite indexes (e.g., status + variant_id) optimize inventory queries
-- 3. Tenant_id is indexed on all tables for multi-tenant isolation
-- 4. Audit trail (inventory_movements) tracks all device status changes
-- 5. UNIQUE constraints on IMEI-1, Serial Number, SKU prevent duplicates
-- 6. Foreign key constraints with ON DELETE RESTRICT protect data integrity
-- 7. JSONB audit_logs for flexible schema change tracking
-- 8. Views provide optimized access patterns for common business queries
