import sql from 'postgres';
// Initialize the postgres client with connection pooling
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const db = postgres(dbUrl, {
  max: 20, // max connections in pool
  idle_timeout: 30, // idle connection timeout
  connect_timeout: 10, // connection timeout
});

/**
 * IMEI Scan: Fast lookup by IMEI-1 or Serial Number
 * Returns device details with product info and pricing
 * Uses SELECT...FOR UPDATE to prevent race conditions
 */
export async function scanIMEI(
  tenantId: string,
  imeiOrSerial: string,
) {
  const result = await db`
    SELECT 
      ir.id,
      ir.imei_1,
      ir.imei_2,
      ir.serial_number,
      ir.status,
      ir.selling_price,
      ir.cost_price,
      pv.id as variant_id,
      pv.color,
      pv.storage_capacity,
      pv.ram,
      p.id as product_id,
      p.name as product_name,
      b.id as brand_id,
      b.name as brand_name
    FROM imei_records ir
    JOIN product_variants pv ON ir.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    JOIN brands b ON p.brand_id = b.id
    WHERE ir.tenant_id = ${tenantId}
      AND (ir.imei_1 = ${imeiOrSerial} OR ir.serial_number = ${imeiOrSerial})
    LIMIT 1
  `;

  return result;
}

/**
 * Get IMEI Record with locking for transaction
 * Uses SELECT...FOR UPDATE to prevent concurrent sales
 */
export async function getIMEIForTransaction(
  tenantId: string,
  imeiRecordId: string,
) {
  const result = await db`
    SELECT *
    FROM imei_records
    WHERE id = ${imeiRecordId} 
      AND tenant_id = ${tenantId}
    FOR UPDATE
    LIMIT 1
  `;

  return result;
}

/**
 * Checkout Transaction Handler
 * Atomic operation: All-or-Nothing
 * 1. Lock all IMEI records
 * 2. Verify all are Available
 * 3. Create sale, sale_items, warranties, and inventory_movements
 * 4. Update IMEI statuses to Sold
 */
