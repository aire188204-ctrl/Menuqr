# CellPhone POS - Accounts & Users Guide

## System Overview

The CellPhone POS system is a **production-ready Point of Sale and Repair Management Platform** designed for mobile phone retail and service shops. The system uses a **multi-tenant architecture** with role-based access control.

**Note:** The current implementation is **authentication-free** for the frontend demo. Authentication should be added in production using Better Auth or similar.

---

## Account Types & Roles

### 1. **Tenant (Store Owner/Manager)**
The highest level account representing a complete store operation.

**Default Test Tenant:**
```
Name:           Test Store
Slug:           test-store
Tenant ID:      00000000-0000-0000-0000-000000000001
Status:         Active
```

**Tenant Responsibilities:**
- Manage multiple locations/branches
- Configure store settings and inventory
- Create and manage staff accounts
- Monitor sales and repair metrics
- Access financial reports and analytics

**Access Level:** Full system access (admin level)

---

### 2. **Sales Staff Account**
Handles point-of-sale transactions, device scanning, and customer checkout.

**Default Test Sales Staff:**
```
Name:           Sales Representative (Demo)
Role:           POS Operator
Permissions:    
  ✓ Scan IMEI/Serial numbers
  ✓ Create and manage shopping carts
  ✓ Process checkouts
  ✓ View available inventory
  ✓ View order history
```

**Typical Workflow:**
1. Customer enters store
2. Staff scans device IMEI using `GET /api/v1/pos/products/scan/[imei]`
3. Device details loaded in cart (brand, model, color, RAM, storage)
4. Customer adds to invoice cart
5. Process checkout with `POST /api/v1/pos/sales/checkout`
6. Receipt generated

---

### 3. **Repair Technician Account**
Manages device repair jobs, tracking, and status updates.

**Default Test Technicians:**
```
Technician 1:
  Name:           Mike Johnson
  ID:             60000000-0000-0000-0000-000000000001
  Specialization: iPhone Repair
  Email:          mike@techstore.com
  Phone:          +1-555-1001
  Status:         Active

Technician 2:
  Name:           Sarah Williams
  ID:             60000000-0000-0000-0000-000000000002
  Specialization: Samsung Repair
  Email:          sarah@techstore.com
  Phone:          +1-555-1002
  Status:         Active
```

**Technician Permissions:**
- Create new repair jobs via `POST /api/v1/repair/jobs`
- Update repair job status via `PATCH /api/v1/repair/jobs/[id]/status`
- View assigned repair jobs
- Track parts usage and labor hours
- View repair history for customers

**Repair Job States:**
```
New Job Created → Assigned → In Progress → Testing → Quality Check → Completed
                          ↓
                      On Hold (if needed)
```

---

### 4. **Customer Account**
End consumers purchasing devices or requesting repairs.

**Default Test Customers:**
```
Customer 1:
  Name:           John Doe
  ID:             50000000-0000-0000-0000-000000000001
  Phone:          +1-555-0001
  Email:          john@example.com
  Type:           Retail Customer
  Address:        123 Main St, New York, NY 10001
  Status:         Active

Customer 2:
  Name:           Jane Smith
  ID:             50000000-0000-0000-0000-000000000002
  Phone:          +1-555-0002
  Email:          jane@example.com
  Type:           Retail Customer
  Address:        456 Oak Ave, Los Angeles, CA 90001
  Status:         Active

Customer 3:
  Name:           Tech Store Corp
  ID:             50000000-0000-0000-0000-000000000003
  Phone:          +1-555-0003
  Email:          bulk@techstore.com
  Type:           Wholesale Customer
  Address:        789 Tech Blvd, San Francisco, CA 94102
  Status:         Active
```

**Customer Data Tracked:**
- Purchase history
- Repair requests and status
- Contact information
- Customer type (Retail vs Wholesale)
- Account balance/credits (if applicable)

---

## Default Test Data

### Products Available

**Brands:**
- Apple (USA)
- Samsung (South Korea)

**Products:**

#### iPhone 15 Pro
```
Product ID:     20000000-0000-0000-0000-000000000001
Brand:          Apple
Category:       Smartphone
Variants:
  - 128GB Black   (Stock: 3 units)
  - 256GB Black   (Stock: 2 units)
  - 128GB White   (Stock: 1 unit)
Price Range:    $999.99 - $1,099.99
```

**Available IMEIs:**
```
128GB Black Variants:
  1. IMEI: 123456789012345 | Serial: IPHONE-PRO-001 | Price: $999.99
  2. IMEI: 987654321098765 | Serial: IPHONE-PRO-002 | Price: $999.99
  3. IMEI: 555555555555555 | Serial: IPHONE-PRO-003 | Price: $999.99

256GB Black Variants:
  1. IMEI: 111111111111111 | Serial: IPHONE-PRO-256-001 | Price: $1,099.99
  2. IMEI: 222222222222222 | Serial: IPHONE-PRO-256-002 | Price: $1,099.99

128GB White Variant:
  1. IMEI: 333333333333333 | Serial: IPHONE-PRO-WHITE-001 | Price: $999.99
```

