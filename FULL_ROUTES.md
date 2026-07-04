# CellPhone POS - Complete Routes Documentation

## Overview
Full routing structure for the CellPhone POS system including page routes, API endpoints, and their detailed specifications.

---

## Page Routes

### Root Page
**Path:** `/`  
**File:** `app/page.tsx`  
**Type:** Client Component  
**Description:** Main dashboard landing page with welcome section, system status, features grid, and documentation links. Includes integrated IMEI scanner, cart summary, and repair job form modal.

**Features:**
- Welcome banner with quick action buttons
- System status indicator with operational metrics
- Features grid showcasing POS capabilities
- API documentation section
- Live tenant indicator badge
- Integrated IMEI scanner component
- Cart summary panel
- Repair job creation modal

**Client-Side Functionality:**
- IMEI scanning with laser animation effects
- Cart management with item tracking
- Repair job form with validation
- Toast notification system
- Modal dialogs for repair creation

### Root Layout
**Path:** `app/layout.tsx`  
**File:** `app/layout.tsx`  
**Type:** Server Component  
**Description:** Root layout wrapper for all pages, manages metadata, viewport configuration, and global styles.

**Features:**
- HTML structure with proper charset and viewport
- Dark mode theme configuration
- Global CSS imports
- Root component wrapper with Electric Black background

---

## API Routes (v1)

### Base Path
All API routes are versioned under `/api/v1/`

---

## POS (Point of Sale) API

### 1. IMEI/Serial Scanner Endpoint

**Path:** `/api/v1/pos/products/scan/[imei_or_serial]`  
**File:** `app/api/v1/pos/products/scan/[imei_or_serial]/route.ts`  
**Method:** `GET`

**Description:**
Scan a device by IMEI-1 or Serial Number. Returns device details with product information if available. Returns 400 error if device is already sold with last sale date.

**Query Parameters:**
- `tenant_id` (required): UUID of the tenant/store
- `imei_or_serial` (required, path param): IMEI-1 or Serial Number to scan

**Request Example:**
```bash
GET /api/v1/pos/products/scan/865123456789012?tenant_id=550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200):**
```json
{
  "success": true,
  "device": {
    "id": "uuid",
    "imei_1": "865123456789012",
    "imei_2": "865123456789013",
    "serial_number": "SN123456",
    "status": "Available",
    "productDetails": {
      "id": "uuid",
      "name": "iPhone 15 Pro Max",
      "brand": "Apple",
      "color": "Black Titanium",
      "storage": "256GB",
      "ram": "8GB"
    },
    "pricing": {
      "retail_price": 1299.99,
      "cost_price": 899.99
    }
  }
}
```

**Error Responses:**

**400 (Invalid Input):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "imei_or_serial and tenant_id are required"
  }
}
```

**404 (Device Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "DEVICE_NOT_FOUND",
    "message": "Device with IMEI/Serial \"865123456789012\" not found in inventory"
  }
}
```

**400 (Device Not Available):**
```json
{
  "success": false,
  "error": {
    "code": "DEVICE_NOT_AVAILABLE",
    "message": "Device already sold on 12/15/2025",
    "device_status": "Sold",
    "last_sold_date": "12/15/2025"
  }
}
```

**500 (Server Error):**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An error occurred while scanning the device"
  }
}
```

**Device Status Codes:**
- `Available` - Device ready for sale
- `Sold` - Device has been purchased
- `Reserved` - Device is on hold
- `In Repair` - Device is under repair
- `Damaged` - Device cannot be sold

---

### 2. Checkout/Sales Endpoint

**Path:** `/api/v1/pos/sales/checkout`  
**File:** `app/api/v1/pos/sales/checkout/route.ts`  
**Method:** `POST`

**Description:**
Atomic sales checkout transaction. Validates all IMEIs are available, creates sale, sale_items, and warranties in a single transaction, updates IMEI statuses to sold. Handles race conditions with SELECT...FOR UPDATE locking.