export async function checkoutTransaction(
  tenantId: string,
  customerId: string | null,
  paymentMethod: string,
  imeiRecordIds: string[],
  subtotal: number,
  taxAmount: number,
  discountAmount: number,
  totalAmount: number,
  notes?: string,
) {
  try {
    return await db.transaction(async (trx) => {
      // Step 1: Lock and validate all IMEI records
      const imeiRecords = await trx`
        SELECT id, imei_1, serial_number, status, variant_id, selling_price
        FROM imei_records
        WHERE id IN ${trx(imeiRecordIds)}
          AND tenant_id = ${tenantId}
        FOR UPDATE
      `;

      if (imeiRecords.length !== imeiRecordIds.length) {
        throw new Error('IMEI_NOT_FOUND');
      }

      // Check all are Available
      const unavailable = imeiRecords.filter((r: any) => r.status !== 'Available');
      if (unavailable.length > 0) {
        const conflicts = unavailable.map((r: any) => ({
          imei: r.imei_1,
          serial: r.serial_number,
          current_status: r.status,
        }));
        throw {
          code: 'IMEI_NOT_AVAILABLE',
          message: 'One or more IMEIs are not available for purchase',
          conflicts,
        };
      }

      // Step 2: Generate unique invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Step 3: Create sale record
      const [sale] = await trx`
        INSERT INTO sales (
          id,
          tenant_id,
          customer_id,
          invoice_number,
          subtotal,
          tax_amount,
          discount_amount,
          total_amount,
          payment_method,
          payment_status,
          notes,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          ${tenantId},
          ${customerId},
          ${invoiceNumber},
          ${subtotal},
          ${taxAmount},
          ${discountAmount},
          ${totalAmount},
          ${paymentMethod},
          'Pending',
          ${notes || null},
          NOW(),
          NOW()
        )
        RETURNING *
      `;

      if (!sale) throw new Error('SALE_CREATION_FAILED');

      // Step 4: Create sale items, warranties, and update IMEI statuses
      const createdItems = [];
      const createdWarranties = [];

      for (const imeiRecord of imeiRecords) {
        // Create sale item
        const [saleItem] = await trx`
          INSERT INTO sale_items (
            id,
            tenant_id,
            sale_id,
            imei_record_id,
            variant_id,
            quantity,
            unit_price,
            discount_percent,
            line_total,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            ${tenantId},
            ${sale.id},
            ${imeiRecord.id},
            ${imeiRecord.variant_id},
            1,
            ${imeiRecord.selling_price},
            0,
            ${imeiRecord.selling_price},
            NOW(),
            NOW()
          )
          RETURNING *
        `;

        if (!saleItem) throw new Error('SALE_ITEM_CREATION_FAILED');
        createdItems.push(saleItem);

        // Create warranty
        const warrantyStartDate = new Date();
        const warrantyEndDate = new Date();
        warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 1); // 12 months

        const [warranty] = await trx`
          INSERT INTO warranties (
            id,
            tenant_id,
            imei_record_id,
            sale_item_id,
            warranty_start_date,
            warranty_end_date,
            warranty_type,
            is_active,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            ${tenantId},
            ${imeiRecord.id},
            ${saleItem.id},
            ${warrantyStartDate.toISOString().split('T')[0]},
            ${warrantyEndDate.toISOString().split('T')[0]},
            'Standard',
            true,
            NOW(),
            NOW()
          )
          RETURNING *
        `;

        if (!warranty) throw new Error('WARRANTY_CREATION_FAILED');
        createdWarranties.push(warranty);

        // Update IMEI status to Sold
        await trx`
          UPDATE imei_records
          SET status = 'Sold', updated_at = NOW()
          WHERE id = ${imeiRecord.id}
        `;

        // Record inventory movement
        await trx`
          INSERT INTO inventory_movements (
            id,
            tenant_id,
            imei_record_id,
            from_status,
            to_status,
            related_table,
            related_id,
            movement_reason,
            created_at
          ) VALUES (
            gen_random_uuid(),
            ${tenantId},
            ${imeiRecord.id},
            'Available',
            'Sold',
            'sales',
            ${sale.id},
            'Device sold',
            NOW()
          )
        `;
      }

      return {
        sale,
        sale_items: createdItems,
        warranties: createdWarranties,
      };
    });
  } catch (error: any) {
    // Handle specific errors
    if (error.code === 'IMEI_NOT_AVAILABLE') {
      throw error;
    }

    // Handle race conditions (unique constraint violations)
    if (error.message?.includes('unique constraint')) {
      throw {
        code: 'CONFLICT_DETECTED',
        message: 'One or more devices were already sold. Please re-scan and try again.',
      };
    }

    throw error;
  }
}

/**
 * Get sale with all items and warranties
 */
export async function getSaleWithDetails(saleId: string, tenantId: string) {
  const sale = await db`
    SELECT * FROM sales WHERE id = ${saleId} AND tenant_id = ${tenantId}
  `;

  if (!sale.length) return null;

  const saleItems = await db`
    SELECT 
      si.*,
      ir.imei_1,
      ir.serial_number,
      pv.color,
      pv.storage_capacity,
      p.name as product_name
    FROM sale_items si
    JOIN imei_records ir ON si.imei_record_id = ir.id
    JOIN product_variants pv ON si.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    WHERE si.sale_id = ${saleId} AND si.tenant_id = ${tenantId}
  `;

  const warranties = await db`
    SELECT * FROM warranties
    WHERE sale_item_id IN (
      SELECT id FROM sale_items WHERE sale_id = ${saleId}
    )
    AND tenant_id = ${tenantId}
  `;

  return {
    ...sale[0],
    items: saleItems,
    warranties,
  };
}

/**
 * Check if IMEI was previously sold
 */
