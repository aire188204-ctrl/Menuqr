# Repair Management API Guide

Complete reference for the Mobile Phone Repair Tracking & Cost Calculation Engine.

## Table of Contents

1. [Overview](#overview)
2. [Endpoints](#endpoints)
3. [Data Models](#data-models)
4. [Error Handling](#error-handling)
5. [State Machine](#state-machine)
6. [Cost Calculation](#cost-calculation)
7. [Race Condition Protection](#race-condition-protection)
8. [Examples](#examples)

---

## Overview

The Repair Management API provides:

- **Job Creation** with automatic unique job number generation (JOB-2026-0001 format)
- **Status Workflow** with state machine validation (Pending → Diagnosing → Completed → Delivered)
- **Parts Inventory Integration** with atomic deduction when repairs are completed
- **Cost Calculation Engine** supporting labor fees + parts costs with custom pricing
- **Concurrency Protection** using row-level locking to prevent race conditions

### Key Features

| Feature | Description |
|---------|-------------|
| **Job Numbers** | Atomic generation ensures uniqueness per year per tenant |
| **State Machine** | Validates all status transitions, rejects invalid ones |
| **Parts Deduction** | Atomic transaction: stock validation → deduction → cost calc → status update |
| **Inventory Locking** | SELECT...FOR UPDATE prevents concurrent double-deduction |
| **Audit Trail** | All status changes and inventory movements logged |
| **Custom Pricing** | Support for donated/discounted/override part prices |

---

## Endpoints

### 1. Create Repair Job

**POST** `/api/v1/repair/jobs`

Create a new repair job with auto-generated job number.

#### Request

```json
{
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "customer_name": "Ahmed Hassan",
  "customer_phone": "+971-50-1234567",
  "device_model": "iPhone 15 Pro Max",
  "serial_or_imei": "123456789012345",
  "issue_description": "Screen not responding, water damage visible",
  "estimated_cost": 500.00,
  "customer_id": "20000000-0000-0000-0000-000000000001",
  "technician_id": "70000000-0000-0000-0000-000000000001",
  "notes": "Urgent repair needed for business use"
}
```

#### Required Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `tenant_id` | UUID | Required | Tenant identifier for multi-tenant isolation |
| `customer_name` | string | Required, non-empty | Full name of customer |
| `customer_phone` | string | Required, non-empty | Contact phone number |
| `device_model` | string | Required, non-empty | Device model (iPhone 15 Pro Max, Samsung Galaxy S24, etc.) |
| `serial_or_imei` | string | Required, 5-20 chars | Device serial number or IMEI |
| `issue_description` | string | Required, non-empty | Detailed issue description |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `estimated_cost` | number | Initial cost estimate (can update later) |
| `customer_id` | UUID | Link to existing customer record |
| `technician_id` | UUID | Assign technician on creation |
| `notes` | string | Internal notes or special instructions |

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "job_no": "JOB-2026-0001",
    "repair": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "tenant_id": "00000000-0000-0000-0000-000000000001",
      "job_no": "JOB-2026-0001",
      "customer_id": "20000000-0000-0000-0000-000000000001",
      "customer_name": "Ahmed Hassan",
      "customer_phone": "+971-50-1234567",
      "technician_id": "70000000-0000-0000-0000-000000000001",
      "device_model": "iPhone 15 Pro Max",
      "serial_or_imei": "123456789012345",
      "issue_description": "Screen not responding, water damage visible",
      "status": "Pending",
      "estimated_cost": 500.00,
      "actual_cost": null,
      "parts_cost": 0,
      "labor_cost": 0,
      "repair_start_date": null,
      "repair_completion_date": null,
      "delivery_date": null,
      "notes": "Urgent repair needed for business use",
      "created_at": "2026-07-03T10:30:00.000Z",
      "updated_at": "2026-07-03T10:30:00.000Z"
    }
  }
}
```

#### Error Responses

**400 Bad Request** - Validation Error

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

**409 Conflict** - Job Number Generation Failed

```json
{
  "success": false,
  "error": {
    "code": "JOB_NUMBER_ERROR",
    "message": "Failed to generate unique job number"
  }
}
```

**500 Internal Server Error**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

### 2. Update Repair Status

**PATCH** `/api/v1/repair/jobs/:id/status`

Update repair status with optional parts deduction and cost calculation.

#### Request

```json
{
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "new_status": "Completed",
  "labor_fee": 150.00,
  "used_parts": [
    {
      "variant_id": "50000000-0000-0000-0000-000000000001",
      "quantity": 2,
      "custom_price": 100.00
    },
    {
      "variant_id": "50000000-0000-0000-0000-000000000002",
      "quantity": 1,
      "custom_price": 0
    }
  ],
  "notes": "Repair completed, tested for 2 hours"
}
```

#### Required Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `tenant_id` | UUID | Required | Tenant identifier |
| `new_status` | string | Required, valid status | Target status (Diagnosing, Awaiting_Parts, Completed, Delivered) |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `labor_fee` | number | Labor cost (only used if moving to Completed) |
| `used_parts` | array | Array of parts deducted from inventory |
| `notes` | string | Update notes |

#### Used Parts Format

```json
{
  "variant_id": "50000000-0000-0000-0000-000000000001",
  "quantity": 2,
  "custom_price": 100.00
}
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `variant_id` | UUID | Required | Product variant ID (spare part) |
| `quantity` | integer | Required, > 0 | Number of units used |
| `custom_price` | number | Optional, ≥ 0 | Override unit price (for donations/discounts) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "repair": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "tenant_id": "00000000-0000-0000-0000-000000000001",
      "job_no": "JOB-2026-0001",
      "customer_id": "20000000-0000-0000-0000-000000000001",
      "customer_name": "Ahmed Hassan",
      "device_model": "iPhone 15 Pro Max",
      "status": "Completed",
      "estimated_cost": 500.00,
      "actual_cost": 350.00,
      "parts_cost": 200.00,
      "labor_cost": 150.00,
      "repair_start_date": "2026-07-03T10:35:00.000Z",
      "repair_completion_date": "2026-07-03T15:00:00.000Z",
      "created_at": "2026-07-03T10:30:00.000Z",
      "updated_at": "2026-07-03T15:00:00.000Z"
    },
    "parts_deducted": [
      {
        "variant_id": "50000000-0000-0000-0000-000000000001",
        "quantity": 2,
        "unit_cost": 100.00,
        "total_cost": 200.00
      },
      {
        "variant_id": "50000000-0000-0000-0000-000000000002",
        "quantity": 1,
        "unit_cost": 0,
        "total_cost": 0
      }
    ],
    "total_cost": {
      "labor_fee": 150.00,
      "parts_total": 200.00,
      "actual_cost": 350.00
    }
  }
}
```

#### Error Responses

**400 Bad Request** - Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      "used_parts[0].quantity must be a positive integer"
    ]
  }
}
```

**400 Bad Request** - Invalid State Transition

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

**404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "REPAIR_NOT_FOUND",
    "message": "Repair job with ID ... not found"
  }
}
```

**409 Conflict** - Insufficient Inventory

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_INVENTORY",
    "message": "One or more parts have insufficient stock",
    "details": {
      "insufficient_inventory": [
        {
          "variant_id": "50000000-0000-0000-0000-000000000001",
          "requested": 10,
          "available": 5
        }
      ]
    }
  }
}
```

