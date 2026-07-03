# API Testing Guide

## Quick Start

The POS API endpoints are ready to test. Before testing, you need:

1. **Set up a test tenant** - Insert test data into the database
2. **Create test products and variants** - Add sample iPhones/devices
3. **Create test IMEI records** - Add individual devices with IMEIs
4. **Test the endpoints** - Use curl or your client

---

## Database Setup Script

Run this SQL to populate test data:

```sql
-- 1. Create a test tenant
INSERT INTO tenants (id, name, slug, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Store',
  'test-store',
  true
);

-- 2. Create a brand
INSERT INTO brands (id, tenant_id, name, country_origin, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Apple',
  'USA',
  true
);

-- 3. Create a product
INSERT INTO products (id, tenant_id, brand_id, name, category, is_active)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'iPhone 15 Pro',
  'Smartphone',
  true
);

-- 4. Create product variants
INSERT INTO product_variants (id, tenant_id, product_id, sku, storage_capacity, color, ram, is_active)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'IPHONE-15-PRO-128-BLACK',
    '128GB',
    'Black',
    '8GB',
    true
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'IPHONE-15-PRO-256-BLACK',
    '256GB',
    'Black',
    '8GB',
    true
  );

-- 5. Create test IMEI records (Available devices)
INSERT INTO imei_records (
  id,
  tenant_id,
  variant_id,
  imei_1,
  imei_2,
  serial_number,
  status,
  cost_price,
  selling_price,
  purchase_date,
  is_active
) VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '123456789012345',
    '123456789012346',
    'IPHONE-001-BLACK',
    'Available',
    650.00,
    999.99,
    '2026-06-15',
    true
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '987654321098765',
    '987654321098766',
    'IPHONE-002-BLACK',
    'Available',
    650.00,
    999.99,
    '2026-06-15',
    true
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '111111111111111',
    '111111111111112',
    'IPHONE-003-BLACK-256',
    'Available',
    750.00,
    1099.99,
    '2026-06-15',
    true
  );

-- 6. Create a test customer
INSERT INTO customers (
  id,
  tenant_id,
  first_name,
  last_name,
  phone_number,
  email,
  customer_type,
  is_active
) VALUES (
  '50000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'John',
  'Doe',
  '+1-555-0001',
  'john@example.com',
  'Retail',
  true
);
```

---

## Test Endpoints

### Test 1: Scan Device (Available)

```bash
curl -X GET "http://localhost:3000/api/v1/pos/products/scan/123456789012345?tenant_id=00000000-0000-0000-0000-000000000001"
```

**Expected Response (200):**
```json
{
  "success": true,
  "device": {
    "id": "40000000-0000-0000-0000-000000000001",
    "imei_1": "123456789012345",
    "imei_2": "123456789012346",
    "serial_number": "IPHONE-001-BLACK",
    "status": "Available",
    "productDetails": {
      "id": "20000000-0000-0000-0000-000000000001",
      "name": "iPhone 15 Pro",
      "brand": "Apple",
      "color": "Black",
      "storage": "128GB",
      "ram": "8GB"
    },
    "pricing": {
      "retail_price": 999.99,
      "cost_price": 650
    }
  }
}
```

---

### Test 2: Scan by Serial Number

```bash
curl -X GET "http://localhost:3000/api/v1/pos/products/scan/IPHONE-001-BLACK?tenant_id=00000000-0000-0000-0000-000000000001"
```

**Expected Response (200):**
Same as above, device found by serial number.

---

### Test 3: Scan Non-Existent Device

```bash
curl -X GET "http://localhost:3000/api/v1/pos/products/scan/INVALID?tenant_id=00000000-0000-0000-0000-000000000001"
```

**Expected Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "DEVICE_NOT_FOUND",
    "message": "Device with IMEI/Serial \"INVALID\" not found in inventory"
  }
}
```

---

### Test 4: Single Device Checkout

```bash
curl -X POST "http://localhost:3000/api/v1/pos/sales/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "customer_id": "50000000-0000-0000-0000-000000000001",
    "payment_method": "Card",
    "imei_ids": ["40000000-0000-0000-0000-000000000001"],
    "subtotal": 999.99,
    "tax_amount": 99.99,
    "discount_amount": 0,
    "notes": "Single device sale"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "sale": {
    "id": "uuid",
    "invoice_number": "INV-1719936000000-ABC123XY",
    "sale_date": "2026-07-03T14:30:00.000Z",
    "total_amount": 1099.98,
    "payment_status": "Pending",
    "items": [
      {
        "imei_record_id": "40000000-0000-0000-0000-000000000001",
        "imei_1": "123456789012345",
        "serial_number": "IPHONE-001-BLACK",
        "product_name": "iPhone 15 Pro",
        "selling_price": 999.99
      }
    ],
    "warranties": [
      {
        "imei_record_id": "40000000-0000-0000-0000-000000000001",
        "warranty_start_date": "2026-07-03",
        "warranty_end_date": "2027-07-03"
      }
    ]
  }
}
```

---

### Test 5: Bulk Checkout (2 devices)

```bash
curl -X POST "http://localhost:3000/api/v1/pos/sales/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "customer_id": "50000000-0000-0000-0000-000000000001",
    "payment_method": "Cash",
    "imei_ids": [
      "40000000-0000-0000-0000-000000000002",
      "40000000-0000-0000-0000-000000000003"
    ],
    "subtotal": 2099.98,
    "tax_amount": 209.99,
    "discount_amount": 0,
    "notes": "Bulk sale - 2 iPhones"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "sale": {
    "id": "uuid",
    "invoice_number": "INV-...",
    "total_amount": 2309.97,
    "items": [
      {
        "imei_record_id": "40000000-0000-0000-0000-000000000002",
        "imei_1": "987654321098765",
        "product_name": "iPhone 15 Pro",
        "selling_price": 999.99
      },
      {
        "imei_record_id": "40000000-0000-0000-0000-000000000003",
        "imei_1": "111111111111111",
        "product_name": "iPhone 15 Pro",
        "selling_price": 1099.99
      }
    ],
    "warranties": [
      { "warranty_end_date": "2027-07-03" },
      { "warranty_end_date": "2027-07-03" }
    ]
  }
}
```

---

### Test 6: Try to Sell Already-Sold Device

First, sell device 1 (from Test 4). Then try to sell it again:

```bash
curl -X POST "http://localhost:3000/api/v1/pos/sales/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "customer_id": "50000000-0000-0000-0000-000000000001",
    "payment_method": "Card",
    "imei_ids": ["40000000-0000-0000-0000-000000000001"],
    "subtotal": 999.99,
    "tax_amount": 99.99,
    "discount_amount": 0
  }'