export async function getIMEISaleHistory(
  tenantId: string,
  imeiRecordId: string,
) {
  const result = await db`
    SELECT 
      im.created_at,
      s.invoice_number,
      s.sale_date,
      c.first_name,
      c.last_name
    FROM inventory_movements im
    LEFT JOIN sales s ON im.related_id = s.id AND im.related_table = 'sales'
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE im.imei_record_id = ${imeiRecordId}
      AND im.tenant_id = ${tenantId}
      AND im.to_status = 'Sold'
    ORDER BY im.created_at DESC
    LIMIT 1
  `;

  return result.length > 0 ? result[0] : null;
}

// ============================================================================
// REPAIR MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Generate unique job number atomically
 * Format: JOB-2026-0001
 * Uses UPSERT pattern to ensure uniqueness per year per tenant
 */
export async function generateJobNumber(tenantId: string): Promise<string> {
  const currentYear = new Date().getFullYear();

  const result = await db.transaction(async (trx) => {
    // Try to get or create the sequence for this year
    const [sequence] = await trx`
      INSERT INTO job_number_sequences (
        id,
        tenant_id,
        year,
        next_sequence,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        ${tenantId},
        ${currentYear},
        1,
        NOW(),
        NOW()
      )
      ON CONFLICT (tenant_id, year)
      DO UPDATE SET
        next_sequence = job_number_sequences.next_sequence + 1,
        updated_at = NOW()
      RETURNING next_sequence
    `;

    if (!sequence) throw new Error('JOB_NUMBER_GENERATION_FAILED');

    const jobNumber = `JOB-${currentYear}-${String(sequence.next_sequence).padStart(4, '0')}`;
    return jobNumber;
  });

  return result;
}

/**
 * Create a new repair job
 */
export async function createRepairJob(
  tenantId: string,
  customerName: string,
  customerPhone: string,
  deviceModel: string,
  serialOrImei: string,
  issueDescription: string,
  estimatedCost?: number,
  customerId?: string,
  technicianId?: string,
  notes?: string,
) {
  const jobNumber = await generateJobNumber(tenantId);

  const [repair] = await db`
    INSERT INTO repairs (
      id,
      tenant_id,
      job_no,
      customer_id,
      customer_name,
      customer_phone,
      technician_id,
      device_model,
      serial_or_imei,
      issue_description,
      status,
      estimated_cost,
      actual_cost,
      parts_cost,
      labor_cost,
      notes,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      ${tenantId},
      ${jobNumber},
      ${customerId || null},
      ${customerName},
      ${customerPhone},
      ${technicianId || null},
      ${deviceModel},
      ${serialOrImei},
      ${issueDescription},
      'Pending',
      ${estimatedCost || null},
      null,
      0,
      0,
      ${notes || null},
      NOW(),
      NOW()
    )
    RETURNING *
  `;

  if (!repair) throw new Error('REPAIR_CREATION_FAILED');

  // Log to audit logs
  await db`
    INSERT INTO audit_logs (
      id,
      tenant_id,
      table_name,
      operation,
      record_id,
      new_values,
      created_at
    ) VALUES (
      gen_random_uuid(),
      ${tenantId},
      'repairs',
      'INSERT',
      ${repair.id},
      ${JSON.stringify({
        job_no: repair.job_no,
        customer_name: repair.customer_name,
        device_model: repair.device_model,
        status: repair.status,
      })},
      NOW()
    )
  `;

  return repair;
}

/**
 * Get repair details by ID
 */
export async function getRepairById(repairId: string, tenantId: string) {
  const result = await db`
    SELECT * FROM repairs
    WHERE id = ${repairId} AND tenant_id = ${tenantId}
    LIMIT 1
  `;

  return result.length > 0 ? result[0] : null;
}

/**
 * Validate state machine transition
 * Returns { valid: boolean, error?: string }
 */
