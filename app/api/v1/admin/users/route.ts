import { NextRequest, NextResponse } from 'next/server';

interface StaffUser {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'Super_Admin' | 'Store_Manager' | 'Cashier' | 'Technician';
  permissions: string[];
  status: 'Active' | 'Suspended' | 'Inactive';
  created_at: string;
  updated_at: string;
}

// Mock in-memory database for demo
const mockUsers: Map<string, StaffUser> = new Map([
  [
    'user-1',
    {
      id: 'user-1',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@techstore.com',
      phone: '+1-555-0000',
      role: 'Super_Admin',
      permissions: ['*'],
      status: 'Active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  [
    'user-2',
    {
      id: 'user-2',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      first_name: 'Sales',
      last_name: 'Manager',
      email: 'sales@techstore.com',
      phone: '+1-555-0001',
      role: 'Store_Manager',
      permissions: ['view_sales', 'process_checkout', 'manage_inventory'],
      status: 'Active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
]);

/**
 * GET /api/v1/admin/users
 * Fetch all users for a tenant with pagination
 * 
 * Query params:
 * - tenant_id: string (required)
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - role: string (optional filter)
 * - status: string (optional filter)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const roleFilter = searchParams.get('role');
    const statusFilter = searchParams.get('status');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      );
    }

    let users = Array.from(mockUsers.values()).filter(
      (u) => u.tenant_id === tenantId
    );

    if (roleFilter) {
      users = users.filter((u) => u.role === roleFilter);
    }

    if (statusFilter) {
      users = users.filter((u) => u.status === statusFilter);
    }

    const total = users.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedUsers = users.slice(start, end);

    return NextResponse.json(
      {
        data: paginatedUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Admin Users API]', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/users
 * Create a new staff user
 * 
 * Body:
 * {
 *   "tenant_id": "uuid",
 *   "first_name": "John",
 *   "last_name": "Doe",
 *   "email": "john@example.com",
 *   "phone": "+1-555-1234",
 *   "role": "Cashier",
 *   "permissions": ["view_sales", "process_checkout"]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenant_id,
      first_name,
      last_name,
      email,
      phone,
      role,
      permissions,
    } = body;

    // Validation
    if (!tenant_id || !first_name || !last_name || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const validRoles = ['Super_Admin', 'Store_Manager', 'Cashier', 'Technician'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Check email uniqueness
    if (Array.from(mockUsers.values()).some((u) => u.email === email)) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    const newUser: StaffUser = {
      id: `user-${Date.now()}`,
      tenant_id,
      first_name,
      last_name,
      email,
      phone: phone || '',
      role: role as StaffUser['role'],
      permissions: permissions || [],
      status: 'Active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockUsers.set(newUser.id, newUser);

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Admin Users API]', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
