-- Mobile Phone POS - Test Data
-- Run this SQL in Neon to populate test data for API testing

-- 1. Create test tenant
INSERT INTO tenants (id, name, slug, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test Store',
  'test-store',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- 2. Create brand
INSERT INTO brands (id, tenant_id, name, country_origin, is_active, created_at, updated_at)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Apple',
  'USA',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO brands (id, tenant_id, name, country_origin, is_active, created_at, updated_at)
VALUES (
  '10000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Samsung',
  'South Korea',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- 3. Create products
INSERT INTO products (id, tenant_id, brand_id, name, category, description, is_active, created_at, updated_at)
VALUES (
  '20000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '10000000-0000-0000-0000-000000000001'::uuid,
  'iPhone 15 Pro',
  'Smartphone',
  'Latest flagship iPhone',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO products (id, tenant_id, brand_id, name, category, description, is_active, created_at, updated_at)
VALUES (
  '20000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '10000000-0000-0000-0000-000000000002'::uuid,
  'Samsung Galaxy S24',
  'Smartphone',
  'Latest flagship Galaxy',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- 4. Create product variants
INSERT INTO product_variants (id, tenant_id, product_id, sku, storage_capacity, color, ram, description, is_active, created_at, updated_at)
VALUES
  (
    '30000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    'IPHONE-15-PRO-128-BLACK',
    '128GB',
    'Black',
    '8GB',
    'iPhone 15 Pro 128GB Black',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING,
  (
    '30000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    'IPHONE-15-PRO-256-BLACK',
    '256GB',
    'Black',
    '8GB',
    'iPhone 15 Pro 256GB Black',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING,
  (
    '30000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    'IPHONE-15-PRO-128-WHITE',
    '128GB',
    'White',
    '8GB',
    'iPhone 15 Pro 128GB White',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING,
  (
    '30000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    'SAMSUNG-S24-256-BLACK',
    '256GB',
    'Black',
    '12GB',
    'Samsung Galaxy S24 256GB Black',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;

-- 5. Create IMEI records (Available devices)
-- iPhone 15 Pro - 128GB - Black
INSERT INTO imei_records (
  id, tenant_id, variant_id, imei_1, imei_2, serial_number, status,
  cost_price, selling_price, purchase_date, warranty_expiry_date,
  notes, created_at, updated_at
) VALUES
  (
    '40000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '123456789012345',
    '123456789012346',
    'IPHONE-PRO-001',
    'Available',
    650.00,
    999.99,
    '2026-06-15'::date,
    '2027-06-15'::date,
    'New stock - June shipment',
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING,
  (
    '40000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '987654321098765',
    '987654321098766',
    'IPHONE-PRO-002',
    'Available',
    650.00,
    999.99,
    '2026-06-15'::date,
    '2027-06-15'::date,
    'New stock - June shipment',
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING,
  (
    '40000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '555555555555555',
    '555555555555556',
    'IPHONE-PRO-003',
    'Available',
    650.00,
    999.99,
    '2026-06-15'::date,
    '2027-06-15'::date,
    'New stock - June shipment',
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;

-- iPhone 15 Pro - 256GB - Black
INSERT INTO imei_records (
  id, tenant_id, variant_id, imei_1, imei_2, serial_number, status,
  cost_price, selling_price, purchase_date, warranty_expiry_date,
  notes, created_at, updated_at
) VALUES
  (
    '40000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '111111111111111',
    '111111111111112',
    'IPHONE-PRO-256-001',
    'Available',
    750.00,
    1099.99,
    '2026-06-15'::date,
    '2027-06-15'::date,
    'New stock - June shipment',
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING,
  (
    '40000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '222222222222222',
    '222222222222223',
    'IPHONE-PRO-256-002',
    'Available',
    750.00,
    1099.99,
    '2026-06-15'::date,
    '2027-06-15'::date,
    'New stock - June shipment',
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;

-- iPhone 15 Pro - 128GB - White
INSERT INTO imei_records (
  id, tenant_id, variant_id, imei_1, imei_2, serial_number, status,
  cost_price, selling_price, purchase_date, warranty_expiry_date,
  notes, created_at, updated_at
) VALUES
  (
    '40000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    '333333333333333',
    '333333333333334',
    'IPHONE-PRO-WHITE-001',
    'Available',
    650.00,
    999.99,
    '2026-06-20'::date,
    '2027-06-20'::date,
    'New stock - June shipment',
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;

-- Samsung Galaxy S24 - 256GB - Black
INSERT INTO imei_records (
  id, tenant_id, variant_id, imei_1, imei_2, serial_number, status,
  cost_price, selling_price, purchase_date, warranty_expiry_date,
  notes, created_at, updated_at
) VALUES
  (
    '40000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000004'::uuid,
    '444444444444444',
    '444444444444445',
    'SAMSUNG-S24-001',
    'Available',
    600.00,
    899.99,
    '2026-06-15'::date,
    '2027-06-15'::date,
    'New stock - Samsung batch',
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;

-- 6. Create customers
INSERT INTO customers (
  id, tenant_id, first_name, last_name, phone_number, email,
  address, city, state_province, postal_code, country,
  customer_type, is_active, created_at, updated_at
) VALUES
  (
    '50000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'John',
    'Doe',
    '+1-555-0001',
    'john@example.com',
    '123 Main St',
    'New York',
    'NY',
    '10001',
    'USA',
    'Retail',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING,
  (
    '50000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Jane',
    'Smith',
    '+1-555-0002',
    'jane@example.com',
    '456 Oak Ave',
    'Los Angeles',
    'CA',
    '90001',
    'USA',
    'Retail',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING,
  (
    '50000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Tech',
    'Store Corp',
    '+1-555-0003',
    'bulk@techstore.com',
    '789 Tech Blvd',
    'San Francisco',
    'CA',
    '94102',
    'USA',
    'Wholesale',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;

-- 7. Create technicians
INSERT INTO technicians (
  id, tenant_id, first_name, last_name, phone_number, email,
  specialization, is_active, created_at, updated_at
) VALUES
  (
    '60000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Mike',
    'Johnson',
    '+1-555-1001',
    'mike@techstore.com',
    'iPhone Repair',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING,
  (
    '60000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Sarah',
    'Williams',
    '+1-555-1002',
    'sarah@techstore.com',
    'Samsung Repair',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;

-- Summary
SELECT '[✓] Test data created successfully!' AS status;
SELECT COUNT(*) AS total_tenants FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
SELECT COUNT(*) AS available_devices FROM imei_records WHERE status = 'Available';
SELECT COUNT(*) AS customers FROM customers;
SELECT COUNT(*) AS technicians FROM technicians;
