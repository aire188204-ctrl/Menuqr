import { NextRequest, NextResponse } from 'next/server';
import {
  checkoutTransaction,
  getSaleWithDetails,
} from '@/lib/db';
import {
  CheckoutRequest,
  CheckoutResponse,
} from '@/lib/types';

/**
 * POST /api/v1/pos/sales/checkout
 * 
 * Atomic sales checkout transaction
 * - Validates all IMEIs are Available
 * - Creates sale, sale_items, and warranties in single transaction
 * - Updates IMEI statuses to Sold
 * - Handles race conditions with SELECT...FOR UPDATE
 * 
 * Request body:
 * {
 *   "tenant_id": "uuid",
 *   "customer_id": "uuid (optional)",
 *   "payment_method": "Cash|Card|Check|Digital Wallet",
 *   "imei_ids": ["uuid1", "uuid2", ...],
 *   "subtotal": 999.99,
 *   "tax_amount": 99.99,
 *   "discount_amount": 0,
 *   "notes": "optional notes"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();

    // Validate required fields
    const {
      tenant_id,
      customer_id,
      payment_method,
      imei_ids,
      subtotal,
      tax_amount = 0,
      discount_amount = 0,
      notes,
    } = body;

    if (!tenant_id || !payment_method || !imei_ids || imei_ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message:
              'tenant_id, payment_method, and imei_ids are required. imei_ids must be non-empty.',
          },
        } as CheckoutResponse,
        { status: 400 },
      );
    }

    if (subtotal <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Subtotal must be greater than 0',
          },
        } as CheckoutResponse,
        { status: 400 },
      );
    }

    const validPaymentMethods = ['Cash', 'Card', 'Check', 'Digital Wallet'];
    if (!validPaymentMethods.includes(payment_method)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PAYMENT_METHOD',
            message: `Payment method must be one of: ${validPaymentMethods.join(', ')}`,
          },
        } as CheckoutResponse,
        { status: 400 },
      );
    }

    // Calculate total
    const totalAmount = subtotal + tax_amount - discount_amount;

    // Execute checkout transaction
    const result = await checkoutTransaction(
      tenant_id,
      customer_id || null,
      payment_method,
      imei_ids,
      subtotal,
      tax_amount,
      discount_amount,
      totalAmount,
      notes,
    );

    // Fetch complete sale details with warranty info
    const saleDetails = await getSaleWithDetails(result.sale.id, tenant_id);

    if (!saleDetails) {
      throw new Error('Failed to retrieve sale details');
    }

    const response: CheckoutResponse = {
      success: true,
      sale: {
        id: saleDetails.id,
        invoice_number: saleDetails.invoice_number,
        sale_date: saleDetails.sale_date,
        total_amount: Number(saleDetails.total_amount),
        payment_status: saleDetails.payment_status,
        items: saleDetails.items.map((item: any) => ({
          imei_record_id: item.imei_record_id,
          imei_1: item.imei_1,
          serial_number: item.serial_number,
          product_name: item.product_name,
          selling_price: Number(item.unit_price),
        })),
        warranties: saleDetails.warranties.map((warranty: any) => ({
          imei_record_id: warranty.imei_record_id,
          warranty_start_date: warranty.warranty_start_date,
          warranty_end_date: warranty.warranty_end_date,
        })),
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('[v0] Checkout Error:', error);

    // Handle race condition conflicts
    if (error.code === 'IMEI_NOT_AVAILABLE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT_DETECTED',
            message: error.message || 'One or more IMEIs are no longer available. Please rescan.',
            conflicts: error.conflicts,
          },
        } as CheckoutResponse,
        { status: 409 },
      );
    }

    if (error.code === 'CONFLICT_DETECTED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONCURRENT_SALE_CONFLICT',
            message:
              'Device was sold by another cashier during checkout. Please try again.',
          },
        } as CheckoutResponse,
        { status: 409 },
      );
    }

    // Handle IMEI not found
    if (error.message?.includes('IMEI_NOT_FOUND')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_IMEI',
            message: 'One or more IMEI IDs do not exist in the system',
          },
        } as CheckoutResponse,
        { status: 404 },
      );
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during checkout. Please try again.',
        },
      } as CheckoutResponse,
      { status: 500 },
    );
  }
}
