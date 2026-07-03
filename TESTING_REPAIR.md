# Repair Management API Testing Guide

## Overview

This guide provides comprehensive test scenarios for the Repair Job Sheet & Cost Calculation Engine.

**Endpoints:**
- `POST /api/v1/repair/jobs` - Create new repair job
- `PATCH /api/v1/repair/jobs/:id/status` - Update repair status with optional parts deduction

## Setup

### 1. Insert Test Data

```bash
# Add inventory stock for spare parts
curl -X POST "http://localhost:3000/api/v1/inventory/stock" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "variant_id": "50000000-0000-0000-0000-000000000001",
    "quantity_available": 10,
    "reorder_level": 2
  }'

# Get this variant_id from your product_variants table
# Example: SELECT id FROM product_variants LIMIT 1
```

## Test Scenarios

### Test 1: Create Repair Job (JOB-2026-0001)

**Expected:** Creates job with auto-generated unique job number

```bash
curl -X POST "http://localhost:3000/api/v1/repair/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "customer_name": "Ahmed Hassan",
    "customer_phone": "+971-50-1234567",
    "device_model": "iPhone 15 Pro Max",
    "serial_or_imei": "123456789012345",
    "issue_description": "Screen not responding, water damage visible",
    "estimated_cost": 500,
    "notes": "Urgent repair needed for business use"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "job_no": "JOB-2026-0001",
    "repair": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "job_no": "JOB-2026-0001",
      "status": "Pending",
      "customer_name": "Ahmed Hassan",
      "device_model": "iPhone 15 Pro Max",
      "estimated_cost": 500,
      "actual_cost": null,
      "parts_cost": 0,
      "labor_cost": 0,
      "created_at": "2026-07-03T10:30:00.000Z"
    }
  }
}
```

---

### Test 2: Transition Pending → Diagnosing

**Expected:** Status changes to Diagnosing, repair_start_date set

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440001/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Diagnosing"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "repair": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "job_no": "JOB-2026-0001",
      "status": "Diagnosing",
      "repair_start_date": "2026-07-03T10:32:00.000Z"
    }
  }
}
```

---

### Test 3: Transition Diagnosing → Completed (No Parts)

**Expected:** Status changes to Completed, actual_cost = labor_fee only

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440001/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Completed",
    "labor_fee": 200
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "repair": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "job_no": "JOB-2026-0001",
      "status": "Completed",
      "actual_cost": 200,
      "labor_cost": 200,
      "parts_cost": 0,
      "repair_completion_date": "2026-07-03T11:00:00.000Z"
    },
    "total_cost": {
      "labor_fee": 200,
      "parts_total": 0,
      "actual_cost": 200
    }
  }
}
```

---

### Test 4: Transition Diagnosing → Completed (With Parts)

**Expected:** Deducts spare parts from inventory, calculates total cost atomically

#### Step 4a: Create another repair job

```bash
curl -X POST "http://localhost:3000/api/v1/repair/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "customer_name": "Fatima Al-Mazrouei",
    "customer_phone": "+971-52-9876543",
    "device_model": "Samsung Galaxy S24",
    "serial_or_imei": "987654321098765",
    "issue_description": "Battery not charging, power button broken",
    "estimated_cost": 350
  }'
```

Response will have: `job_no: "JOB-2026-0002"`, ID: `550e8400-e29b-41d4-a716-446655440002`

#### Step 4b: Transition to Diagnosing

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440002/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Diagnosing"
  }'
```

#### Step 4c: Complete with parts deduction

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440002/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Completed",
    "labor_fee": 150,
    "used_parts": [
      {
        "variant_id": "50000000-0000-0000-0000-000000000001",
        "quantity": 2,
        "custom_price": 100
      }
    ]
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "repair": {
      "status": "Completed",
      "actual_cost": 350,
      "labor_cost": 150,
      "parts_cost": 200,
      "repair_completion_date": "2026-07-03T11:30:00.000Z"
    },
    "parts_deducted": [
      {
        "variant_id": "50000000-0000-0000-0000-000000000001",
        "quantity": 2,
        "unit_cost": 100,
        "total_cost": 200
      }
    ],
    "total_cost": {
      "labor_fee": 150,
      "parts_total": 200,
      "actual_cost": 350
    }
  }
}
```

**Inventory Effect:** `quantity_available` reduced from 10 to 8 for that variant

---

### Test 5: Insufficient Inventory (409 Conflict)

**Expected:** Returns 409 with detailed inventory shortage info

#### Step 5a: Create repair #3

```bash
curl -X POST "http://localhost:3000/api/v1/repair/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "customer_name": "Mohammed Al-Mansouri",
    "customer_phone": "+971-55-1111111",
    "device_model": "OnePlus 12",
    "serial_or_imei": "111111111111111",
    "issue_description": "Display broken, camera malfunction"
  }'
```

ID: `550e8400-e29b-41d4-a716-446655440003`

#### Step 5b: Transition to Diagnosing

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440003/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Diagnosing"
  }'
```

#### Step 5c: Try to complete with 10 parts (only 8 available)

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440003/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Completed",
    "labor_fee": 100,
    "used_parts": [
      {
        "variant_id": "50000000-0000-0000-0000-000000000001",
        "quantity": 10,
        "custom_price": 50
      }
    ]
  }'
```

**Expected Response (409 Conflict):**
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
          "available": 8
        }
      ]
    }
  }
}
```

**Important:** Repair status remains "Diagnosing" - transaction rolled back, nothing deducted

---

### Test 6: Invalid State Transition (400 Bad Request)

**Expected:** Returns 400 with valid transition options

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440001/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Pending"
  }'
```

