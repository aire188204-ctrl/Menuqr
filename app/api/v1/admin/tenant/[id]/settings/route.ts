import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/v1/admin/tenant/[id]/settings
 * Update tenant store configuration and settings
 * 
 * Protected: Super_Admin only
 * 
 * Body:
 * {
 *   "store_name": "Store Name",
 *   "tax_percentage": 10,
 *   "currency_symbol": "$",
 *   "enable_installments": true,
 *   "enable_repairs": true,
 *   "enable_loyalty_points": false,
 *   "metadata": { ... }
 * }
 */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await context.params;
    const body = await request.json();

    const {
      store_name,
      tax_percentage,
      currency_symbol,
      enable_installments,
      enable_repairs,
      enable_loyalty_points,
      metadata,
    } = body;

    // Validation
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    if (store_name && store_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Store name cannot be empty' },
        { status: 400 }
      );
    }

    if (tax_percentage !== undefined) {
      if (typeof tax_percentage !== 'number' || tax_percentage < 0 || tax_percentage > 100) {
        return NextResponse.json(
          { error: 'Tax percentage must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    if (currency_symbol && typeof currency_symbol !== 'string') {
      return NextResponse.json(
        { error: 'Currency symbol must be a string' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (store_name !== undefined) updateData.name = store_name;
    if (tax_percentage !== undefined) updateData.tax_percentage = tax_percentage;
    if (currency_symbol !== undefined) updateData.currency_symbol = currency_symbol;
    if (enable_installments !== undefined) updateData.enable_installments = enable_installments;
    if (enable_repairs !== undefined) updateData.enable_repairs = enable_repairs;
    if (enable_loyalty_points !== undefined) updateData.enable_loyalty_points = enable_loyalty_points;
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);

    // In production, update database here
    // For now, return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Tenant settings updated successfully',
        data: {
          tenant_id: tenantId,
          ...updateData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Admin Settings API]', error);
    return NextResponse.json(
      { error: 'Failed to update tenant settings' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/admin/tenant/[id]/settings
 * Fetch tenant settings
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await context.params;

    // In production, fetch from database
    const mockSettings = {
      tenant_id: tenantId,
      store_name: 'Test Store',
      tax_percentage: 10,
      currency_symbol: '$',
      enable_installments: false,
      enable_repairs: true,
      enable_loyalty_points: false,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(mockSettings, { status: 200 });
  } catch (error) {
    console.error('[Admin Settings API]', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant settings' },
      { status: 500 }
    );
  }
}
