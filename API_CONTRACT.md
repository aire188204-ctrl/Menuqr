# POS API Contract

Quick reference for API endpoints, request/response formats, and status codes.

---

## Endpoint 1: Scan IMEI/Serial

### Request
```http
GET /api/v1/pos/products/scan/:imei_or_serial?tenant_id=UUID
```

### Parameters
| Name | Type | Location | Required | Example |
|------|------|----------|----------|---------|
| `imei_or_serial` | string | URL path | Yes | `123456789012345` or `ABC-123-XYZ` |
| `tenant_id` | UUID | Query | Yes | `00000000-0000-0000-0000-000000000001` |

### Response Success (200)
```json
{
  "success": true,
  "device": {
    "id": "string (UUID)",
    "imei_1": "string",
    "imei_2": "string or null",
    "serial_number": "string",
    "status": "Available | Sold | Reserved | Defective",
    "productDetails": {
      "id": "string (UUID)",
      "name": "string",
      "brand": "string",
      "color": "string or null",
      "storage": "string or null",
      "ram": "string or null"
    },
    "pricing": {
      "retail_price": "number (decimal)",
      "cost_price": "number (decimal)"
    }
  }
}
```

### Response Error - Not Found (404)
```json
{
  "success": false,
  "error": {
    "code": "DEVICE_NOT_FOUND",
    "message": "Device with IMEI/Serial \"...\" not found in inventory"
  }
}
```

### Response Error - Not Available (400)
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

### Response Error - Invalid Input (400)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "imei_or_serial and tenant_id are required"
  }
}
```

---

## Endpoint 2: Checkout

### Request
```http
POST /api/v1/pos/sales/checkout
Content-Type: application/json
```

### Request Body
```json
{
  "tenant_id": "string (UUID, required)",
  "customer_id": "string (UUID, optional)",
  "payment_method": "string (enum: Cash, Card, Check, Digital Wallet, required)",
  "imei_ids": "string[] (array of UUID strings, required, non-empty)",
  "subtotal": "number (decimal > 0, required)",
  "tax_amount": "number (decimal >= 0, optional, default: 0)",
  "discount_amount": "number (decimal >= 0, optional, default: 0)",
  "notes": "string (optional)"
}
```

### Example Request
```json
{
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "customer_id": "50000000-0000-0000-0000-000000000001",
  "payment_method": "Card",
  "imei_ids": [
    "40000000-0000-0000-0000-000000000001",
    "40000000-0000-0000-0000-000000000002"
  ],
  "subtotal": 1999.98,
  "tax_amount": 199.99,
  "discount_amount": 0,
  "notes": "Bulk sale"
}
```

### Response Success (201)
```json
{
  "success": true,
  "sale": {
    "id": "string (UUID)",
    "invoice_number": "string (format: INV-{timestamp}-{randomCode})",
    "sale_date": "string (ISO 8601 datetime)",
    "total_amount": "number (decimal)",
    "payment_status": "Pending | Partial | Paid | Cancelled",
    "items": [
      {
        "imei_record_id": "string (UUID)",
        "imei_1": "string",
        "serial_number": "string",
        "product_name": "string",
        "selling_price": "number (decimal)"
      }
    ],
    "warranties": [
      {
        "imei_record_id": "string (UUID)",
        "warranty_start_date": "string (date YYYY-MM-DD)",
        "warranty_end_date": "string (date YYYY-MM-DD, +12 months from start)"
      }
    ]
  }
}
```

### Response Error - Concurrent Sale (409)
```json
{
  "success": false,
  "error": {
    "code": "CONCURRENT_SALE_CONFLICT",
    "message": "Device was sold by another cashier during checkout. Please try again.",
    "conflicts": [
      {
        "imei": "string",
        "current_status": "Sold | Reserved | Defective"
      }
    ]
  }
}
```

### Response Error - Invalid Request (400)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "tenant_id, payment_method, and imei_ids are required. imei_ids must be non-empty."
  }
}
```

### Response Error - Invalid Amount (400)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "Subtotal must be greater than 0"
  }
}
```

### Response Error - Invalid Payment Method (400)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PAYMENT_METHOD",
    "message": "Payment method must be one of: Cash, Card, Check, Digital Wallet"
  }
}
```

### Response Error - IMEI Not Found (404)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_IMEI",
    "message": "One or more IMEI IDs do not exist in the system"
  }
}
```

### Response Error - Server Error (500)
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An error occurred during checkout. Please try again."
  }
}
```

---

## Status Codes

| Status | Meaning | When |
|--------|---------|------|
| **200** | OK | Scan successful, device found and available |
| **201** | Created | Checkout successful, sale created |
| **400** | Bad Request | Invalid input, invalid payment method, invalid amount |
| **404** | Not Found | Device not found, IMEI not found |
| **409** | Conflict | Race condition, device sold during checkout |
| **500** | Server Error | Database or internal error |

---

## Common Response Fields

