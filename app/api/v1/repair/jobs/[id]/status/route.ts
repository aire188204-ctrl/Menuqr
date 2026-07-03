import { NextRequest, NextResponse } from 'next/server';
import {
  getRepairById,
  updateRepairStatusWithParts,
} from '@/lib/db';
import type {
  UpdateRepairStatusRequest,
  UpdateRepairStatusResponse,
  RepairStatus,
} from '@/lib/types';

/**
 * PATCH /api/v1/repair/jobs/:id/status
 * 
 * Update repair status with state machine validation and optional parts deduction
 * 
 * Features:
 * - Validate state transitions (Pending → Diagnosing → Completed, etc.)
 * - Deduct spare parts from inventory when transitioning to Completed
 * - Calculate total repair cost (labor + parts)
 * - Atomic transaction: all-or-nothing with inventory locking
 * - Race condition protection via SELECT...FOR UPDATE
 * 
 * @param {UpdateRepairStatusRequest} request - Status update payload
 * @param {string} id - Repair job ID
 * @returns {UpdateRepairStatusResponse} - Updated repair with cost breakdown
 * 
 * Status Codes:
 * - 200: Status updated successfully
 * - 400: Invalid input or invalid state transition
 * - 404: Repair job not found
 * - 409: Insufficient inventory for spare parts
 * - 500: Database or transaction error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repairId = params.id;
    const body = await request.json();

    // Input validation
    const errors: string[] = [];

    if (!body.tenant_id || typeof body.tenant_id !== 'string') {
      errors.push('tenant_id is required and must be a string');
    }

    if (!body.new_status || typeof body.new_status !== 'string') {
      errors.push('new_status is required and must be a string');
    }

    if (body.labor_fee !== undefined && (typeof body.labor_fee !== 'number' || body.labor_fee < 0)) {
      errors.push('labor_fee must be a non-negative number');
    }

    if (body.used_parts !== undefined) {
      if (!Array.isArray(body.used_parts)) {
        errors.push('used_parts must be an array');
      } else {
        for (let i = 0; i < body.used_parts.length; i++) {
          const part = body.used_parts[i];

          if (!part.variant_id || typeof part.variant_id !== 'string') {
            errors.push(`used_parts[${i}].variant_id is required and must be a string`);
          }

          if (!Number.isInteger(part.quantity) || part.quantity <= 0) {
            errors.push(`used_parts[${i}].quantity must be a positive integer`);
          }

          if (part.custom_price !== undefined && (typeof part.custom_price !== 'number' || part.custom_price < 0)) {
            errors.push(`used_parts[${i}].custom_price must be a non-negative number`);
          }
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed',
            details: errors,
          },
        },
        { status: 400 }
      );
    }

    // Fetch repair job
    const repair = await getRepairById(repairId, body.tenant_id);

    if (!repair) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REPAIR_NOT_FOUND',
            message: `Repair job with ID ${repairId} not found`,
          },
        },
        { status: 404 }
      );
    }

    console.log('[v0] Processing repair status update:', {
      repair_id: repairId,
      current_status: repair.status,
      new_status: body.new_status,
      has_parts: !!body.used_parts?.length,
    });

    // Update repair status with parts deduction
    const result = await updateRepairStatusWithParts(
      repairId,
      body.tenant_id,
      body.new_status,
      body.labor_fee,
      body.used_parts
    );

    console.log('[v0] Repair status updated:', {
      repair_id: repairId,
      new_status: result.repair.status,
      total_cost: result.total_cost.actual_cost,
      parts_deducted: result.parts_deducted.length,
    });

    const response: UpdateRepairStatusResponse = {
      success: true,
      data: {
        repair: {
          id: result.repair.id,
          tenant_id: result.repair.tenant_id,
          job_no: result.repair.job_no,
          customer_id: result.repair.customer_id,
          customer_name: result.repair.customer_name,
          customer_phone: result.repair.customer_phone,
          technician_id: result.repair.technician_id,
          device_model: result.repair.device_model,
          serial_or_imei: result.repair.serial_or_imei,
          issue_description: result.repair.issue_description,
          status: result.repair.status as RepairStatus,
          estimated_cost: result.repair.estimated_cost,
          actual_cost: result.repair.actual_cost,
          parts_cost: result.repair.parts_cost,
          labor_cost: result.repair.labor_cost,
          repair_start_date: result.repair.repair_start_date,
          repair_completion_date: result.repair.repair_completion_date,
          delivery_date: result.repair.delivery_date,
          notes: result.repair.notes,
          created_at: result.repair.created_at,
          updated_at: result.repair.updated_at,
        },
        parts_deducted: result.parts_deducted,
        total_cost: result.total_cost,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('[v0] Error updating repair status:', error);

    // Handle specific known errors
    if (error.code === 'REPAIR_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REPAIR_NOT_FOUND',
            message: error.message,
          },
        },
        { status: 404 }
      );
    }

    if (error.code === 'INVALID_TRANSITION') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATE_TRANSITION',
            message: error.message,
            details: {
              invalid_transition: {
                current_status: error.current_status,
                requested_status: error.requested_status,
                valid_transitions: error.validTransitions,
              },
            },
          },
        },
        { status: 400 }
      );
    }

    if (error.code === 'INSUFFICIENT_INVENTORY') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_INVENTORY',
            message: error.message,
            details: {
              insufficient_inventory: error.insufficient_inventory,
            },
          },
        },
        { status: 409 }
      );
    }

    if (error.code === 'TRANSACTION_ERROR') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TRANSACTION_ERROR',
            message: error.message,
          },
        },
        { status: 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
