-- ============================================================================
-- TEST DATA for Repair Management System
-- Insert this after the main test-data.sql
-- ============================================================================

-- Assuming tenant_id = '00000000-0000-0000-0000-000000000001'
-- Assuming a variant exists: '50000000-0000-0000-0000-000000000001'

-- Add inventory stock for spare parts
INSERT INTO inventory_stock (
  id,
  tenant_id,
  variant_id,
  quantity_available,
  reorder_level,
  last_restock_date,
  notes,
  created_at,
  updated_at
) VALUES (
  '60000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  10,
  2,
  NOW(),
  'iPhone 15 screen/battery spare parts stock',
  NOW(),
  NOW()
),
(
  '60000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000002',
  8,
  3,
  NOW(),
  'Samsung Galaxy display spare parts',
  NOW(),
  NOW()
),
(
  '60000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000003',
  5,
  1,
  NOW(),
  'Charger/cable parts stock',
  NOW(),
  NOW()
);

-- Add sample technicians
INSERT INTO technicians (
  id,
  tenant_id,
  first_name,
  last_name,
  email,
  phone_number,
  specialization,
  is_active,
  created_at,
  updated_at
) VALUES (
  '70000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Ali',
  'Mohammed',
  'ali.mohammed@repair-shop.ae',
  '+971-50-5555555',
  'iPhone & iOS Devices',
  true,
  NOW(),
  NOW()
),
(
  '70000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Amira',
  'Hassan',
  'amira.hassan@repair-shop.ae',
  '+971-52-6666666',
  'Samsung & Android Devices',
  true,
  NOW(),
  NOW()
),
(
  '70000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Omar',
  'Abdullah',
  'omar.abdullah@repair-shop.ae',
  '+971-55-7777777',
  'General Electronics & Accessories',
  true,
  NOW(),
  NOW()
);

-- Create sample repair jobs (in different states for testing)
INSERT INTO repairs (
  id,
  tenant_id,
  job_no,
  customer_id,
  customer_name,
  customer_phone,
  technician_id,
  device_model,
  serial_or_imei,
  issue_description,
  status,
  estimated_cost,
  actual_cost,
  parts_cost,
  labor_cost,
  repair_start_date,
  repair_completion_date,
  notes,
  created_at,
  updated_at
) VALUES (
  '80000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'JOB-2026-0001',
  '20000000-0000-0000-0000-000000000001',
  'Ahmed Hassan',
  '+971-50-1234567',
  '70000000-0000-0000-0000-000000000001',
  'iPhone 15 Pro Max',
  '123456789012345',
  'Screen not responding, water damage visible',
  'Pending',
  500.00,
  NULL,
  0,
  0,
  NULL,
  NULL,
  'Urgent repair needed for business use',
  NOW(),
  NOW()
),
(
  '80000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'JOB-2026-0002',
  '20000000-0000-0000-0000-000000000002',
  'Fatima Al-Mazrouei',
  '+971-52-9876543',
  '70000000-0000-0000-0000-000000000002',
  'Samsung Galaxy S24',
  '987654321098765',
  'Battery not charging, power button broken',
  'Diagnosing',
  350.00,
  NULL,
  0,
  0,
  NOW(),
  NULL,
  'Customer will call back for updates',
  NOW(),
  NOW()
),
(
  '80000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'JOB-2026-0003',
  '20000000-0000-0000-0000-000000000003',
  'Mohammed Al-Mansouri',
  '+971-55-1111111',
  '70000000-0000-0000-0000-000000000003',
  'OnePlus 12',
  '111111111111111',
  'Display broken, camera malfunction',
  'Completed',
  400.00,
  350.00,
  150.00,
  200.00,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day',
  'Replaced display and camera module',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day'
),
(
  '80000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'JOB-2026-0004',
  '20000000-0000-0000-0000-000000000001',
  'Layla Al-Qasimi',
  '+971-58-2222222',
  '70000000-0000-0000-0000-000000000001',
  'Pixel 8 Pro',
  '222222222222222',
  'Speaker not working, mic broken',
  'Awaiting_Parts',
  300.00,
  NULL,
  0,
  0,
  NOW() - INTERVAL '3 days',
  NULL,
  'Waiting for speaker module, ETA 2 days',
  NOW() - INTERVAL '3 days',
  NOW()
),
(
  '80000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'JOB-2026-0005',
  '20000000-0000-0000-0000-000000000002',
  'Khaled Al-Suwaidi',
  '+971-54-3333333',
  '70000000-0000-0000-0000-000000000002',
  'Xiaomi 14 Ultra',
  '333333333333333',
  'Battery degraded, not holding charge',
  'Completed',
  200.00,
  150.00,
  100.00,
  50.00,
  NOW() - INTERVAL '1 day',
  NOW(),
  'Battery replaced, tested for 2 hours',
  NOW() - INTERVAL '1 day',
  NOW()
);

