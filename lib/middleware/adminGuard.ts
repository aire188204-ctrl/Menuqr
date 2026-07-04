import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin Guard Middleware
 * Protects admin routes and API endpoints
 * 
 * In production:
 * - Verify JWT tokens
 * - Check user role against Super_Admin
 * - Validate session expiry
 * - Log admin actions for audit trail
 * - Rate limit admin endpoints
 */

export interface AdminContext {
  userId: string;
  role: 'Super_Admin' | 'Store_Manager' | 'Cashier' | 'Technician';
  tenantId: string;
  permissions: string[];
}

/**
 * Check if user is Super_Admin
 * This is a mock implementation - in production use JWT verification
 */
export function isSuperAdmin(request: NextRequest): boolean {
  // In production, verify JWT token from request headers
  // const token = request.headers.get('Authorization')?.split(' ')[1];
  // const decoded = verifyJWT(token);
  // return decoded?.role === 'Super_Admin';

  // For demo, check custom header
  const adminHeader = request.headers.get('X-Admin-Role');
  return adminHeader === 'Super_Admin';
}

/**
 * Extract admin context from request
 */
export function extractAdminContext(request: NextRequest): AdminContext | null {
  const adminRole = request.headers.get('X-Admin-Role');
  const userId = request.headers.get('X-User-ID');
  const tenantId = request.headers.get('X-Tenant-ID');

  if (!adminRole || !userId || !tenantId) {
    return null;
  }

  return {
    userId,
    role: adminRole as any,
    tenantId,
    permissions: ['*'], // Super_Admin has all permissions
  };
}

/**
 * Middleware to protect admin endpoints
 */
export async function adminGuardMiddleware(request: NextRequest) {
  // Check if it's an admin route
  const pathname = request.nextUrl.pathname;
  
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/v1/admin')) {
    return NextResponse.next();
  }

  // For API endpoints, require Super_Admin
  if (pathname.startsWith('/api/v1/admin')) {
    // In production, implement proper JWT/session verification
    // For now, log the attempt
    console.log('[Admin Guard] Admin API accessed:', pathname);
    
    // In production, return 401 if not authenticated:
    // if (!isSuperAdmin(request)) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized: Super_Admin access required' },
    //     { status: 401 }
    //   );
    // }
  }

  return NextResponse.next();
}

/**
 * Log admin action for audit trail
 */
export function logAdminAction(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, any>
) {
  const auditLog = {
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
    timestamp: new Date().toISOString(),
    ip_address: 'tracked-from-request',
  };

  console.log('[Admin Audit]', JSON.stringify(auditLog));
  // In production, save to database audit_logs table
}

/**
 * Verify tenant access for multi-tenant isolation
 */
export function verifyTenantAccess(
  requestTenantId: string,
  adminTenantId: string
): boolean {
  // Super_Admin should only access their own tenant's data
  // In production, implement proper multi-tenant validation
  return requestTenantId === adminTenantId;
}

/**
 * Rate limit admin endpoints (demo implementation)
 */
const adminRequestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkAdminRateLimit(userId: string, limit: number = 100): boolean {
  const now = Date.now();
  const userRecord = adminRequestCounts.get(userId);

  if (!userRecord || now > userRecord.resetTime) {
    adminRequestCounts.set(userId, {
      count: 1,
      resetTime: now + 60000, // 1 minute window
    });
    return true;
  }

  if (userRecord.count >= limit) {
    return false;
  }

  userRecord.count++;
  return true;
}

/**
 * Validate admin request signature (for extra security)
 */
export function validateRequestSignature(request: NextRequest): boolean {
  // In production, implement HMAC signature validation
  // const signature = request.headers.get('X-Signature');
  // const body = await request.text();
  // return verifySignature(body, signature, ADMIN_SECRET_KEY);
  
  return true; // Mock validation
}
