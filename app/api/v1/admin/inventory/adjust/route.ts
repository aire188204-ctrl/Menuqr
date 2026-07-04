import { NextRequest, NextResponse } from 'next/server';

interface InventoryAdjustment {
  id: string;
  tenant_id: string;
  variant_id: string;
  old_quantity: number;
  new_quantity: number;
  adjustment_reason: string;
  adjusted_by_user_id: string;
  created_at: string;
}

/**
 * PATCH /api/v1/admin/inventory/adjust
 * Adjust inventory stock levels for a product variant
 * 
 * Protected: Super_Admin, Store_Manager only
 * 
 * Body:
 * {
 *   "tenant_id": "uuid",
 *   "variant_id": "uuid",
 *   "quantity_adjustment": 5,  // positive or negative
 *   "reason": "Stock recount - found 5 extra units",
 *   "adjusted_by_user_id": "user-id"
 * }
 */

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenant_id,
      variant_id,
      quantity_adjustment,
      reason,
      adjusted_by_user_id,
    } = body;

    // Validation
    if (!tenant_id || !variant_id || quantity_adjustment === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: tenant_id, variant_id, quantity_adjustment' },
        { status: 400 }
      );
    }

    if (typeof quantity_adjustment !== 'number' || quantity_adjustment === 0) {
      return NextResponse.json(
        { error: 'quantity_adjustment must be a non-zero number' },
        { status: 400 }
      );
    }

    // Mock current inventory
    const mockCurrentStock = {
      'variant-iphone-128': 15,
      'variant-iphone-256': 8,
      'variant-samsung-256': 3,
    };

    const currentQuantity = mockCurrentStock[variant_id as keyof typeof mockCurrentStock] || 0;
    const newQuantity = currentQuantity + quantity_adjustment;

    if (newQuantity < 0) {
      return NextResponse.json(
        {
          error: 'Adjustment would result in negative stock',
          current_quantity: currentQuantity,
          adjustment: quantity_adjustment,
          would_be: newQuantity,
        },
        { status: 400 }
      );
    }

    // Mock adjustment record
    const adjustment: InventoryAdjustment = {
      id: `adjustment-${Date.now()}`,
      tenant_id,
      variant_id,
      old_quantity: currentQuantity,
      new_quantity: newQuantity,
      adjustment_reason: reason || 'Manual adjustment',
      adjusted_by_user_id,
      created_at: new Date().toISOString(),
    };

    // Return success
    return NextResponse.json(
      {
        success: true,
        message: `Inventory adjusted from ${currentQuantity} to ${newQuantity} units`,
        adjustment,
        stock_level_warning:
          newQuantity < 5
            ? {
                level: 'critical',
                message: `Low stock alert: Only ${newQuantity} units remaining`,
              }
            : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Inventory Adjust API]', error);
    return NextResponse.json(
      { error: 'Failed to adjust inventory' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/admin/inventory/status
 * Get current inventory status with low stock alerts
 * 
 * Query params:
 * - tenant_id: string (required)
 * - low_stock_threshold: number (default: 5)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const threshold = parseInt(searchParams.get('low_stock_threshold') || '5');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      );
    }

    // Mock inventory data
    const mockInventory = [
      {
        variant_id: 'variant-iphone-128',
        product_name: 'iPhone 15 Pro',
        variant_name: '128GB Black',
        current_stock: 15,
        min_threshold: 5,
        max_capacity: 50,
        status: 'Healthy',
        cost_per_unit: 850.0,
        total_value: 12750.0,
      },
      {
        variant_id: 'variant-iphone-256',
        product_name: 'iPhone 15 Pro',
        variant_name: '256GB Black',
        current_stock: 2,
        min_threshold: 5,
        max_capacity: 50,
        status: 'Critical - Low Stock',
        cost_per_unit: 950.0,
        total_value: 1900.0,
      },
      {
        variant_id: 'variant-samsung-256',
        product_name: 'Samsung Galaxy S24',
        variant_name: '256GB Black',
        current_stock: 8,
        min_threshold: 5,
        max_capacity: 40,
        status: 'Healthy',
        cost_per_unit: 750.0,
        total_value: 6000.0,
      },
    ];

    const lowStockItems = mockInventory.filter(
      (item) => item.current_stock <= threshold
    );
    const totalInventoryValue = mockInventory.reduce(
      (sum, item) => sum + item.total_value,
      0
    );

    return NextResponse.json(
      {
        tenant_id: tenantId,
        inventory: mockInventory,
        summary: {
          total_variants: mockInventory.length,
          total_units: mockInventory.reduce((sum, item) => sum + item.current_stock, 0),
          total_inventory_value: totalInventoryValue,
          low_stock_items: lowStockItems.length,
          critical_items: lowStockItems.filter((item) => item.current_stock === 0).length,
        },
        alerts: lowStockItems.map((item) => ({
          variant_id: item.variant_id,
          product: `${item.product_name} - ${item.variant_name}`,
          current_stock: item.current_stock,
          threshold: item.min_threshold,
          alert_level: item.current_stock === 0 ? 'critical' : 'warning',
          recommended_action:
            item.current_stock === 0
              ? 'Order immediately'
              : `Order ${item.max_capacity - item.current_stock} units`,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Inventory Status API]', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory status' },
      { status: 500 }
    );
  }
}
