// API Request/Response Types
export interface ScanIMEIResponse {
  success: boolean;
  device?: {
    id: string;
    imei_1: string;
    imei_2?: string;
    serial_number: string;
    status: string;
    productDetails: {
      id: string;
      name: string;
      brand: string;
      color?: string;
      storage?: string;
      ram?: string;
    };
    pricing: {
      retail_price: number;
      cost_price: number;
    };
  };
  error?: {
    code: string;
    message: string;
    device_status?: string;
    last_sold_date?: string;
  };
}

export interface CheckoutRequest {
  tenant_id: string;
  customer_id?: string;
  payment_method: 'Cash' | 'Card' | 'Check' | 'Digital Wallet';
  imei_ids: string[]; // Array of imei_record UUIDs
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  notes?: string;
}

export interface CheckoutResponse {
  success: boolean;
  sale?: {
    id: string;
    invoice_number: string;
    sale_date: string;
    total_amount: number;
    payment_status: string;
    items: Array<{
      imei_record_id: string;
      imei_1: string;
      serial_number: string;
      product_name: string;
      selling_price: number;
    }>;
    warranties: Array<{
      imei_record_id: string;
      warranty_start_date: string;
      warranty_end_date: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
    conflicts?: Array<{
      imei: string;
      reason: string;
    }>;
  };
}

// Database Query Results
export interface IMEIRecord {
  id: string;
  tenant_id: string;
  variant_id: string;
  imei_1: string;
  imei_2?: string;
  serial_number: string;
  status: 'Available' | 'Sold' | 'Reserved' | 'Defective';
  cost_price: number;
  selling_price: number;
  purchase_date?: string;
  warranty_expiry_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  tenant_id: string;
  product_id: string;
  sku: string;
  storage_capacity?: string;
  color?: string;
  ram?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  tenant_id: string;
  brand_id: string;
  name: string;
  category?: string;
}

export interface Brand {
  id: string;
  tenant_id: string;
  name: string;
  country_origin?: string;
}

export interface Sale {
  id: string;
  tenant_id: string;
  customer_id?: string;
  invoice_number: string;
  sale_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method?: string;
  payment_status: 'Pending' | 'Partial' | 'Paid' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  tenant_id: string;
  sale_id: string;
  imei_record_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
}

export interface Warranty {
  id: string;
  tenant_id: string;
  imei_record_id: string;
  sale_item_id: string;
  warranty_start_date: string;
  warranty_end_date: string;
  warranty_type: string;
  is_active: boolean;
}

export interface InventoryMovement {
  id: string;
  tenant_id: string;
  imei_record_id: string;
  from_status: string;
  to_status: string;
  related_table?: string;
  related_id?: string;
  movement_reason?: string;
  created_at: string;
}

// ============================================================================
// REPAIR MANAGEMENT TYPES
// ============================================================================

export type RepairStatus = 'Pending' | 'Diagnosing' | 'Awaiting_Parts' | 'Completed' | 'Delivered';

export interface Repair {
  id: string;
  tenant_id: string;
  job_no: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  technician_id?: string;
  device_model: string;
  serial_or_imei: string;
  issue_description: string;
  status: RepairStatus;
  estimated_cost?: number;
  actual_cost?: number;
  parts_cost: number;
  labor_cost: number;
  repair_start_date?: string;
  repair_completion_date?: string;
  delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRepairRequest {
  tenant_id: string;
  customer_name: string;
  customer_phone: string;
  device_model: string;
  serial_or_imei: string;
  issue_description: string;
  estimated_cost?: number;
  customer_id?: string;
  technician_id?: string;
  notes?: string;
}

export interface CreateRepairResponse {
  success: boolean;
  data?: {
    id: string;
    job_no: string;
    repair: Repair;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface UsedPart {
  variant_id: string; // UUID of product_variant for spare part/labor item
  quantity: number;
  custom_price?: number; // Override price per unit (for donated/discounted parts)
}

export interface InventoryStock {
  id: string;
  tenant_id: string;
  variant_id: string;
  quantity_available: number;
  reorder_level: number;
  last_restock_date?: string;
  created_at: string;
  updated_at: string;
}

export interface RepairPart {
  id: string;
  tenant_id: string;
  repair_id: string;
  part_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier?: string;
  notes?: string;
  created_at: string;
}

export interface UpdateRepairStatusRequest {
  tenant_id: string;
  new_status: RepairStatus;
  labor_fee?: number; // Labor cost for this repair
  used_parts?: UsedPart[]; // Optional array of parts deducted from inventory
  notes?: string;
}

export interface UpdateRepairStatusResponse {
  success: boolean;
  data?: {
    repair: Repair;
    parts_deducted?: Array<{
      variant_id: string;
      quantity: number;
      unit_cost: number;
      total_cost: number;
    }>;
    total_cost?: {
      labor_fee: number;
      parts_total: number;
      actual_cost: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: {
      insufficient_inventory?: Array<{
        variant_id: string;
        requested: number;
        available: number;
        part_name?: string;
      }>;
      invalid_transition?: {
        current_status: RepairStatus;
        requested_status: RepairStatus;
        valid_transitions: RepairStatus[];
      };
    };
  };
}

export interface RepairCost {
  labor_fee: number;
  parts_total: number;
  actual_cost: number;
  parts_breakdown?: Array<{
    variant_id: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
  }>;
}
