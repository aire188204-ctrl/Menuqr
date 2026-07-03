# CellPhone POS System - Complete User Guide

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Dashboard Features](#dashboard-features)
4. [Sales Workflow](#sales-workflow)
5. [Repair Management](#repair-management)
6. [API Endpoints](#api-endpoints)
7. [Testing & Examples](#testing--examples)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The CellPhone POS (Point of Sale) System is a production-ready platform for managing mobile phone sales and repairs. Built with Next.js 16, Neon PostgreSQL, and Electric Black design theme, it provides:

- **IMEI Scanning** - Validate devices with laser scanner support
- **Sales Management** - Create invoices and process checkout transactions
- **Repair Tracking** - Manage repair jobs with state machine validation
- **Multi-Tenancy** - Support multiple business locations
- **Real-time Sync** - Live database updates with Neon PostgreSQL
- **Premium UI** - Glassmorphic design with neon accents

### Key Metrics
- Atomic transactions with race condition protection
- Auto-generated job numbers (JOB-2025-XXXX format)
- Support for parts inventory deduction
- Comprehensive error handling
- Full audit trail for all operations

---

## Getting Started

### System Requirements
- Node.js 18+ or pnpm
- Neon PostgreSQL database
- Modern browser (Chrome, Firefox, Safari, Edge)
- HTTPS for production deployment

### Initial Setup

1. **Access the Dashboard**
   - Navigate to `http://localhost:3000` (development)
   - Live status badge shows "Active" when operational
   - Tenant ID displayed in header (first 8 characters)

2. **Verify System Status**
   - Check the "System Status: Operational" card
   - All services running normally indicates database sync
   - Green badge confirms operational state

3. **Prepare for Operations**
   - Have IMEI numbers ready for device scanning
   - Customer information (name, phone) for repairs
   - Device models for inventory tracking

---

## Dashboard Features

### Header Section
- **Logo & Title** - CellPhone POS with Electric Cyan glow
- **Live Badge** - Shows operational status with indicator dot
- **Tenant ID** - Current business location identifier
- **Navigation** - Quick access to all system features

### Welcome Section
- **New Repair Job Button** - Opens repair form modal
- **View Inventory Button** - Access device inventory (expandable)
- **Quick Stats** - Display key metrics at a glance

### System Status Card
- **Operational Indicator** - Green status badge
- **Service Health** - Database sync confirmation
- **Last Update** - Timestamp of last successful sync

### Features Grid
- **IMEI/Serial Scanning** - Hardware scanner or manual input
- **Invoice Cart** - Real-time shopping cart with totals
- **Repair Job Management** - Create and track repairs
- **Inventory Integration** - Track stock levels
- **Multi-Tenancy** - Manage multiple locations
- **Atomic Transactions** - Race-condition protected sales

### Documentation Links
- POS API Guide - Sales & IMEI scanning reference
- Repair API Guide - Repair management API
- Testing Guide - Complete test scenarios

---

## Sales Workflow

### Step 1: IMEI Scanning

#### Using Hardware Laser Scanner
1. Click the IMEI Scanner input field
2. Activate laser scanner on device
3. Scan device barcode/IMEI
4. System auto-validates and loads device info
5. Device appears in cart with pricing

#### Manual Input
1. Click IMEI Scanner field
2. Type or paste IMEI/Serial number
3. Click "Scan" button or press Enter
4. Validation occurs automatically
5. Device data loads from database

**Visual Feedback:**
- **Idle State** - Continuous laser animation (cyan horizontal sweep)
- **Focus State** - Enhanced focus glow with dual laser animations
- **Valid Scan** - Green success toast with device details
- **Invalid Scan** - Red error toast with validation reason

### Step 2: Cart Management

#### Adding Devices
1. Successfully scanned device automatically adds to cart
2. Item appears in "Invoice Cart" section
3. Each item shows: Device model, IMEI, Selling price

#### Viewing Cart Summary
- **Item Count** - Badge shows number of items
- **Subtotal** - Sum of all selling prices
- **Tax** - Calculated at 10% of subtotal
- **Total** - Final amount (subtotal + tax)

#### Managing Items
- **View Details** - Hover on item to see full IMEI
- **Remove Item** - Click trash icon to remove from cart
- **Clear Cart** - Red "Clear" button removes all items

### Step 3: Checkout Process

#### Initiating Checkout
1. Click cyan "Checkout" button in cart
2. System validates all items in cart
3. Confirms customer payment method
4. Processes atomic transaction

#### Transaction Details
- **Customer ID** - Auto-assigned or manual entry
- **Payment Method** - Cash, Card, Digital (configurable)
- **Transaction ID** - Unique identifier generated
- **Timestamp** - Recorded for audit trail

#### Checkout Response
Success (200 OK):
```json
{
  "success": true,
  "transaction_id": "TXN-2025-001234",
  "invoice_number": "INV-2025-001234",
  "items_processed": 5,
  "total_amount": 1650.00,
  "tax_amount": 150.00,
  "status": "completed",
  "timestamp": "2025-01-15T14:32:00Z"
}
```

#### Error Handling
- **Out of Stock** - Item quantity exceeded
- **Invalid IMEI** - Device not found in inventory
- **Price Mismatch** - Unit cost changed (retry required)
- **Race Condition** - Multiple concurrent transactions (automatic retry)

---

## Repair Management

### Step 1: Create Repair Job

#### Opening Repair Form
1. Click "New Repair Job" button in welcome section
2. Purple TiltCard modal appears with form
3. All fields marked with red asterisk (*) are required

#### Form Fields

**Customer Information:**
- **Customer Name** - Full name (required)
- **Customer Phone** - Contact number (required)

**Device Information:**
- **Device Model** - Phone model/brand (required)
- **Serial or IMEI** - Device identifier (required)

**Service Details:**
- **Issue Description** - Problem description (optional, multiline)
- **Estimated Cost** - Labor + parts estimate (optional)

#### Form Validation
- All required fields must be filled before submission
- IMEI/Serial auto-validates against database
- Estimated cost must be positive number if provided
- Phone number format validation

### Step 2: Auto Job Number Generation

When repair job is created successfully:
- **Format** - JOB-YYYY-XXXX (e.g., JOB-2025-0001)
- **Auto-Increment** - Sequential numbering per year
- **Uniqueness** - Guaranteed unique per tenant
- **Reference** - Used for all repair communications

### Step 3: Track Repair Status

#### Repair Status States

1. **Pending** (Initial State)
   - Job created, awaiting service start
   - No labor or parts assigned yet

2. **In Progress**
   - Service work underway
   - Parts can be added to inventory deduction
   - Labor hours can be logged

3. **On Hold**
   - Awaiting parts delivery
   - Customer approval needed
   - No charges accruing

4. **Ready for Pickup**
   - Service complete
   - Final costs calculated
   - Ready for customer notification

5. **Completed**
   - Customer picked up device
   - Final payment processed
   - Job archived

6. **Cancelled**
   - Job terminated
   - Refunds processed if applicable
   - Archived without completion

#### Status Transition Rules
- Can only move forward in sequence (no backwards)
- State machine validation prevents invalid transitions
- Labor fees must be set before status update
- Used parts must be documented

### Step 4: Update Repair Job

#### Adding Labor
1. Open repair job
2. Enter labor amount (hourly rate × hours)
3. System validates positive amount
4. Updates job cost total

#### Recording Used Parts
1. Select parts from inventory
2. Enter quantity used
3. System deducts from inventory
4. Adds to repair cost

#### Status Update
1. Review current status
2. Select new status from dropdown
3. Confirm any cost changes
4. Submit update
5. Timestamp recorded automatically

#### Update Response
Success (200 OK):
```json
{
  "success": true,
  "job_id": "job-uuid-1234",
  "job_number": "JOB-2025-0045",
  "previous_status": "In Progress",
  "new_status": "Ready for Pickup",
  "labor_fee": 75.00,
  "used_parts": [
    { "part_id": "SCREEN-001", "quantity": 1, "cost": 120.00 },
    { "part_id": "BATTERY-001", "quantity": 1, "cost": 35.00 }
  ],
  "total_cost": 230.00,
  "updated_at": "2025-01-15T15:45:00Z"
}
```

---

## API Endpoints

### Authentication & Base URL
- **Base URL** - `http://localhost:3000/api/v1`
- **Headers** - `Content-Type: application/json`
- **Tenant ID** - Include in request body or query params

### POS Sales APIs

#### 1. Scan Product by IMEI/Serial
```
GET /pos/products/scan/[imei_or_serial]?tenant_id=<uuid>

Response (200 OK):
{
  "device_id": "uuid-1234",
  "imei_1": "358151041234567",
  "imei_2": null,
  "device_model": "iPhone 13 Pro Max",
  "color": "Space Black",
  "storage": "256GB",
  "condition": "Used",
  "buying_price": 650.00,
  "selling_price": 899.99,
  "quantity_available": 5,
  "last_updated": "2025-01-15T10:00:00Z"
}

Error (404 Not Found):
{
  "success": false,
  "error": "Device not found",
  "error_code": "DEVICE_NOT_FOUND"
}
```

#### 2. Checkout - Process Sale
```
POST /pos/sales/checkout

Request Body:
{
  "tenant_id": "tenant-uuid-1234",
  "customer_id": "customer-uuid-5678",
  "payment_method": "cash",
  "imei_ids": [
    "358151041234567",
    "358151041234568",
    "358151041234569"
  ],
  "subtotal": 2699.97,
  "tax": 270.00,
  "discount": 0
}

Response (200 OK):
{
  "success": true,
  "transaction_id": "TXN-2025-001234",
  "invoice_number": "INV-2025-001234",
  "items_processed": 3,
  "total_amount": 2969.97,
  "tax_amount": 270.00,
  "status": "completed",
  "timestamp": "2025-01-15T14:32:00Z"
}

Error (409 Conflict - Race Condition):
{
  "success": false,
  "error": "Item sold by another transaction",
  "error_code": "RACE_CONDITION_DETECTED",
  "affected_items": ["358151041234567"]
}
```

### Repair Management APIs

#### 1. Create Repair Job
```
POST /repair/jobs

Request Body:
{
  "tenant_id": "tenant-uuid-1234",
  "customer_name": "John Doe",
  "customer_phone": "+1-555-123-4567",
  "device_model": "Samsung Galaxy S21",
  "serial_or_imei": "358151041234570",
  "issue_description": "Screen cracked, battery not holding charge",
  "estimated_cost": 200.00
}

Response (201 Created):
{
  "success": true,
  "job_id": "job-uuid-9999",
  "job_number": "JOB-2025-0127",
  "customer_name": "John Doe",
  "device_model": "Samsung Galaxy S21",
  "status": "Pending",
  "created_at": "2025-01-15T11:20:00Z",
  "estimated_completion": "2025-01-17T11:20:00Z"
}

Error (400 Bad Request):
{
  "success": false,
  "error": "Missing required field: customer_name",
  "error_code": "VALIDATION_ERROR",
  "details": {
    "customer_name": "Required",
    "customer_phone": "Required",
    "device_model": "Required"
  }
}
```

#### 2. Update Repair Job Status
```
PATCH /repair/jobs/[job_id]/status

Request Body:
{
  "tenant_id": "tenant-uuid-1234",
  "new_status": "Ready for Pickup",
  "labor_fee": 75.00,
  "used_parts": [
    {
      "part_id": "SCREEN-001",
      "quantity": 1,
      "unit_cost": 120.00
    }
  ]
}

Response (200 OK):
{
  "success": true,
  "job_id": "job-uuid-9999",
  "job_number": "JOB-2025-0127",
  "previous_status": "In Progress",
  "new_status": "Ready for Pickup",
  "labor_fee": 75.00,
  "parts_cost": 120.00,
  "total_cost": 195.00,
  "updated_at": "2025-01-15T15:45:00Z"
}

Error (422 Unprocessable Entity - Invalid Transition):
{
  "success": false,
  "error": "Invalid status transition",
  "error_code": "INVALID_STATUS_TRANSITION",
  "current_status": "Pending",
  "requested_status": "Completed",
  "valid_transitions": ["In Progress", "Cancelled"]
}
```

---

## Testing & Examples

### cURL Examples

#### Test IMEI Scan
```bash
curl -X GET \
  "http://localhost:3000/api/v1/pos/products/scan/358151041234567?tenant_id=tenant-uuid-1234" \
  -H "Content-Type: application/json"
```

#### Test Checkout Transaction
```bash
curl -X POST \
  "http://localhost:3000/api/v1/pos/sales/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "tenant-uuid-1234",
    "customer_id": "customer-uuid-5678",
    "payment_method": "cash",
    "imei_ids": ["358151041234567", "358151041234568"],
    "subtotal": 1799.98,
    "tax": 180.00,
    "discount": 0
  }'
```

#### Test Create Repair Job
```bash
curl -X POST \
  "http://localhost:3000/api/v1/repair/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "tenant-uuid-1234",
    "customer_name": "Jane Smith",
    "customer_phone": "+1-555-987-6543",
    "device_model": "OnePlus 9 Pro",
    "serial_or_imei": "358151041234571",
    "issue_description": "Water damage, phone not turning on",
    "estimated_cost": 150.00
  }'
```

#### Test Update Repair Status
```bash
curl -X PATCH \
  "http://localhost:3000/api/v1/repair/jobs/job-uuid-9999/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "tenant-uuid-1234",
    "new_status": "In Progress",
    "labor_fee": 50.00,
    "used_parts": [
      {
        "part_id": "CHARGING-PORT-001",
        "quantity": 1,
        "unit_cost": 45.00
      }
    ]
  }'
```

### Test Scenarios

#### Scenario 1: Complete Sale (Happy Path)
1. Scan valid IMEI → Device loaded ✓
2. Scan second IMEI → Added to cart ✓
3. View cart → 2 items, subtotal $1799.98 ✓
4. Click Checkout → Transaction processed ✓
5. Verify invoice → Transaction ID generated ✓

#### Scenario 2: Race Condition Handling
1. User A scans IMEI "358151041234567" 
2. User B scans same IMEI simultaneously
3. User A clicks Checkout first → Success
4. User B clicks Checkout → Error: RACE_CONDITION_DETECTED
5. User B cart updates, item removed ✓

#### Scenario 3: Full Repair Workflow
1. Create repair job for iPhone 13 → JOB-2025-0128 ✓
2. Status: "Pending" with estimated completion date ✓
3. Update status to "In Progress", add labor $60 ✓
4. Record used parts (screen $150) → Total cost $210 ✓
5. Update to "Ready for Pickup" → Customer notified ✓
6. Update to "Completed" → Job archived ✓

#### Scenario 4: Invalid Status Transition
1. Create repair job → Status "Pending" ✓
2. Attempt to transition to "Completed" directly ✗
3. Error: Invalid transition, must go through "In Progress" ✓
4. Transition to "In Progress" → Success ✓
5. Transition to "Completed" → Success ✓

---

## Troubleshooting

### Common Issues

#### 1. IMEI Scanner Not Working
**Problem:** Scanner field won't accept input or laser animation not showing

**Solutions:**
- Clear browser cache (Ctrl+Shift+Delete)
- Refresh page (F5)
- Check system status card shows "Operational"
- For hardware scanner: Verify USB connection
- Try manual input as fallback

#### 2. Checkout Fails with Race Condition
**Problem:** Error: "Item sold by another transaction"

**Solutions:**
- Refresh cart (clears stale items)
- Rescan devices to validate current inventory
- Clear cart and start fresh scan sequence
- Check inventory levels in system
- Try again after 2-3 seconds if high volume

#### 3. Repair Job Creation Fails
**Problem:** Form won't submit, validation errors appear

**Solutions:**
- Verify all required fields filled (red asterisks)
- Phone number format: +1-555-123-4567 or (555) 123-4567
- Device model must exist in inventory
- IMEI/Serial must be 15+ digits
- Check browser console for detailed error

#### 4. Status Update Shows Invalid Transition
**Problem:** "Invalid status transition" error

**Solutions:**
- Follow status sequence: Pending → In Progress → Ready for Pickup → Completed
- Cannot skip status levels
- Cannot move backwards in status
- Cancelled can be triggered from Pending or In Progress only
- Review current status in job details

#### 5. Database Connection Issues
**Problem:** "All services running normally" badge becomes red, operations fail

**Solutions:**
- Check Neon PostgreSQL connection string
- Verify database credentials in environment
- Check network connectivity
- Restart dev server: `pnpm dev`
- Check server logs for specific error

#### 6. Payment Method Not Accepted
**Problem:** Checkout fails with payment error

**Solutions:**
- Verify payment method is supported (cash, card, digital)
- Check if customer account has payment method on file
- For card payments: Verify card not expired
- For digital payments: Check payment gateway status
- Contact admin for payment configuration

### Performance Tips

1. **Optimize Scanning Speed**
   - Use hardware laser scanner (faster than manual)
   - Batch scan devices before checkout
   - Clear cart between major transactions

2. **Improve System Responsiveness**
   - Monitor open jobs (archive old repairs)
   - Regular database maintenance
   - Clear browser cache weekly
   - Use modern browser version

3. **Reduce Transaction Errors**
   - Verify inventory before scanning
   - Confirm device availability
   - Process one transaction at a time in high-volume periods
   - Use retry mechanism for network issues

### Getting Help

**Documentation:**
- `/POS_API_GUIDE.md` - API reference
- `/REPAIR_API_GUIDE.md` - Repair API details
- `/TESTING_REPAIR.md` - Test scenarios

**System Health:**
- Check "System Status" card on dashboard
- Verify tenant ID and database connection
- Monitor error toasts for specific issues

**Logs & Debugging:**
- Browser console (F12) shows client errors
- Server logs show backend issues
- Database logs available in Neon dashboard
- Check transaction IDs for audit trail

---

## Keyboard Shortcuts

- **Enter** - Submit form or trigger action
- **Esc** - Close modals or cancel forms
- **Tab** - Navigate form fields
- **Ctrl+Shift+K** - Clear cart (if modal is open)
- **F5** - Refresh dashboard
- **Ctrl+F** - Search for content

---

## System Architecture

### Frontend
- **Framework** - Next.js 16 with App Router
- **UI Library** - Tailwind CSS v4 with custom Electric Black theme
- **State Management** - React hooks + SWR for data fetching
- **Components** - TiltCard for 3D effects, IMEIScanner for input, CartSummary for transactions

### Backend
- **Database** - Neon PostgreSQL with atomic transactions
- **Authentication** - Multi-tenancy with tenant_id scoping
- **Race Condition Protection** - SELECT...FOR UPDATE row locking
- **Transaction Mode** - SERIALIZABLE isolation level for checkout

### Data Model
```
Devices (IMEI-indexed)
├── device_id, imei_1, imei_2
├── device_model, color, storage
├── buying_price, selling_price
└── condition, quantity_available

Transactions
├── transaction_id, invoice_number
├── customer_id, items[], totals
└── timestamp, status

Repair Jobs
├── job_id, job_number (auto-increment)
├── customer_id, device_id
├── status (state machine), labor_fee
└── used_parts[], timestamps

Tenants (Multi-Tenancy)
├── tenant_id, location_name
├── business_info
└── configuration settings
```

---

## Best Practices

1. **Sales Operations**
   - Always scan complete IMEI before checkout
   - Verify customer details before payment
   - Print invoice for customer records
   - Confirm payment received before device transfer

2. **Repair Management**
   - Document issue description thoroughly
   - Get customer approval for estimated costs
   - Update status regularly for customer transparency
   - Record all parts used with timestamps

3. **System Maintenance**
   - Regular database backups (Neon handles this)
   - Monitor transaction logs weekly
   - Archive completed jobs monthly
   - Review system status dashboard daily

4. **Error Handling**
   - Don't force refresh during transactions
   - Wait for status toast confirmation
   - Retry failed operations with same parameters
   - Escalate system errors to admin

---

## Support & Contact

For issues, questions, or feature requests:
- Check this guide first for solutions
- Review error codes and troubleshooting section
- Consult API documentation files
- Contact development team with transaction ID

**Last Updated:** January 2025  
**Version:** 1.0.0  
**System Status:** Production Ready
