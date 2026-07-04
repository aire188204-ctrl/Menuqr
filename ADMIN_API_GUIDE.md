# Central Admin Dashboard & Management System - API Guide

## Overview

The Admin Dashboard is a production-ready management system for controlling all aspects of a multi-tenant mobile phone retail and repair platform. This guide covers all available API endpoints, authentication, permissions, and usage examples.

---

## Authentication & Authorization

### Current Implementation (Demo Mode)
- No authentication required in development
- Headers checked for `X-Admin-Role`, `X-User-ID`, `X-Tenant-ID`

### Production Implementation (Recommended)
```javascript
// JWT Token Format
{
  "sub": "user-id",
  "role": "Super_Admin",
  "tenant_id": "tenant-uuid",
  "permissions": ["*"],
  "iat": 1234567890,
  "exp": 1234571490
}

// Add to request headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Role-Based Access Control (RBAC)
```
Super_Admin       → Full system access, all endpoints
Store_Manager     → Tenant settings, user management, inventory
Cashier           → View only, no modifications
Technician        → Repair jobs, inventory read-only
```

---

## API Endpoints

### 1. Tenant Settings Management

#### GET /api/v1/admin/tenant/{id}/settings
Fetch tenant configuration and settings.

**Authentication:** Super_Admin

**Response:**
```json
{
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "store_name": "Test Store",
  "tax_percentage": 10,
  "currency_symbol": "$",
  "enable_installments": false,
  "enable_repairs": true,
  "enable_loyalty_points": false,
  "metadata": {},
  "created_at": "2026-07-03T10:00:00Z",
  "updated_at": "2026-07-03T10:00:00Z"
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/tenant/00000000-0000-0000-0000-000000000001/settings" \
  -H "X-Admin-Role: Super_Admin"
```

---

#### PATCH /api/v1/admin/tenant/{id}/settings
Update tenant store configuration.

**Authentication:** Super_Admin

**Request Body:**
```json
{
  "store_name": "Updated Store Name",
  "tax_percentage": 12,
  "currency_symbol": "€",
  "enable_installments": true,
  "enable_repairs": true,
  "enable_loyalty_points": true,
  "metadata": {
    "business_license": "BL-12345",
    "registration_date": "2020-01-01"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant settings updated successfully",
  "data": {
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "updated_at": "2026-07-03T10:30:00Z"
  }
}
```

**cURL Example:**
```bash
curl -X PATCH "http://localhost:3000/api/v1/admin/tenant/00000000-0000-0000-0000-000000000001/settings" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Role: Super_Admin" \
  -d '{
    "store_name": "My Updated Store",
    "tax_percentage": 15
  }'
```

---

### 2. User & RBAC Management

#### GET /api/v1/admin/users
Fetch staff roster with pagination and filtering.

**Authentication:** Super_Admin, Store_Manager

**Query Parameters:**
- `tenant_id` (required): Tenant UUID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `role` (optional): Filter by role
- `status` (optional): Filter by status

**Response:**
```json
{
  "data": [
    {
      "id": "user-1",
      "tenant_id": "00000000-0000-0000-0000-000000000001",
      "first_name": "Admin",
      "last_name": "User",
      "email": "admin@techstore.com",
      "phone": "+1-555-0000",
      "role": "Super_Admin",
      "status": "Active",
      "created_at": "2026-07-03T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?tenant_id=00000000-0000-0000-0000-000000000001&role=Cashier" \
  -H "X-Admin-Role: Super_Admin"
```

---

#### POST /api/v1/admin/users
Create a new staff user.

**Authentication:** Super_Admin

**Request Body:**
```json
{
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@techstore.com",
  "phone": "+1-555-1234",
  "role": "Cashier",
  "permissions": [
    "view_sales",
    "process_checkout",
    "view_inventory"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "user-new-uuid",
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@techstore.com",
    "role": "Cashier",
    "status": "Active",
    "created_at": "2026-07-03T11:00:00Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/admin/users" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Role: Super_Admin" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "first_name": "Sarah",
    "last_name": "Tech",
    "email": "sarah@techstore.com",
    "role": "Technician"
  }'
```

---

#### PATCH /api/v1/admin/users/{id}
Update user role, permissions, or status.

**Authentication:** Super_Admin

**Request Body:**
```json
{
  "role": "Store_Manager",
  "status": "Active",
  "permissions": [
    "view_sales",
    "manage_users",
    "manage_inventory",
    "view_analytics"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "user-1",
    "role": "Store_Manager",
    "status": "Active",
    "updated_at": "2026-07-03T11:30:00Z"
  }
}
```

**Suspend/Deactivate User:**
```bash
curl -X PATCH "http://localhost:3000/api/v1/admin/users/user-1" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Role: Super_Admin" \
  -d '{
    "status": "Suspended"
  }'
```

---

#### GET /api/v1/admin/users/{id}/audit-log
Fetch audit log for a specific user showing all actions.

**Authentication:** Super_Admin

**Query Parameters:**
- `limit` (optional): Max logs to return (default: 50)

**Response:**
```json
{
  "user_id": "user-1",
  "logs": [
    {
      "id": "audit-1",
      "user_id": "user-1",
      "action_type": "CHECKOUT",
      "resource_type": "Sale",
      "resource_id": "sale-123",
      "details": "Processed sale for customer John Doe",
      "timestamp": "2026-07-03T10:30:00Z",
      "ip_address": "192.168.1.100"
    }
  ],
  "total": 42
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/users/user-1/audit-log?limit=20" \
  -H "X-Admin-Role: Super_Admin"
```

---

### 3. Inventory & Stock Management

#### GET /api/v1/admin/inventory/adjust
Get current inventory status with low stock alerts.

**Authentication:** Super_Admin, Store_Manager

**Query Parameters:**
- `tenant_id` (required): Tenant UUID
- `low_stock_threshold` (optional): Alert threshold (default: 5)

**Response:**
```json
{
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "inventory": [
    {
      "variant_id": "variant-iphone-128",
      "product_name": "iPhone 15 Pro",
      "variant_name": "128GB Black",
      "current_stock": 15,
      "min_threshold": 5,
      "max_capacity": 50,
      "status": "Healthy",
      "cost_per_unit": 850.0,
      "total_value": 12750.0
    }
  ],
  "summary": {
    "total_variants": 3,
    "total_units": 25,
    "total_inventory_value": 20650.0,
    "low_stock_items": 1,
    "critical_items": 0
  },
  "alerts": [
    {
      "variant_id": "variant-iphone-256",
      "product": "iPhone 15 Pro - 256GB Black",
      "current_stock": 2,
      "threshold": 5,
      "alert_level": "warning",
      "recommended_action": "Order 48 units"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/inventory/adjust?tenant_id=00000000-0000-0000-0000-000000000001" \
  -H "X-Admin-Role: Super_Admin"
```

---

#### PATCH /api/v1/admin/inventory/adjust
Manually adjust inventory stock levels.

**Authentication:** Super_Admin, Store_Manager

**Request Body:**
```json
{
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "variant_id": "variant-iphone-128",
  "quantity_adjustment": 5,
  "reason": "Stock recount - found 5 extra units",
  "adjusted_by_user_id": "user-1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inventory adjusted from 15 to 20 units",
  "adjustment": {
    "id": "adjustment-123",
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "variant_id": "variant-iphone-128",
    "old_quantity": 15,
    "new_quantity": 20,
    "adjustment_reason": "Stock recount - found 5 extra units",
    "adjusted_by_user_id": "user-1",
    "created_at": "2026-07-03T12:00:00Z"
  },
  "stock_level_warning": null
}
```

**Examples:**

Add 10 units:
```bash
curl -X PATCH "http://localhost:3000/api/v1/admin/inventory/adjust" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Role: Super_Admin" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "variant_id": "variant-iphone-128",
    "quantity_adjustment": 10,
    "reason": "Received shipment",
    "adjusted_by_user_id": "user-1"
  }'
```

Remove damaged unit:
```bash
curl -X PATCH "http://localhost:3000/api/v1/admin/inventory/adjust" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Role: Super_Admin" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "variant_id": "variant-samsung-256",
    "quantity_adjustment": -1,
    "reason": "Damaged unit - unable to repair",
    "adjusted_by_user_id": "user-1"
  }'
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized: Super_Admin access required"
}
```

**400 Bad Request:**
```json
{
  "error": "Missing required fields: tenant_id, variant_id, quantity_adjustment"
}
```

**409 Conflict:**
```json
{
  "error": "Email already exists"
}
```

**422 Unprocessable Entity:**
```json
{
  "error": "Adjustment would result in negative stock",
  "current_quantity": 2,
  "adjustment": -5,
  "would_be": -3
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to update tenant settings"
}
```

---

## Testing Scenarios

### Complete Admin Workflow

1. **Fetch current settings:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/tenant/00000000-0000-0000-0000-000000000001/settings"
```

2. **Update store name:**
```bash
curl -X PATCH "http://localhost:3000/api/v1/admin/tenant/00000000-0000-0000-0000-000000000001/settings" \
  -H "Content-Type: application/json" \
  -d '{"store_name": "Premium Mobile Store"}'
```

3. **List all users:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?tenant_id=00000000-0000-0000-0000-000000000001"
```

4. **Create technician account:**
```bash
curl -X POST "http://localhost:3000/api/v1/admin/users" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "first_name": "Mike",
    "last_name": "Tech",
    "email": "mike@store.com",
    "role": "Technician"
  }'
```

5. **Check inventory status:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/inventory/adjust?tenant_id=00000000-0000-0000-0000-000000000001"
```

6. **Adjust stock for low item:**
```bash
curl -X PATCH "http://localhost:3000/api/v1/admin/inventory/adjust" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "variant_id": "variant-iphone-256",
    "quantity_adjustment": 20,
    "reason": "Received new shipment from supplier",
    "adjusted_by_user_id": "user-1"
  }'
```

---

## Security Best Practices

1. **Always validate tenant_id** - Prevent cross-tenant data access
2. **Implement rate limiting** - Protect against brute force attacks
3. **Log all admin actions** - Maintain audit trail for compliance
4. **Use HTTPS in production** - Encrypt all traffic
5. **Implement JWT expiry** - Sessions should timeout
6. **Require reauthentication** - For sensitive operations like suspending users
7. **Validate input thoroughly** - Prevent SQL injection and XSS
8. **Use parameterized queries** - When implementing database queries

---

## Production Checklist

- [ ] Implement proper JWT authentication
- [ ] Add request signature validation
- [ ] Enable rate limiting per endpoint
- [ ] Set up audit logging to database
- [ ] Configure HTTPS/TLS
- [ ] Implement session timeout (30 minutes recommended)
- [ ] Add IP whitelist for admin access
- [ ] Set up monitoring and alerting
- [ ] Implement password complexity rules
- [ ] Add MFA (multi-factor authentication)
- [ ] Regular security audits
- [ ] Database backup and recovery procedures

---

## Support & Troubleshooting

For issues or questions:
1. Check the error message and status code
2. Verify authentication headers are correct
3. Ensure tenant_id matches authorized tenant
4. Check request body JSON syntax
5. Review audit logs for user actions

