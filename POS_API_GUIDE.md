# Mobile Phone POS System - API Guide

## Overview

High-performance barcode/IMEI scanning and sales checkout API for a mobile phone retail management system. Built with Next.js, PostgreSQL (Neon), and the `postgres` driver for robust transaction handling.

---

## Database Schema

All data is stored in Neon PostgreSQL with the following core tables:

- **imei_records** - Individual device tracking with IMEI-1, IMEI-2, serial number, status, and pricing
- **product_variants** - Device configurations (iPhone 15 Pro - 128GB - Black)
- **products** - Product models (iPhone 15 Pro)
- **brands** - Device manufacturers (Apple, Samsung, etc.)
- **customers** - Customer information
- **sales** - Transaction records
- **sale_items** - Line items linking 1:1 to imei_records
- **warranties** - Device warranty tracking (auto-generated: current date + 12 months)
- **installments** - Payment plan tracking
- **repairs** - Device repair jobs
- **technicians** - Repair technician info
- **audit_logs** - Compliance and troubleshooting trail
- **inventory_movements** - Status change audit trail

---

## API Endpoints

### 1. Scan IMEI/Serial Number

**Endpoint:** `GET /api/v1/pos/products/scan/:imei_or_serial`

**Purpose:** Instantly lookup a device in inventory by IMEI-1 or Serial Number.

**Query Parameters:**
```
tenant_id (required): UUID of the tenant/store
```

**Response - Success (200):**
```json
{
  "success": true,
  "device": {
    "id": "uuid",
    "imei_1": "123456789012345",
    "imei_2": "123456789012346",
    "serial_number": "ABC123XYZ456",
    "status": "Available",
    "productDetails": {
      "id": "uuid",
      "name": "iPhone 15 Pro",
      "brand": "Apple",
      "color": "Black",
      "storage": "128GB",
      "ram": "8GB"
    },
    "pricing": {
      "retail_price": 999.99,
      "cost_price": 650.00
    }
  }
}
```

**Response - Device Not Found (404):**
```json
{
  "success": false,
  "error": {
    "code": "DEVICE_NOT_FOUND",
    "message": "Device with IMEI/Serial \"123456789012345\" not found in inventory"
  }
}
```

**Response - Device Already Sold (400):**
```json
{
  "success": false,
  "error": {
    "code": "DEVICE_NOT_AVAILABLE",
    "message": "Device already sold on 7/1/2026",
    "device_status": "Sold",
    "last_sold_date": "7/1/2026"
  }
}
```

**Response - Device Defective/Reserved (400):**
```json
{
  "success": false,
  "error": {
    "code": "DEVICE_NOT_AVAILABLE",
    "message": "Device is defective",
    "device_status": "Defective"
  }
}
```

---

### 2. Checkout (Atomic Transaction)

**Endpoint:** `POST /api/v1/pos/sales/checkout`

**Purpose:** Complete a sale with strict ACID transaction guarantees. Handles concurrent purchases safely with row-level locking.

**Request Body:**
```json
{
  "tenant_id": "uuid",
  "customer_id": "uuid (optional)",
  "payment_method": "Cash|Card|Check|Digital Wallet",
  "imei_ids": [
    "uuid-1",
    "uuid-2"
  ],
  "subtotal": 1999.99,
  "tax_amount": 199.99,
  "discount_amount": 0,
  "notes": "Bulk sale"
}
```

**Transaction Guarantee:**
1. Lock all IMEI records with `SELECT...FOR UPDATE`
2. Verify all are `Available` status
3. Create `sales` record
4. Create `sale_items` (one per device) with unique constraint on imei_record_id
5. Create `warranties` (auto-calculated: today + 12 months)
6. Update `imei_records` status to `Sold`
7. Log `inventory_movements` for audit trail
8. **All succeed or all rollback** - no partial sales