**500 Internal Server Error** - Transaction Failure

```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_ERROR",
    "message": "Failed to complete repair status update"
  }
}
```

---

## Data Models

### Repair Object

```typescript
interface Repair {
  id: UUID;
  tenant_id: UUID;
  job_no: string;                    // e.g., "JOB-2026-0001"
  customer_id?: UUID;
  customer_name: string;
  customer_phone: string;
  technician_id?: UUID;
  device_model: string;
  serial_or_imei: string;
  issue_description: string;
  status: RepairStatus;              // Pending | Diagnosing | Awaiting_Parts | Completed | Delivered
  estimated_cost?: number;
  actual_cost?: number;
  parts_cost: number;
  labor_cost: number;
  repair_start_date?: string;        // ISO 8601 datetime
  repair_completion_date?: string;   // ISO 8601 datetime
  delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

### RepairPart Object

```typescript
interface RepairPart {
  id: UUID;
  tenant_id: UUID;
  repair_id: UUID;
  part_name: string;                // Variant ID or part identifier
  quantity: number;
  unit_cost: number;
  total_cost: number;                // quantity × unit_cost
  supplier?: string;
  notes?: string;
  created_at: string;
}
```

### InventoryStock Object

```typescript
interface InventoryStock {
  id: UUID;
  tenant_id: UUID;
  variant_id: UUID;
  quantity_available: number;
  reorder_level: number;
  last_restock_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | OK | Status updated successfully |
| 201 | Created | Repair job created successfully |
| 400 | Bad Request | Validation error or invalid state transition |
| 404 | Not Found | Repair job or variant not found |
| 409 | Conflict | Insufficient inventory or job number conflict |
| 500 | Server Error | Database error or transaction failure |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} or []
  }
}
```

### Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `REPAIR_NOT_FOUND` | 404 | Repair job doesn't exist |
| `INVALID_STATE_TRANSITION` | 400 | Status transition not allowed |
| `INSUFFICIENT_INVENTORY` | 409 | Not enough parts in stock |
| `JOB_NUMBER_ERROR` | 409 | Failed to generate job number |
| `TRANSACTION_ERROR` | 500 | Database transaction failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## State Machine

### Valid Transitions

```
┌─────────┐
│ Pending │
└────┬────┘
     │
     v