### Success Response
```json
{
  "success": true,
  "device": { ... } // or "sale": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "additional_field": "value (optional)"
  }
}
```

---

## Data Types

### UUID
Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
Example: `00000000-0000-0000-0000-000000000001`

### Decimal
Format: `123.45`
Precision: Up to 2 decimal places

### Date
Format: `YYYY-MM-DD`
Example: `2026-07-03`

### DateTime (ISO 8601)
Format: `YYYY-MM-DDTHH:MM:SS.SSSZ`
Example: `2026-07-03T14:30:00.000Z`

---

## Enums

### Device Status
- `Available` - Ready for sale
- `Sold` - Already sold
- `Reserved` - Reserved for repair/hold
- `Defective` - Broken, not for sale

### Payment Method
- `Cash` - Cash payment
- `Card` - Credit/debit card
- `Check` - Check payment
- `Digital Wallet` - Digital payment (Apple Pay, Google Pay, etc.)

### Payment Status
- `Pending` - Not yet paid
- `Partial` - Partially paid
- `Paid` - Fully paid
- `Cancelled` - Payment cancelled

---

## Example cURL Commands

### Scan Device
```bash
curl -X GET \
  "http://localhost:3000/api/v1/pos/products/scan/123456789012345?tenant_id=00000000-0000-0000-0000-000000000001" \
  -H "Content-Type: application/json"
```

### Checkout Single Device
```bash
curl -X POST \
  "http://localhost:3000/api/v1/pos/sales/checkout" \
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

### Checkout Multiple Devices
```bash
curl -X POST \
  "http://localhost:3000/api/v1/pos/sales/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "customer_id": "50000000-0000-0000-0000-000000000001",
    "payment_method": "Cash",
    "imei_ids": [
      "40000000-0000-0000-0000-000000000001",
      "40000000-0000-0000-0000-000000000002"
    ],
    "subtotal": 1999.98,
    "tax_amount": 199.99,
    "discount_amount": 50
  }'
```

---

## Rate Limiting

Currently: No rate limiting implemented

Future: Will add rate limiting based on:
- IP address
- Tenant ID
- API key (if authentication added)

---

## Versioning

API Version: `v1`
Endpoint Prefix: `/api/v1/pos/`

---

## CORS

Not configured for cross-origin requests. Use same origin or configure CORS headers.

---

## Authentication

Currently: None (uses tenant_id for isolation)

Future: Will add:
- API key authentication
- JWT tokens
- Cashier identity tracking

---

## Retry Strategy

### For 409 Conflict
- Retry immediately (1-3 times)
- Show user: "Device was sold, rescanning..."
- After 3 retries: Show error message

### For 500 Server Error
- Retry with exponential backoff (1s, 2s, 4s, 8s)
- Max 5 retries
- After max retries: Show error message

### For 4xx Client Error
- Do not retry
- Show user the error message

---

## Performance Expectations

- **Scan**: < 100ms (IMEI index lookup)
- **Checkout (single device)**: < 500ms
- **Checkout (bulk)**: < 1s (10 devices)

---

## Field Validation Rules

### tenant_id
- Type: UUID (v4)
- Required: Yes
- Validation: Must be valid UUID

### customer_id
- Type: UUID (v4)
- Required: No
- Validation: If provided, must be valid UUID

### payment_method
- Type: String
- Required: Yes (POST only)
- Validation: Must be one of: Cash, Card, Check, Digital Wallet
- Case-sensitive: Yes

### imei_ids
- Type: Array of UUIDs
- Required: Yes (POST only)
- Validation: Non-empty array, each element must be valid UUID
- Max length: 100 items (soft limit)

### subtotal
- Type: Decimal
- Required: Yes (POST only)
- Validation: Must be > 0
- Precision: 2 decimal places
- Max value: 999,999.99

### tax_amount
- Type: Decimal
- Required: No (POST only)
- Default: 0
- Validation: Must be >= 0
- Precision: 2 decimal places

### discount_amount
- Type: Decimal
- Required: No (POST only)
- Default: 0
- Validation: Must be >= 0
- Precision: 2 decimal places

### notes
- Type: String
- Required: No (POST only)
- Max length: 500 characters
- Validation: No special characters required

---

## Database Transaction Guarantees

All checkout operations run inside a **PostgreSQL transaction** with:

- **Isolation Level**: `READ_COMMITTED` (default)
- **Locking**: `SELECT...FOR UPDATE` row locking
- **Atomicity**: All-or-nothing (entire transaction succeeds or rolls back)
- **Consistency**: Foreign key constraints enforced
- **Durability**: WAL (Write-Ahead Logging)

---

## Warranty Details

Automatically generated on sale:

- **Warranty Start Date**: Sale date (CURRENT_DATE)
- **Warranty End Date**: Sale date + 12 months
- **Warranty Type**: "Standard"
- **Is Active**: true

Example:
- Sale created: 2026-07-03
- Warranty starts: 2026-07-03
- Warranty ends: 2027-07-03
