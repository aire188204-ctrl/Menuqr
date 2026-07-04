import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/v1/admin/users/[id]
 * Update user role, permissions, or status
 * 
 * Protected: Super_Admin only
 * 
 * Body:
 * {
 *   "role": "Store_Manager",
 *   "permissions": ["view_sales", "process_checkout"],
 *   "status": "Suspended" | "Active" | "Inactive",
 *   "first_name": "John",
 *   "last_name": "Doe"
 * }
 */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;
    const body = await request.json();

    const { role, permissions, status, first_name, last_name, email, phone } = body;

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (role) {
      const validRoles = ['Super_Admin', 'Store_Manager', 'Cashier', 'Technician'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
          { status: 400 }
        );
      }
    }

    if (status) {
      const validStatuses = ['Active', 'Suspended', 'Inactive'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    if (permissions && !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (status !== undefined) updateData.status = status;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    // In production, update database here
    return NextResponse.json(
      {
        success: true,
        message: 'User updated successfully',
        data: {
          id: userId,
          ...updateData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Admin Users API]', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/admin/users/[id]/audit-log
 * Fetch audit log for a specific user
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Mock audit log data
    const mockAuditLog = [
      {
        id: 'audit-1',
        user_id: userId,
        action_type: 'CHECKOUT',
        resource_type: 'Sale',
        resource_id: 'sale-123',
        details: 'Processed sale for customer John Doe',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        ip_address: '192.168.1.100',
      },
      {
        id: 'audit-2',
        user_id: userId,
        action_type: 'CREATE_REPAIR_JOB',
        resource_type: 'RepairJob',
        resource_id: 'job-456',
        details: 'Created repair job JOB-2025-0001',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        ip_address: '192.168.1.100',
      },
      {
        id: 'audit-3',
        user_id: userId,
        action_type: 'UPDATE_INVENTORY',
        resource_type: 'Inventory',
        resource_id: 'inv-789',
        details: 'Adjusted stock for iPhone 15 Pro',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        ip_address: '192.168.1.100',
      },
    ];

    return NextResponse.json(
      {
        user_id: userId,
        logs: mockAuditLog.slice(0, limit),
        total: mockAuditLog.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Admin Audit API]', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    );
  }
}