┌──────────────┐
│  Diagnosing  │
└┬────────────┬┘
 │            │
 │            v
 │    ┌──────────────────┐
 │    │  Awaiting_Parts  │
 │    └──────────────────┘
 │            │
 v            v
┌───────────────┐
│   Completed   │
└───────┬───────┘
        │
        v
┌───────────┐
│ Delivered │ (Terminal)
└───────────┘
```

### Detailed Rules

| From | To | Allowed | Notes |
|------|----|---------|----|
| Pending | Diagnosing | ✅ | Work starts |
| Diagnosing | Awaiting_Parts | ✅ | Waiting for parts |
| Diagnosing | Completed | ✅ | Can complete directly |
| Awaiting_Parts | Diagnosing | ✅ | Parts arrived, resume work |
| Awaiting_Parts | Completed | ✅ | Can complete directly |
| Completed | Delivered | ✅ | Job done, delivered |
| Delivered | (any) | ❌ | Terminal state |
| Any | Pending | ❌ | No backwards transition |

---

## Cost Calculation

### Formula

```
actual_cost = labor_fee + parts_total

parts_total = SUM(parts[i].quantity × parts[i].custom_price)
```

### Examples

#### Example 1: Labor Only

```json
{
  "new_status": "Completed",
  "labor_fee": 200
}
```

Result:
```
actual_cost = 200 + 0 = 200
labor_cost = 200
parts_cost = 0
```

#### Example 2: Labor + Parts

```json
{
  "new_status": "Completed",
  "labor_fee": 150,
  "used_parts": [
    {
      "variant_id": "...",
      "quantity": 2,
      "custom_price": 100
    },
    {
      "variant_id": "...",
      "quantity": 1,
      "custom_price": 50
    }
  ]
}
```

Result:
```
parts_total = (2 × 100) + (1 × 50) = 250
actual_cost = 150 + 250 = 400
labor_cost = 150
parts_cost = 250
```

#### Example 3: Donated Parts

```json
{
  "new_status": "Completed",
  "labor_fee": 75,
  "used_parts": [
    {
      "variant_id": "...",
      "quantity": 1,
      "custom_price": 0
    }
  ]
}
```

Result:
```
parts_total = 1 × 0 = 0
actual_cost = 75 + 0 = 75
labor_cost = 75
parts_cost = 0
```

---

## Race Condition Protection

### Problem Scenario

Two technicians complete a repair simultaneously, both using the same spare part:

```
Tech A                          Tech B
|                               |
|-- PATCH /status (part qty=5)  |
|   Check: 10 available ✓       |
|                               |-- PATCH /status (part qty=5)
|                               |   Check: 10 available ✓
|   Deduct 5 (now 5)            |
|   Update status ✓             |
|                               |   Deduct 5 (should be 5, not 10!) ✗
|                               |   Update status ✗
```

### Solution: SELECT...FOR UPDATE

```sql
-- In transaction:
SELECT * FROM inventory_stock
WHERE variant_id = ... 
FOR UPDATE  -- Locks row immediately