**Expected Response (400 Bad Request):**
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

---

### Test 7: Full Workflow (Pending → Diagnosing → Awaiting_Parts → Completed)

**Expected:** State machine allows all transitions

#### Create repair #4

```bash
curl -X POST "http://localhost:3000/api/v1/repair/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "customer_name": "Layla Al-Qasimi",
    "customer_phone": "+971-58-2222222",
    "device_model": "Pixel 8 Pro",
    "serial_or_imei": "222222222222222",
    "issue_description": "Speaker not working, mic broken"
  }'
```

ID: `550e8400-e29b-41d4-a716-446655440004`

#### Pending → Diagnosing

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440004/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Diagnosing"
  }'
```

#### Diagnosing → Awaiting_Parts

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440004/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Awaiting_Parts"
  }'
```

#### Awaiting_Parts → Diagnosing (back if parts arrive)

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440004/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Diagnosing"
  }'
```

#### Diagnosing → Completed (with parts)

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440004/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Completed",
    "labor_fee": 75,
    "used_parts": [
      {
        "variant_id": "50000000-0000-0000-0000-000000000001",
        "quantity": 1,
        "custom_price": 75
      }
    ]
  }'
```

#### Completed → Delivered

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440004/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Delivered"
  }'
```

---

### Test 8: Donated/Discounted Parts (custom_price = 0)

**Expected:** Parts deducted but no cost added

```bash
curl -X POST "http://localhost:3000/api/v1/repair/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "customer_name": "Khaled Al-Suwaidi",
    "customer_phone": "+971-54-3333333",
    "device_model": "Xiaomi 14 Ultra",
    "serial_or_imei": "333333333333333",
    "issue_description": "Battery degraded"
  }'
```

ID: `550e8400-e29b-41d4-a716-446655440005`

#### Transition to Diagnosing

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440005/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Diagnosing"
  }'
```

#### Complete with donated part (custom_price: 0)

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440005/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Completed",
    "labor_fee": 50,
    "used_parts": [
      {
        "variant_id": "50000000-0000-0000-0000-000000000001",
        "quantity": 1,
        "custom_price": 0
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "repair": {
      "actual_cost": 50,
      "labor_cost": 50,
      "parts_cost": 0
    },
    "total_cost": {
      "labor_fee": 50,
      "parts_total": 0,
      "actual_cost": 50
    }
  }
}
```

---

### Test 9: Validation Errors

#### Missing required fields

```bash
curl -X POST "http://localhost:3000/api/v1/repair/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "customer_name": "Test"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      "customer_phone is required and must be non-empty",
      "device_model is required and must be non-empty",
      "serial_or_imei is required and must be between 5 and 20 characters",
      "issue_description is required and must be non-empty"
    ]
  }
}
```

#### Invalid quantity (parts array)

```bash
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440001/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Completed",
    "labor_fee": 100,
    "used_parts": [
      {
        "variant_id": "50000000-0000-0000-0000-000000000001",
        "quantity": -5
      }
    ]
  }'
```

**Expected Response (400 Bad Request):**
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

---

## State Machine Diagram

```
                    Pending
                      |
                      v
                  Diagnosing
                    /      \
                   v        v
            Awaiting_Parts  Completed
                   |          |
                   v          v
               Diagnosing   Delivered
                   |
                   v
               Completed
                   |
                   v
               Delivered
```

**Valid Transitions:**
- `Pending` → `Diagnosing`
- `Diagnosing` → `Awaiting_Parts` OR `Completed`
- `Awaiting_Parts` → `Diagnosing` OR `Completed`
- `Completed` → `Delivered`
- `Delivered` → (terminal, no further transitions)

---

## Database Queries for Verification

```sql
-- Check job numbers generated
SELECT job_no, customer_name, status FROM repairs ORDER BY created_at DESC;

-- Check inventory after parts deduction
SELECT variant_id, quantity_available FROM inventory_stock ORDER BY variant_id;

-- Check all parts used in repairs
SELECT r.job_no, rp.part_name, rp.quantity, rp.unit_cost, rp.total_cost
FROM repairs r
JOIN repair_parts rp ON r.id = rp.repair_id
ORDER BY rp.created_at DESC;

-- Audit trail for specific repair
SELECT operation, old_values, new_values, created_at
FROM audit_logs
WHERE table_name = 'repairs' AND record_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY created_at;
```

---

## Performance Expectations

| Metric | Expected |
|--------|----------|
| Create job | < 100ms |
| Status update (no parts) | < 150ms |
| Status update (with parts) | < 500ms |
| Job number generation | < 50ms (atomic) |
| Inventory deduction | < 200ms (locked) |

---

## Concurrency Testing

### Scenario: Two technicians complete repair simultaneously

```bash
# Terminal 1: Start update for repair #1
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440001/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Completed",
    "labor_fee": 100,
    "used_parts": [
      {
        "variant_id": "50000000-0000-0000-0000-000000000001",
        "quantity": 5
      }
    ]
  }'

# Terminal 2: Same request on same repair (immediately)
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/550e8400-e29b-41d4-a716-446655440001/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "Completed",
    "labor_fee": 100,
    "used_parts": [
      {
        "variant_id": "50000000-0000-0000-0000-000000000001",
        "quantity": 5
      }
    ]
  }'
```

**Expected Result:**
- First request: 200 OK, inventory deducted
- Second request: 400 Bad Request (invalid transition: already Completed)
- Total inventory deducted: Only 5 (not 10)
- **Protection:** SELECT...FOR UPDATE prevents race condition