-- Add repair parts for completed repairs
INSERT INTO repair_parts (
  id,
  tenant_id,
  repair_id,
  part_name,
  quantity,
  unit_cost,
  total_cost,
  supplier,
  notes,
  created_at
) VALUES (
  '90000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000003',
  '50000000-0000-0000-0000-000000000001',
  1,
  150.00,
  150.00,
  'Genuine Parts Supplier',
  'OLED Display Module',
  NOW() - INTERVAL '1 day'
),
(
  '90000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000003',
  '50000000-0000-0000-0000-000000000002',
  1,
  100.00,
  100.00,
  'Original Equipment',
  'Camera Module Assembly',
  NOW() - INTERVAL '1 day'
),
(
  '90000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000005',
  '50000000-0000-0000-0000-000000000001',
  1,
  100.00,
  100.00,
  'Battery World',
  'Li-Ion 5000mAh Battery',
  NOW()
);

-- Inventory movements for testing queries
INSERT INTO inventory_movements (
  id,
  tenant_id,
  imei_record_id,
  from_status,
  to_status,
  related_table,
  related_id,
  movement_reason,
  created_at
) VALUES (
  '95000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000003',
  'In_Stock',
  'Used',
  'repairs',
  '80000000-0000-0000-0000-000000000003',
  'Display part used for repair JOB-2026-0003',
  NOW() - INTERVAL '1 day'
),
(
  '95000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000005',
  'In_Stock',
  'Used',
  'repairs',
  '80000000-0000-0000-0000-000000000005',
  'Battery part used for repair JOB-2026-0005',
  NOW()
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View all jobs with their status
-- SELECT job_no, customer_name, device_model, status, actual_cost FROM repairs ORDER BY created_at DESC;

-- View completed jobs with cost breakdown
-- SELECT r.job_no, r.customer_name, r.actual_cost, r.labor_cost, r.parts_cost,
--        COUNT(rp.id) as parts_count
-- FROM repairs r
-- LEFT JOIN repair_parts rp ON r.id = rp.repair_id
-- WHERE r.status = 'Completed'
-- GROUP BY r.id, r.job_no, r.customer_name, r.actual_cost, r.labor_cost, r.parts_cost
-- ORDER BY r.updated_at DESC;

-- View current inventory levels
-- SELECT iv.id, pv.sku, iv.quantity_available, iv.reorder_level
-- FROM inventory_stock iv
-- JOIN product_variants pv ON iv.variant_id = pv.id
-- ORDER BY pv.sku;

-- View all technicians assigned to jobs
-- SELECT DISTINCT t.first_name, t.last_name, t.specialization, COUNT(r.id) as repairs_assigned
-- FROM technicians t
-- LEFT JOIN repairs r ON t.id = r.technician_id
-- GROUP BY t.id, t.first_name, t.last_name, t.specialization
-- ORDER BY repairs_assigned DESC;