**Request Body:**
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "optional-uuid",
  "payment_method": "Card",
  "imei_ids": [
    "imei-uuid-1",
    "imei-uuid-2"
  ],
  "subtotal": 2599.98,
  "tax_amount": 259.99,
  "discount_amount": 0,
  "notes": "Customer paid in full"
}
```

**Required Fields:**
- `tenant_id` (string, UUID): Store/tenant identifier
- `payment_method` (string): One of `Cash`, `Card`, `Check`, `Digital Wallet`
- `imei_ids` (array, non-empty): List of IMEI record UUIDs to checkout
- `subtotal` (number, > 0): Total before tax and discount

**Optional Fields:**
- `customer_id` (string, UUID): Customer record ID
- `tax_amount` (number, default: 0): Tax amount
- `discount_amount` (number, default: 0): Discount amount
- `notes` (string): Additional notes for the sale

**Payment Methods Accepted:**
- `Cash`
- `Card`
- `Check`
- `Digital Wallet`

**Success Response (201):**
```json
{
  "success": true,
  "sale": {
    "id": "sale-uuid",
    "invoice_number": "INV-2025-001234",
    "sale_date": "2025-12-20T15:30:00Z",
    "total_amount": 2859.97,
    "payment_status": "Completed",
    "items": [
      {
        "imei_record_id": "uuid",
        "imei_1": "865123456789012",
        "serial_number": "SN123456",
        "product_name": "iPhone 15 Pro Max",
        "selling_price": 1299.99
      }
    ],
    "warranties": [
      {
        "imei_record_id": "uuid",
        "warranty_start_date": "2025-12-20",
        "warranty_end_date": "2026-12-20"
      }
    ]
  }
}
```

**Error Responses:**

**400 (Invalid Request):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "tenant_id, payment_method, and imei_ids are required. imei_ids must be non-empty."
  }
}
```

**400 (Invalid Amount):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "Subtotal must be greater than 0"
  }
}
```

**400 (Invalid Payment Method):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PAYMENT_METHOD",
    "message": "Payment method must be one of: Cash, Card, Check, Digital Wallet"
  }
}
```

**404 (IMEI Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_IMEI",
    "message": "One or more IMEI IDs do not exist in the system"
  }
}
```

**409 (Race Condition - Device Sold):**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT_DETECTED",
    "message": "One or more IMEIs are no longer available. Please rescan.",
    "conflicts": ["imei-uuid-1"]
  }
}
```

**409 (Concurrent Sale Conflict):**
```json
{
  "success": false,
  "error": {
    "code": "CONCURRENT_SALE_CONFLICT",
    "message": "Device was sold by another cashier during checkout. Please try again."
  }
}
```

**500 (Server Error):**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An error occurred during checkout. Please try again."
  }
}
```

**Features:**
- Atomic transaction with all-or-nothing semantics
- Race condition protection via SELECT...FOR UPDATE
- Automatic warranty creation (1 year)
- Invoice number generation
- Support for multiple payment methods
- Tax and discount calculation

---

## Repair API

### 1. Create Repair Job Endpoint

**Path:** `/api/v1/repair/jobs`  
**File:** `app/api/v1/repair/jobs/route.ts`  
**Method:** `POST`

**Description:**
Create a new repair job with automatic job number generation in format `JOB-YYYY-NNNN` (e.g., `JOB-2025-0001`). Validates all inputs and creates repair record with initial status of `Pending`.

**Request Body:**
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_name": "John Doe",
  "customer_phone": "555-0123",
  "device_model": "iPhone 15 Pro Max",
  "serial_or_imei": "865123456789012",
  "issue_description": "Screen damaged with black spots",
  "estimated_cost": 299.99,
  "customer_id": "optional-uuid",
  "technician_id": "optional-uuid",
  "notes": "Customer requested rush repair"
}
```

**Required Fields:**
- `tenant_id` (string, UUID): Store/tenant identifier
- `customer_name` (string, non-empty): Full name of customer
- `customer_phone` (string, non-empty): Contact phone number
- `device_model` (string, non-empty): Device model name
- `serial_or_imei` (string, 5-20 chars): Device serial or IMEI
- `issue_description` (string, non-empty): Description of the issue