export function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
): { valid: boolean; error?: string; validTransitions?: string[] } {
  const validTransitions: Record<string, string[]> = {
    'Pending': ['Diagnosing'],
    'Diagnosing': ['Awaiting_Parts', 'Completed'],
    'Awaiting_Parts': ['Diagnosing', 'Completed'],
    'Completed': ['Delivered'],
    'Delivered': [],
  };

  const allowed = validTransitions[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`,
      validTransitions: allowed,
    };
  }

  return { valid: true };
}

/**
 * Check inventory availability for parts
 * Returns { available: boolean, errors: Array<{variant_id, requested, available}> }
 */
export async function checkInventoryAvailability(
  tenantId: string,
  usedParts: Array<{ variant_id: string; quantity: number }>,
) {
  const variantIds = usedParts.map((p) => p.variant_id);

  const stocks = await db`
    SELECT 
      id,
      variant_id,
      quantity_available
    FROM inventory_stock
    WHERE tenant_id = ${tenantId} 
      AND variant_id IN ${db(variantIds)}
  `;

  const stockMap = new Map(stocks.map((s: any) => [s.variant_id, s.quantity_available]));

  const errors = [];

  for (const part of usedParts) {
    const available = stockMap.get(part.variant_id) || 0;
    if (available < part.quantity) {
      errors.push({
        variant_id: part.variant_id,
        requested: part.quantity,
        available,
      });
    }
  }

  return {
    available: errors.length === 0,
    errors,
  };
}

/**
 * Get variant details by ID (for repair parts lookup)
 */
export async function getProductVariantById(variantId: string, tenantId: string) {
  const result = await db`
    SELECT 
      pv.id,
      pv.sku,
      pv.storage_capacity,
      pv.color,
      p.id as product_id,
      p.name as product_name,
      b.id as brand_id,
      b.name as brand_name
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    JOIN brands b ON p.brand_id = b.id
    WHERE pv.id = ${variantId} AND pv.tenant_id = ${tenantId}
    LIMIT 1
  `;

  return result.length > 0 ? result[0] : null;
}

/**
 * Update repair status with optional parts deduction (atomic transaction)
 * Handles inventory deduction, cost calculation, and status updates
 */
export async function updateRepairStatusWithParts(
  repairId: string,
  tenantId: string,
  newStatus: string,
  laborFee?: number,
  usedParts?: Array<{ variant_id: string; quantity: number; custom_price?: number }>,
) {
  try {
    return await db.transaction(async (trx) => {
      // Step 1: Get current repair record
      const [repair] = await trx`
        SELECT * FROM repairs
        WHERE id = ${repairId} AND tenant_id = ${tenantId}
        FOR UPDATE
      `;

      if (!repair) throw { code: 'REPAIR_NOT_FOUND', message: 'Repair job not found' };

      // Step 2: Validate state transition
      const validation = validateStatusTransition(repair.status, newStatus);
      if (!validation.valid) {
        throw {
          code: 'INVALID_TRANSITION',
          message: validation.error,
          validTransitions: validation.validTransitions,
        };
      }

      let actualCost = laborFee || 0;
      const partsDeducted: any[] = [];

      // Step 3: Handle parts deduction if provided and moving to Completed
      if (usedParts && usedParts.length > 0 && newStatus === 'Completed') {
        // Lock inventory rows
        const inventoryRows = await trx`
          SELECT id, variant_id, quantity_available
          FROM inventory_stock
          WHERE tenant_id = ${tenantId}
            AND variant_id IN ${trx(usedParts.map((p) => p.variant_id))}
          FOR UPDATE
        `;

        // Map variant IDs to inventory records
        const inventoryMap = new Map(inventoryRows.map((r: any) => [r.variant_id, r]));

        // Validate stock availability
        const insufficientStock = [];
        for (const part of usedParts) {
          const inventory = inventoryMap.get(part.variant_id);
          if (!inventory || inventory.quantity_available < part.quantity) {
            insufficientStock.push({
              variant_id: part.variant_id,
              requested: part.quantity,
              available: inventory?.quantity_available || 0,
            });
          }
        }

        if (insufficientStock.length > 0) {
          throw {
            code: 'INSUFFICIENT_INVENTORY',
            message: 'One or more parts have insufficient stock',
            insufficient_inventory: insufficientStock,
          };
        }

        // Step 4: Deduct inventory and create repair_parts records
        for (const part of usedParts) {
          const inventory = inventoryMap.get(part.variant_id)!;
          const unitCost = part.custom_price || 0;
          const totalCost = unitCost * part.quantity;

          // Deduct from inventory
          await trx`
            UPDATE inventory_stock
            SET quantity_available = quantity_available - ${part.quantity},
                updated_at = NOW()
            WHERE id = ${inventory.id}
          `;

          // Create repair_parts record
          const [repairPart] = await trx`
            INSERT INTO repair_parts (
              id,
              tenant_id,
              repair_id,
              part_name,
              quantity,
              unit_cost,
              total_cost,
              created_at
            ) VALUES (
              gen_random_uuid(),
              ${tenantId},
              ${repairId},
              ${part.variant_id}, -- Store variant ID as part identifier
              ${part.quantity},
              ${unitCost},
              ${totalCost},
              NOW()
            )
            RETURNING *
          `;

          if (!repairPart) throw new Error('REPAIR_PART_CREATION_FAILED');

          actualCost += totalCost;
          partsDeducted.push({
            variant_id: part.variant_id,
            quantity: part.quantity,
            unit_cost: unitCost,
            total_cost: totalCost,
          });

          // Log inventory movement
          await trx`
            INSERT INTO inventory_movements (
              id,
              tenant_id,
              imei_record_id,
              from_status,
              to_status,
              related_table,
              related_id,
              movement_reason,
              created_at
            ) VALUES (
              gen_random_uuid(),
              ${tenantId},
              gen_random_uuid(),
              'In_Stock',
              'Used',
              'repairs',
              ${repairId},
              'Parts used for repair',
              NOW()
            )
          `;
        }
      }

      // Step 5: Update repair status
      const repairStartDate = repair.repair_start_date || 'NOW()';
      const repairCompletionDate = newStatus === 'Completed' ? 'NOW()' : repair.repair_completion_date;

      const [updatedRepair] = await trx`
        UPDATE repairs
        SET 
          status = ${newStatus},
          repair_start_date = COALESCE(repair_start_date, NOW()),
          repair_completion_date = ${newStatus === 'Completed' ? sql`NOW()` : repair.repair_completion_date},
          actual_cost = ${newStatus === 'Completed' ? actualCost : repair.actual_cost},
          labor_cost = ${laborFee || repair.labor_cost},
          parts_cost = ${partsDeducted.reduce((sum, p) => sum + p.total_cost, 0)},
          updated_at = NOW()
        WHERE id = ${repairId}
        RETURNING *
      `;

      if (!updatedRepair) throw new Error('REPAIR_UPDATE_FAILED');

      // Step 6: Log to audit logs
      await trx`
        INSERT INTO audit_logs (
          id,
          tenant_id,
          table_name,
          operation,
          record_id,
          old_values,
          new_values,
          created_at
        ) VALUES (
          gen_random_uuid(),
          ${tenantId},
          'repairs',
          'UPDATE',
          ${repairId},
          ${JSON.stringify({ status: repair.status })},
          ${JSON.stringify({
            status: newStatus,
            actual_cost: actualCost,
            parts_used: partsDeducted.length,
          })},
          NOW()
        )
      `;

      return {
        repair: updatedRepair,
        parts_deducted: partsDeducted,
        total_cost: {
          labor_fee: laborFee || 0,
          parts_total: partsDeducted.reduce((sum, p) => sum + p.total_cost, 0),
          actual_cost: actualCost,
        },
      };
    });
  } catch (error: any) {
    // Re-throw known errors
    if (error.code) {
      throw error;
    }

    // Handle transaction-specific errors
    if (error.message?.includes('transaction')) {
      throw {
        code: 'TRANSACTION_ERROR',
        message: 'Failed to complete repair status update',
        details: error.message,
      };
    }

    throw error;
  }
}