**Response - Success (201):**
```json
{
  "success": true,
  "sale": {
    "id": "uuid",
    "invoice_number": "INV-1719936000000-ABC123XY",
    "sale_date": "2026-07-03T14:30:00.000Z",
    "total_amount": 2199.98,
    "payment_status": "Pending",
    "items": [
      {
        "imei_record_id": "uuid",
        "imei_1": "123456789012345",
        "serial_number": "ABC123XYZ456",
        "product_name": "iPhone 15 Pro - 128GB - Black",
        "selling_price": 999.99
      },
      {
        "imei_record_id": "uuid",
        "imei_1": "123456789012346",
        "serial_number": "ABC123XYZ457",
        "product_name": "iPhone 15 Pro - 128GB - Black",
        "selling_price": 999.99
      }
    ],
    "warranties": [
      {
        "imei_record_id": "uuid",
        "warranty_start_date": "2026-07-03",
        "warranty_end_date": "2027-07-03"
      },
      {
        "imei_record_id": "uuid",
        "warranty_start_date": "2026-07-03",
        "warranty_end_date": "2027-07-03"
      }
    ]
  }
}
```

**Response - Race Condition (409 - Concurrent Sale Detected):**
```json
{
  "success": false,
  "error": {
    "code": "CONCURRENT_SALE_CONFLICT",
    "message": "Device was sold by another cashier during checkout. Please try again.",
    "conflicts": [
      {
        "imei": "123456789012345",
        "serial": "ABC123XYZ456",
        "current_status": "Sold"
      }
    ]
  }
}
```

**Response - Invalid Input (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "tenant_id, payment_method, and imei_ids are required. imei_ids must be non-empty."
  }
}
```

**Response - IMEI Not Found (404):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_IMEI",
    "message": "One or more IMEI IDs do not exist in the system"
  }
}
```

---

## Race Condition Handling

### Problem: Two Cashiers Scan the Same Device

**Timeline:**
```
10:00:00 Cashier A: Scans device (Status: Available) ✓
10:00:01 Cashier B: Scans device (Status: Available) ✓
10:00:02 Cashier A: Clicks Checkout → Locks row, verifies Available, creates sale ✓
10:00:03 Cashier B: Clicks Checkout → Locks row (waiting...) → Row now Sold ✗
```

### Solution: SELECT...FOR UPDATE + 409 Conflict Response

**How it works:**
1. **Lock**: `SELECT ... FOR UPDATE` locks the row immediately
2. **Verify**: Check if status is still `Available`
3. **Validate**: If another transaction changed it to `Sold`, return **409 Conflict**
4. **Atomic**: Either the entire transaction succeeds or rolls back

**Checkout code:**
```typescript
// Step 1: Lock all IMEI records
const imeiRecords = await trx`
  SELECT id, imei_1, serial_number, status
  FROM imei_records
  WHERE id IN ${trx(imeiRecordIds)}
  FOR UPDATE  // ← Locks the rows
`;

// Step 2: Verify all are Available
const unavailable = imeiRecords.filter(r => r.status !== 'Available');
if (unavailable.length > 0) {
  throw { code: 'IMEI_NOT_AVAILABLE', conflicts: unavailable };
  // Rollback transaction automatically
}

// Step 3: Create sale and update statuses
// All-or-nothing transaction guarantee
```

**Cashier B receives:**
```json
{
  "success": false,
  "error": {
    "code": "CONCURRENT_SALE_CONFLICT",
    "message": "Device was sold by another cashier during checkout. Please try again.",
    "conflicts": [{ "imei": "123456789012345", "current_status": "Sold" }]
  }
}
```

---

## Performance Optimizations

### Indexes for Fast Scanning
- `idx_imei_records_imei_1`: O(log n) IMEI-1 lookup
- `idx_imei_records_serial_number`: O(log n) serial number lookup
- `idx_imei_records_status`: Fast inventory status queries
- `idx_imei_records_status_variant`: Composite for "available count by variant"

### Connection Pooling
- Max 20 concurrent connections
- Automatic idle connection cleanup
- 10-second connection timeout

### Transaction Management
- `SELECT...FOR UPDATE` for pessimistic locking
- Automatic rollback on error
- ACID guarantees (Atomicity, Consistency, Isolation, Durability)

---

## Setup & Configuration

### 1. Environment Variables
```bash
# Required
DATABASE_URL=postgresql://user:password@neon-endpoint/dbname
```

### 2. Initialize Database
The schema is already deployed to Neon with:
- UUID extension for primary keys
- Foreign keys with ON DELETE CASCADE/RESTRICT
- CHECK constraints for valid statuses
- Composite indexes for complex queries
- Audit trail tables for compliance

### 3. Install Dependencies
```bash
pnpm add postgres
```

### 4. Start Development Server
```bash
pnpm dev
```