**Optional Fields:**
- `estimated_cost` (number, ≥ 0): Estimated repair cost
- `customer_id` (string, UUID): Link to customer record
- `technician_id` (string, UUID): Assigned technician
- `notes` (string): Additional notes

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "repair-uuid",
    "job_no": "JOB-2025-0001",
    "repair": {
      "id": "repair-uuid",
      "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
      "job_no": "JOB-2025-0001",
      "customer_id": null,
      "customer_name": "John Doe",
      "customer_phone": "555-0123",
      "technician_id": null,
      "device_model": "iPhone 15 Pro Max",
      "serial_or_imei": "865123456789012",
      "issue_description": "Screen damaged with black spots",
      "status": "Pending",
      "estimated_cost": 299.99,
      "actual_cost": null,
      "parts_cost": null,
      "labor_cost": null,
      "repair_start_date": null,
      "repair_completion_date": null,
      "delivery_date": null,
      "notes": "Customer requested rush repair",
      "created_at": "2025-12-20T15:30:00Z",
      "updated_at": "2025-12-20T15:30:00Z"
    }
  }
}
```

**Error Responses:**

**400 (Validation Error):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      "customer_name is required and must be non-empty",
      "serial_or_imei must be between 5 and 20 characters"
    ]
  }
}
```

**409 (Job Number Conflict):**
```json
{
  "success": false,
  "error": {
    "code": "JOB_NUMBER_ERROR",
    "message": "Failed to generate unique job number"
  }
}
```

**500 (Server Error):**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

**Repair Status Codes:**
- `Pending` - Initial status when created
- `Diagnosing` - Technician is diagnosing the issue
- `Parts Ordered` - Waiting for parts to arrive
- `In Progress` - Active repair in progress
- `Completed` - Repair finished, awaiting pickup
- `Delivered` - Device delivered to customer
- `Cancelled` - Repair cancelled

---

### 2. Update Repair Status Endpoint

**Path:** `/api/v1/repair/jobs/[id]/status`  
**File:** `app/api/v1/repair/jobs/[id]/status/route.ts`  
**Method:** `PATCH`

**Description:**
Update repair job status with state machine validation and optional spare parts deduction. Validates state transitions, deducts spare parts from inventory when transitioning to completed, calculates total repair cost (labor + parts). Provides atomic transaction with inventory locking.

**URL Parameters:**
- `id` (required): Repair job UUID

**Request Body:**
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "new_status": "Completed",
  "labor_fee": 150.00,
  "used_parts": [
    {
      "variant_id": "part-variant-uuid-1",
      "quantity": 1,
      "custom_price": 89.99
    },
    {
      "variant_id": "part-variant-uuid-2",
      "quantity": 2,
      "custom_price": 15.50
    }
  ]
}
```

**Required Fields:**
- `tenant_id` (string, UUID): Store/tenant identifier
- `new_status` (string): Target repair status

**Optional Fields:**
- `labor_fee` (number, ≥ 0): Labor cost for this update
- `used_parts` (array): Spare parts used in repair

**Used Parts Schema:**
- `variant_id` (string, UUID, required): Product variant ID
- `quantity` (integer, > 0, required): Quantity used
- `custom_price` (number, ≥ 0, optional): Override part price

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "repair": {
      "id": "repair-uuid",
      "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
      "job_no": "JOB-2025-0001",
      "customer_id": null,
      "customer_name": "John Doe",
      "customer_phone": "555-0123",
      "technician_id": null,
      "device_model": "iPhone 15 Pro Max",
      "serial_or_imei": "865123456789012",
      "issue_description": "Screen damaged with black spots",
      "status": "Completed",
      "estimated_cost": 299.99,
      "actual_cost": 254.98,
      "parts_cost": 104.98,
      "labor_cost": 150.00,
      "repair_start_date": "2025-12-20T16:00:00Z",
      "repair_completion_date": "2025-12-22T14:30:00Z",
      "delivery_date": null,
      "notes": "Customer requested rush repair",
      "created_at": "2025-12-20T15:30:00Z",
      "updated_at": "2025-12-22T14:30:00Z"
    },
    "parts_deducted": [
      {
        "variant_id": "part-variant-uuid-1",
        "part_name": "iPhone 15 Screen Assembly",
        "quantity_deducted": 1,
        "price_per_unit": 89.99,
        "total_cost": 89.99
      }
    ],
    "total_cost": {
      "labor_cost": 150.00,
      "parts_cost": 104.98,
      "actual_cost": 254.98
    }
  }
}
```

**Error Responses:**

**400 (Validation Error):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      "new_status is required and must be a string",
      "used_parts[0].quantity must be a positive integer"
    ]
  }
}
```

**404 (Repair Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "REPAIR_NOT_FOUND",
    "message": "Repair job with ID repair-uuid not found"
  }
}
```