-- Tech A locks row, Tech B waits
-- Tech A completes, Tech B recalculates
-- Tech B sees 5 available (not 10), returns 409 if needed
```

### Example Response (Race Condition Prevented)

**Request 1 (Tech A):** 200 OK - Deducted 5 parts

**Request 2 (Tech B - immediately after):** 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_INVENTORY",
    "message": "One or more parts have insufficient stock",
    "details": {
      "insufficient_inventory": [
        {
          "variant_id": "...",
          "requested": 5,
          "available": 5
        }
      ]
    }
  }
}
```

---

## Examples

### Complete Workflow: Create → Diagnose → Complete → Deliver

#### 1. Create Job

```bash
curl -X POST "http://localhost:3000/api/v1/repair/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "customer_name": "Ahmed Hassan",
    "customer_phone": "+971-50-1234567",
    "device_model": "iPhone 15 Pro Max",
    "serial_or_imei": "123456789012345",
    "issue_description": "Screen not responding",
    "estimated_cost": 500
  }'
```

Response: `job_no: "JOB-2026-0001"`, Status: `Pending`

#### 2. Start Diagnosis

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440001/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Diagnosing"
  }'
```

Response: Status: `Diagnosing`, `repair_start_date` set

#### 3. Complete with Parts

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440001/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Completed",
    "labor_fee": 150,
    "used_parts": [
      {
        "variant_id": "50000000-0000-0000-0000-000000000001",
        "quantity": 1,
        "custom_price": 300
      }
    ]
  }'
```

Response:
- Status: `Completed`
- `actual_cost: 450` (150 labor + 300 parts)
- Inventory deducted atomically

#### 4. Mark as Delivered

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440001/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Delivered"
  }'
```

Response: Status: `Delivered` (terminal state)

---

## Database Schema

### repairs table

```sql
CREATE TABLE repairs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  job_no VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  technician_id UUID,
  device_model VARCHAR(255) NOT NULL,
  serial_or_imei VARCHAR(100),
  issue_description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  parts_cost DECIMAL(12,2),
  labor_cost DECIMAL(12,2),
  repair_start_date TIMESTAMP,
  repair_completion_date TIMESTAMP,
  delivery_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

### repair_parts table

```sql
CREATE TABLE repair_parts (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  repair_id UUID NOT NULL REFERENCES repairs,
  part_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  supplier VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP NOT NULL
);
```

### inventory_stock table

```sql
CREATE TABLE inventory_stock (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  variant_id UUID NOT NULL REFERENCES product_variants,
  quantity_available INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL,
  last_restock_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE(tenant_id, variant_id)
);
```

### job_number_sequences table

```sql
CREATE TABLE job_number_sequences (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  year INT NOT NULL,
  next_sequence INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE(tenant_id, year)
);
```

---

## Performance Metrics

| Operation | Typical Time | Notes |
|-----------|--------------|-------|
| Create job | < 100ms | Includes job number generation |
| Status update (no parts) | < 150ms | Simple state transition |
| Status update (with parts) | < 500ms | Inventory lock + deduction |
| Inventory check | < 50ms | Index on (tenant_id, variant_id) |
| Job number generation | < 50ms | Atomic UPSERT pattern |

---

## Best Practices

1. **Always include `tenant_id`** - Required for multi-tenant isolation
2. **Validate custom_price >= 0** - Negative costs cause calculation errors
3. **Handle 409 Conflict gracefully** - Retry logic for inventory conflicts
4. **Log all status changes** - Useful for troubleshooting and audits
5. **Set labor_fee only when completing** - Other transitions ignore this field
6. **Use existing customer_id if available** - Avoids duplicate customer records
7. **Assign technician early** - Helps with resource management
8. **Document special cases** - Use notes field for deviations from estimates