#### Samsung Galaxy S24
```
Product ID:     20000000-0000-0000-0000-000000000002
Brand:          Samsung
Category:       Smartphone
Variants:
  - 256GB Black   (Stock: 1 unit)
Price:          $899.99
```

**Available IMEIs:**
```
256GB Black:
  1. IMEI: 444444444444444 | Serial: SAMSUNG-S24-001 | Price: $899.99
```

---

## How to Test Different Accounts

### 1. Test Sales Workflow
```bash
# Sales staff scans iPhone
curl -X GET "http://localhost:3000/api/v1/pos/products/scan/123456789012345?tenant_id=00000000-0000-0000-0000-000000000001"

# Response returns product details
{
  "device": {
    "imei_1": "123456789012345",
    "device_model": "iPhone 15 Pro - 128GB Black",
    "selling_price": 999.99,
    "color": "Black",
    "storage": "128GB"
  }
}

# Sales staff initiates checkout
curl -X POST "http://localhost:3000/api/v1/pos/sales/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "customer_id": "50000000-0000-0000-0000-000000000001",
    "imei_ids": ["123456789012345", "987654321098765"],
    "subtotal": 1999.98,
    "tax": 199.99,
    "discount": 0,
    "payment_method": "cash"
  }'
```

### 2. Test Repair Workflow
```bash
# Technician creates repair job
curl -X POST "http://localhost:3000/api/v1/repair/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "customer_name": "John Doe",
    "customer_phone": "+1-555-0001",
    "device_model": "iPhone 15 Pro",
    "serial_or_imei": "IPHONE-PRO-001",
    "issue_description": "Cracked screen",
    "estimated_cost": 150.00
  }'

# Response:
{
  "id": "job-uuid",
  "job_number": "JOB-2025-0001",
  "status": "New",
  "created_at": "2026-07-03T10:00:00Z"
}

# Technician updates job status
curl -X PATCH "http://localhost:3000/api/v1/repair/jobs/job-uuid/status" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "new_status": "In Progress",
    "labor_fee": 50.00,
    "used_parts": []
  }'
```

---

## User Permissions Matrix

| Feature | Tenant | Sales Staff | Technician | Customer |
|---------|--------|-------------|-----------|----------|
| View Products | ✓ | ✓ | ✓ | ✓ |
| Scan IMEI | ✓ | ✓ | ✓ | - |
| Process Checkout | ✓ | ✓ | - | - |
| Create Repair Job | ✓ | ✓ | ✓ | ✓ |
| Update Repair Status | ✓ | - | ✓ | - |
| View Own Repairs | ✓ | - | ✓ | ✓ |
| View All Sales | ✓ | ✓ | - | - |
| View Analytics | ✓ | - | - | - |
| Manage Staff | ✓ | - | - | - |
| Manage Inventory | ✓ | - | - | - |
| Edit Pricing | ✓ | - | - | - |

---

## Admin Access (Current)

**Note:** The system currently has **no login screen**. All API endpoints use `tenant_id` as the access control parameter.

**To implement admin login in production:**

1. Add authentication middleware
2. Implement role-based access control (RBAC)
3. Add JWT token verification
4. Create login/logout endpoints
5. Implement session management
6. Add audit logging for all admin actions

**Recommended Authentication Stack:**
```
Frontend:   Better Auth (npm add better-auth)
Backend:    Better Auth with Neon integration
Session:    HTTP-only cookies
Database:   Neon PostgreSQL (built-in user tables)
```

---

## Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://user:password@neon.tech/db_name

# Tenant Configuration
DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000001

# Authentication (when implemented)
AUTH_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# API Configuration
API_BASE_URL=http://localhost:3000
API_VERSION=v1
```

---

## Testing Checklist

- [ ] Create a new customer record
- [ ] Scan an iPhone IMEI and add to cart
- [ ] Scan a Samsung IMEI and add to cart
- [ ] Process checkout for multiple items
- [ ] Create a new repair job
- [ ] Update repair job to "In Progress"
- [ ] Complete a repair job
- [ ] View repair job history
- [ ] Test invalid IMEI (should return 404)
- [ ] Test race condition with two concurrent checkouts

---

## Support & Contact

For production deployment or account management questions:
- **Documentation:** See `SYSTEM_USER_GUIDE.md`
- **API Reference:** See `POS_API_GUIDE.md` and `REPAIR_API_GUIDE.md`
- **Technical Details:** See `SYSTEM_ARCHITECTURE.md`

