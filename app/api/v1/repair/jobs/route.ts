import { NextRequest, NextResponse } from 'next/server';
import {
  createRepairJob,
} from '@/lib/db';
import type {
  CreateRepairRequest,
  CreateRepairResponse,
} from '@/lib/types';

/**
 * POST /api/v1/repair/jobs
 * 
 * Create a new repair job with automatic job number generation (JOB-2026-0001 format)
 * 
 * @param {CreateRepairRequest} request - Repair job creation payload
 * @returns {CreateRepairResponse} - Created repair job with unique job_no
 * 
 * Status Codes:
 * - 201: Repair job created successfully
 * - 400: Invalid input or validation error
 * - 409: Job number generation conflict
 * - 500: Database or server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Input validation
    const errors: string[] = [];

    if (!body.tenant_id || typeof body.tenant_id !== 'string') {
      errors.push('tenant_id is required and must be a string');
    }

    if (!body.customer_name || typeof body.customer_name !== 'string' || body.customer_name.trim().length === 0) {
      errors.push('customer_name is required and must be non-empty');
    }

    if (!body.customer_phone || typeof body.customer_phone !== 'string' || body.customer_phone.trim().length === 0) {
      errors.push('customer_phone is required and must be non-empty');
    }

    if (!body.device_model || typeof body.device_model !== 'string' || body.device_model.trim().length === 0) {
      errors.push('device_model is required and must be non-empty');
    }

    if (!body.serial_or_imei || typeof body.serial_or_imei !== 'string' || body.serial_or_imei.trim().length < 5 || body.serial_or_imei.trim().length > 20) {
      errors.push('serial_or_imei is required and must be between 5 and 20 characters');
    }

    if (!body.issue_description || typeof body.issue_description !== 'string' || body.issue_description.trim().length === 0) {
      errors.push('issue_description is required and must be non-empty');
    }

    if (body.estimated_cost !== undefined && (typeof body.estimated_cost !== 'number' || body.estimated_cost < 0)) {
      errors.push('estimated_cost must be a non-negative number');
    }

    if (body.customer_id !== undefined && typeof body.customer_id !== 'string') {
      errors.push('customer_id must be a string');
    }

    if (body.technician_id !== undefined && typeof body.technician_id !== 'string') {
      errors.push('technician_id must be a string');
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

    // Create repair job
    const repair = await createRepairJob(
      body.tenant_id,
      body.customer_name.trim(),
      body.customer_phone.trim(),
      body.device_model.trim(),
      body.serial_or_imei.trim(),
      body.issue_description.trim(),
      body.estimated_cost,
      body.customer_id,
      body.technician_id,
      body.notes?.trim()
    );

    console.log('[v0] Repair job created:', {
      id: repair.id,
      job_no: repair.job_no,
      customer_name: repair.customer_name,
      status: repair.status,
    });

    const response: CreateRepairResponse = {
      success: true,
      data: {
        id: repair.id,
        job_no: repair.job_no,
        repair: {
          id: repair.id,
          tenant_id: repair.tenant_id,
          job_no: repair.job_no,
          customer_id: repair.customer_id,
          customer_name: repair.customer_name,
          customer_phone: repair.customer_phone,
          technician_id: repair.technician_id,
          device_model: repair.device_model,
          serial_or_imei: repair.serial_or_imei,
          issue_description: repair.issue_description,
          status: repair.status as any,
          estimated_cost: repair.estimated_cost,
          actual_cost: repair.actual_cost,
          parts_cost: repair.parts_cost,
          labor_cost: repair.labor_cost,
          repair_start_date: repair.repair_start_date,
          repair_completion_date: repair.repair_completion_date,
          delivery_date: repair.delivery_date,
          notes: repair.notes,
          created_at: repair.created_at,
          updated_at: repair.updated_at,
        },
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('[v0] Error creating repair job:', error);

    // Handle specific database errors
    if (error.message === 'JOB_NUMBER_GENERATION_FAILED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'JOB_NUMBER_ERROR',
            message: 'Failed to generate unique job number',
          },
        },
        { status: 409 }
      );
    }

    if (error.message === 'REPAIR_CREATION_FAILED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REPAIR_CREATION_ERROR',
            message: 'Failed to create repair job',
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