**400 (Invalid State Transition):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition from Completed to Pending",
    "details": {
      "invalid_transition": {
        "current_status": "Completed",
        "requested_status": "Pending",
        "valid_transitions": ["Delivered"]
      }
    }
  }
}
```

**409 (Insufficient Inventory):**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_INVENTORY",
    "message": "Insufficient inventory for spare parts",
    "details": {
      "insufficient_inventory": [
        {
          "variant_id": "part-uuid",
          "part_name": "iPhone Screen",
          "requested": 2,
          "available": 1
        }
      ]
    }
  }
}
```

**500 (Transaction Error):**
```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_ERROR",
    "message": "Failed to complete repair status update"
  }
}
```

**Valid State Transitions:**
```
Pending → Diagnosing
Pending → Cancelled

Diagnosing → Parts Ordered
Diagnosing → In Progress
Diagnosing → Cancelled

Parts Ordered → In Progress
Parts Ordered → Cancelled

In Progress → Completed
In Progress → Cancelled

Completed → Delivered

Delivered → [Terminal]

Cancelled → [Terminal]
```

**Features:**
- State machine validation for repair status
- Automatic parts inventory deduction
- Cost breakdown (labor + parts = actual cost)
- Atomic transaction with inventory locking
- Race condition protection via SELECT...FOR UPDATE
- Support for custom part pricing
- Comprehensive cost tracking

---

## Error Codes Reference

### Common HTTP Status Codes
- `200` - Success (GET, PATCH)
- `201` - Created (POST)
- `400` - Bad Request (validation, invalid input)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (race conditions, invalid transitions, insufficient inventory)
- `500` - Internal Server Error

### Error Code Categories

**Validation Errors:**
- `INVALID_INPUT` - Missing or malformed input
- `VALIDATION_ERROR` - Field validation failed
- `INVALID_AMOUNT` - Amount validation failed
- `INVALID_PAYMENT_METHOD` - Invalid payment method

**Resource Errors:**
- `DEVICE_NOT_FOUND` - Device doesn't exist
- `REPAIR_NOT_FOUND` - Repair doesn't exist
- `INVALID_IMEI` - IMEI record invalid

**Business Logic Errors:**
- `DEVICE_NOT_AVAILABLE` - Device already sold or unavailable
- `INVALID_STATE_TRANSITION` - Invalid repair status transition
- `INSUFFICIENT_INVENTORY` - Not enough parts in stock

**Concurrency Errors:**
- `CONFLICT_DETECTED` - Device sold by another cashier
- `CONCURRENT_SALE_CONFLICT` - Concurrent sale detected

**System Errors:**
- `INTERNAL_SERVER_ERROR` - Unexpected server error
- `TRANSACTION_ERROR` - Database transaction failed
- `JOB_NUMBER_ERROR` - Job number generation failed

---

## Request/Response Format

### Standard Response Wrapper
All API responses follow a standard format:

**Success:**
```json
{
  "success": true,
  "data": { ... } or "sale": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [ ... ] or "details": { ... }
  }
}
```

### Data Types

**UUID Format:** `550e8400-e29b-41d4-a716-446655440000`

**ISO 8601 Timestamps:** `2025-12-20T15:30:00Z`

**Currency:** Numbers with 2 decimal places (e.g., `1299.99`)

**Status Strings:** Enum values (e.g., `Pending`, `Available`, `Sold`)

---

## Authentication & Authorization

Currently, all endpoints require:
- `tenant_id` parameter/field for multi-tenancy support
- Server-side validation of tenant ownership

Future implementations should add:
- JWT token validation
- Role-based access control (Admin, Manager, Cashier, Technician)
- API key authentication for integrations

---

## Rate Limiting

Not currently implemented. Consider adding:
- Per-tenant rate limits
- Per-endpoint rate limits
- Exponential backoff for retries

---

## Testing

### Test Scenarios Available

See `TESTING_REPAIR.md` and `POS_API_GUIDE.md` for comprehensive curl examples and test scenarios.

**Key Test Cases:**
1. IMEI scanning with various device statuses
2. Multi-device checkout with race conditions
3. Repair job lifecycle with parts deduction
4. Concurrent transaction handling
5. Invalid state transitions
6. Inventory conflicts

---

## Deployment Notes

- All endpoints are production-ready with comprehensive error handling
- Database transactions use SELECT...FOR UPDATE for concurrency control
- Timestamps are stored in UTC (ISO 8601)
- All monetary values are stored as numeric types with proper decimal precision
- Tenant isolation enforced at query level

