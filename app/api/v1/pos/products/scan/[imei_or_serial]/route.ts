import { NextRequest, NextResponse } from 'next/server';
import { scanIMEI, getIMEISaleHistory } from '@/lib/db';
import { ScanIMEIResponse } from '@/lib/types';

/**
 * GET /api/v1/pos/products/scan/:imei_or_serial
 * 
 * Scan a device by IMEI-1 or Serial Number
 * Returns device details with product info if Available
 * Returns 400 error if already Sold with last sale date
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { imei_or_serial: string } },
) {
  try {
    const { imei_or_serial } = await Promise.resolve(params);
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    // Validate inputs
    if (!imei_or_serial || !tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'imei_or_serial and tenant_id are required',
          },
        } as ScanIMEIResponse,
        { status: 400 },
      );
    }

    // Scan for the device
    const results = await scanIMEI(tenantId, imei_or_serial.trim());

    if (results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DEVICE_NOT_FOUND',
            message: `Device with IMEI/Serial "${imei_or_serial}" not found in inventory`,
          },
        } as ScanIMEIResponse,
        { status: 404 },
      );
    }

    const device = results[0];

    // Check if device is Available
    if (device.status !== 'Available') {
      let errorMessage = `Device is ${device.status.toLowerCase()}`;
      let lastSoldDate = '';

      // Get sale history if Sold
      if (device.status === 'Sold') {
        const history = await getIMEISaleHistory(tenantId, device.id);
        if (history) {
          lastSoldDate = new Date(history.created_at).toLocaleDateString();
          errorMessage = `Device already sold on ${lastSoldDate}`;
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DEVICE_NOT_AVAILABLE',
            message: errorMessage,
            device_status: device.status,
            last_sold_date: lastSoldDate || undefined,
          },
        } as ScanIMEIResponse,
        { status: 400 },
      );
    }

    // Return device details
    const response: ScanIMEIResponse = {
      success: true,
      device: {
        id: device.id,
        imei_1: device.imei_1,
        imei_2: device.imei_2,
        serial_number: device.serial_number,
        status: device.status,
        productDetails: {
          id: device.product_id,
          name: device.product_name,
          brand: device.brand_name,
          color: device.color,
          storage: device.storage_capacity,
          ram: device.ram,
        },
        pricing: {
          retail_price: Number(device.selling_price),
          cost_price: Number(device.cost_price),
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[v0] IMEI Scan Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while scanning the device',
        },
      } as ScanIMEIResponse,
      { status: 500 },
    );
  }
}