```

**Expected Response (409):**
```json
{
  "success": false,
  "error": {
    "code": "CONCURRENT_SALE_CONFLICT",
    "message": "One or more IMEIs are no longer available. Please rescan.",
    "conflicts": [
      {
        "imei": "123456789012345",
        "current_status": "Sold"
      }
    ]
  }
}
```

---

### Test 7: Race Condition (Concurrent Sales)

Open two terminal windows:

**Terminal 1:**
```bash
# Window 1: Start a checkout
curl -X POST "http://localhost:3000/api/v1/pos/sales/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "payment_method": "Cash",
    "imei_ids": ["40000000-0000-0000-0000-000000000002"],
    "subtotal": 999.99,
    "tax_amount": 99.99,
    "discount_amount": 0
  }'
```

**Terminal 2 (within 1 second of Terminal 1):**
```bash
# Window 2: Try to sell the same device
curl -X POST "http://localhost:3000/api/v1/pos/sales/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "payment_method": "Card",
    "imei_ids": ["40000000-0000-0000-0000-000000000002"],
    "subtotal": 999.99,
    "tax_amount": 99.99,
    "discount_amount": 0
  }'
```

**Expected Result:**
- Terminal 1: **Success (201)** - First cashier completes checkout
- Terminal 2: **Conflict (409)** - Second cashier gets race condition error

---

### Test 8: Invalid Payment Method

```bash
curl -X POST "http://localhost:3000/api/v1/pos/sales/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "payment_method": "Bitcoin",
    "imei_ids": ["40000000-0000-0000-0000-000000000001"],
    "subtotal": 999.99
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PAYMENT_METHOD",
    "message": "Payment method must be one of: Cash, Card, Check, Digital Wallet"
  }
}
```

---

### Test 9: Check Database Audit Trail

After running checkout tests, query the database:

```sql
-- View all sales
SELECT * FROM sales ORDER BY created_at DESC;

-- View sale items (linked to IMEI)
SELECT * FROM sale_items ORDER BY created_at DESC;

-- View warranties
SELECT * FROM warranties ORDER BY warranty_end_date;

-- View IMEI status changes
SELECT * FROM inventory_movements ORDER BY created_at DESC;

-- View device that was sold
SELECT * FROM imei_records WHERE status = 'Sold';
```

---

## Key Takeaways

✅ **Fast Scanning**: IMEI/serial lookups are O(log n) via indexes
✅ **Atomic Transactions**: All-or-nothing: sale + items + warranties + movements
✅ **Race Condition Safe**: SELECT...FOR UPDATE prevents concurrent sales of same device
✅ **Auto Warranty**: 12-month warranty generated on sale
✅ **Audit Trail**: Every status change logged in inventory_movements
✅ **Error Handling**: Clear error codes and messages for debugging

---

## Troubleshooting

### "Cannot connect to database"
- Check DATABASE_URL is set correctly
- Verify Neon project is running
- Check network connectivity

### "IMEI_NOT_FOUND"
- Verify test data was inserted correctly
- Check tenant_id matches in all requests
- Ensure IMEI is not a typo

### "No response from endpoint"
- Check dev server is running: `pnpm dev`
- Verify port is 3000 or 3001
- Check browser/curl console for errors

### "All devices marked as Sold too fast"
- This is expected! Devices are marked Sold immediately after checkout
- Use inventory_movements table to see history
- Create more test IMEI records to test with

---

## Next Steps

1. **Integrate with Frontend**: Build a cashier UI with barcode scanner input
2. **Add Installments**: Endpoint to create payment plans for devices
3. **Add Auth**: Middleware to verify cashier identity
4. **Add Reports**: Dashboard with daily sales, revenue, inventory counts
5. **Add Repairs**: Link sold devices to repair workflows