---

## Error Codes Reference

| Code | Status | Meaning |
|------|--------|---------|
| `INVALID_INPUT` | 400 | Missing/invalid query parameters or request body |
| `DEVICE_NOT_FOUND` | 404 | IMEI/serial not in inventory |
| `DEVICE_NOT_AVAILABLE` | 400 | Device is Sold/Defective/Reserved |
| `INVALID_REQUEST` | 400 | Malformed checkout request |
| `INVALID_AMOUNT` | 400 | Subtotal ≤ 0 or tax/discount invalid |
| `INVALID_PAYMENT_METHOD` | 400 | Payment method not supported |
| `INVALID_IMEI` | 404 | IMEI UUID doesn't exist |
| `CONCURRENT_SALE_CONFLICT` | 409 | Device sold during checkout (retry) |
| `INTERNAL_SERVER_ERROR` | 500 | Database or server error |

---

## Example Usage Flow

### Scenario: Selling 2 iPhones (Bulk Sale)

```bash
# 1. Scan first device
curl -X GET "http://localhost:3000/api/v1/pos/products/scan/123456789012345?tenant_id=abc-123-def"

# Response: Device found, Available, $999.99

# 2. Scan second device
curl -X GET "http://localhost:3000/api/v1/pos/products/scan/987654321098765?tenant_id=abc-123-def"

# Response: Device found, Available, $999.99

# 3. Checkout both devices
curl -X POST "http://localhost:3000/api/v1/pos/sales/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "abc-123-def",
    "customer_id": "cust-uuid",
    "payment_method": "Card",
    "imei_ids": [
      "imei-record-uuid-1",
      "imei-record-uuid-2"
    ],
    "subtotal": 1999.98,
    "tax_amount": 199.99,
    "discount_amount": 0,
    "notes": "Customer Name: John Doe"
  }'

# Response: Success!
# Invoice: INV-1719936000000-ABC123XY
# 2 sale items created
# 2 warranties created (12 months each)
# All devices marked as Sold
```

---

## Warranty Auto-Generation

When a device is sold:
1. **Start Date**: Current date (sale date)
2. **End Date**: Current date + 12 months
3. **Type**: "Standard"
4. **Status**: Active

Example:
- Sale Date: July 3, 2026
- Warranty Start: 2026-07-03
- Warranty End: 2027-07-03 (exactly 1 year)

---

## Audit Trail

Every transaction is logged:

**inventory_movements** table:
- Original status → New status
- Related table (sales/repairs)
- Related ID (sale UUID)
- Timestamp

**audit_logs** table:
- Table name
- Operation (INSERT/UPDATE/DELETE)
- Old/new values (JSONB)
- User who made change
- IP address
- Timestamp

Example query:
```sql
SELECT * FROM inventory_movements
WHERE imei_record_id = 'device-uuid'
ORDER BY created_at DESC;

-- Shows: Available → Reserved (repair) → Available → Sold
```

---

## Security & Best Practices

✅ **Parameterized Queries**: All queries use parameter binding (prevents SQL injection)
✅ **Row-Level Locking**: `SELECT...FOR UPDATE` prevents race conditions
✅ **Transaction Isolation**: SERIALIZABLE isolation level (if needed)
✅ **Audit Trail**: All changes logged for compliance
✅ **Unique Constraints**: IMEI-1 and serial number must be unique per tenant
✅ **Foreign Keys**: Referential integrity (can't delete a product with devices)
✅ **Type Safety**: Full TypeScript definitions for requests/responses

---

## Common Issues

### "IMEI already exists"
- Device was already scanned into the system
- Check inventory_movements to see where it went

### "Concurrent sale conflict"
- Two cashiers tried to sell same device
- Normal behavior - just retry
- Previous sale will be committed

### "Database connection timeout"
- Check DATABASE_URL is correct
- Verify Neon project is running
- Check network/firewall rules

---

## Next Steps

1. **Add Authentication**: Middleware to verify tenant_id and cashier
2. **Add Installments**: Endpoint to create payment plans
3. **Add Repairs Integration**: Link sold devices to repair jobs
4. **Add Stock Management**: Bulk import IMEI records
5. **Add Reports**: Revenue, inventory, warranty expiry dashboards
6. **Add Webhooks**: Real-time sync to POS terminal displays
