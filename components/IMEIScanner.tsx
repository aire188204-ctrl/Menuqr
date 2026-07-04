'use client';

import { useState, useRef, useCallback } from 'react';
import { Scan, Loader2 } from 'lucide-react';
import { posApi } from '@/lib/api-client';
import { useToastStore, useCartStore, useAppStore } from '@/lib/store';

export function IMEIScanner() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToastStore();
  const { addItem } = useCartStore();
  const { tenantId } = useAppStore();

  const handleScan = useCallback(
    async (imeiValue: string) => {
      if (!imeiValue.trim()) return;

      setIsLoading(true);

      try {
        const response = await posApi.scanDevice(imeiValue, tenantId) as any;

        if (response?.data) {
          const device = response.data;

          // Add to cart
          addItem({
            id: device.id,
            imei_1: device.imei_1,
            serial_number: device.serial_number,
            device_model: `${device.brand_name} ${device.product_name}`,
            selling_price: device.selling_price,
            variant_id: device.variant_id,
          });

          addToast({
            type: 'success',
            message: `Added: ${device.brand_name} ${device.product_name}`,
            duration: 3000,
          });

          setInput('');
        }
      } catch (error: any) {
        if (error.code === 'NOT_FOUND') {
          addToast({
            type: 'error',
            message: 'Device not found. Please check the IMEI/Serial number.',
            duration: 4000,
          });
        } else if (error.code === 'CONFLICT') {
          addToast({
            type: 'warning',
            message: `Device already sold on ${error.details?.sold_date || 'a previous date'}.`,
            duration: 5000,
          });
        } else {
          addToast({
            type: 'error',
            message: error.message || 'Failed to scan device.',
            duration: 4000,
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [tenantId, addToast, addItem],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleScan(input);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="block text-sm font-semibold text-electric-cyan neon-text-cyan">
          IMEI / Serial Scanner
        </label>
        <span className="badge-cyan text-xs">Required</span>
      </div>

      <div className="relative">
        {/* Continuous laser scanning effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-l from-electric-cyan via-electric-cyan to-transparent laser-horizontal"></div>
        </div>

        {/* Enhanced focus laser effect */}
        {isFocused && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-transparent via-electric-cyan to-transparent laser-sweep"></div>
          </div>
        )}

        <div
          className={`relative rounded-lg overflow-hidden transition-all duration-300 glass-panel-premium ${
            isFocused
              ? 'neon-border-cyan glow-cyan-lg'
              : 'border-white/5'
          }`}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className={`p-1 rounded ${isFocused ? 'neon-border-cyan' : ''}`}>
              <Scan className={`w-5 h-5 flex-shrink-0 ${isFocused ? 'text-electric-cyan neon-text-cyan glow-cyan' : 'text-electric-cyan'}`} />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Scan or paste IMEI/Serial..."
              className="flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-subtle text-sm input-focus-cyan"
              disabled={isLoading}
            />

            {isLoading && (
              <Loader2 className="w-5 h-5 text-electric-cyan animate-spin flex-shrink-0 glow-cyan" />
            )}

            {!isLoading && input && (
              <button
                onClick={() => handleScan(input)}
                className="btn-neon-cyan px-3 py-1 rounded text-xs"
              >
                Scan
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-text-muted mt-2 leading-relaxed">
          Supports hardware laser scanners and manual input
        </p>
      </div>
    </div>
  );
}
