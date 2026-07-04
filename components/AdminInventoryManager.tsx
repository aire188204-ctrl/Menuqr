'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/lib/stores/adminStore';
import { AlertTriangle, Plus, Minus, RefreshCw } from 'lucide-react';

export function AdminInventoryManager({ tenantId }: { tenantId: string }) {
  const { inventory, inventoryLoading, lowStockAlerts, fetchInventory, adjustInventory } =
    useAdminStore();
  const [isMounted, setIsMounted] = useState(false);
  const [adjustmentVariant, setAdjustmentVariant] = useState<string | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  useEffect(() => {
    setIsMounted(true);
    fetchInventory(tenantId);
  }, [tenantId, fetchInventory]);

  const handleAdjustment = async () => {
    if (!adjustmentVariant) return;
    await adjustInventory(tenantId, adjustmentVariant, adjustmentValue, adjustmentReason);
    setAdjustmentVariant(null);
    setAdjustmentValue(0);
    setAdjustmentReason('');
  };

  if (!isMounted || inventoryLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-panel h-16 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alerts */}
      {lowStockAlerts > 0 && (
        <div className="glass-panel-premium p-4 rounded-lg border border-neon-red/30 bg-neon-red/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-neon-red flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-neon-red mb-1">Low Stock Alert</h3>
              <p className="text-sm text-text-muted">
                {lowStockAlerts} product variant{lowStockAlerts !== 1 ? 's' : ''} require{lowStockAlerts === 1 ? 's' : ''} immediate attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Form */}
      {adjustmentVariant && (
        <div className="glass-panel-premium p-6 rounded-lg border border-white/10">
          <h3 className="font-semibold text-text-primary mb-4">Adjust Stock Level</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Adjustment Quantity
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAdjustmentValue(Math.max(-99, adjustmentValue - 1))}
                  className="p-2 hover:bg-white/5 rounded"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 bg-surface-secondary/50 glass-panel rounded text-text-primary text-center"
                />
                <button
                  onClick={() => setAdjustmentValue(Math.min(99, adjustmentValue + 1))}
                  className="p-2 hover:bg-white/5 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-text-muted mt-1">Positive for add, negative for remove</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Reason
              </label>
              <select
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full px-3 py-2 bg-surface-secondary/50 glass-panel rounded text-text-primary text-sm"
              >
                <option value="">Select reason...</option>
                <option value="Stock recount">Stock Recount</option>
                <option value="Damaged unit">Damaged Unit</option>
                <option value="Received shipment">Received Shipment</option>
                <option value="Correction">Correction</option>
                <option value="Theft/Loss">Theft/Loss</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAdjustment}
                disabled={adjustmentValue === 0}
                className="btn-neon-cyan px-4 py-2 rounded text-sm disabled:opacity-50"
              >
                Apply Adjustment
              </button>
              <button
                onClick={() => {
                  setAdjustmentVariant(null);
                  setAdjustmentValue(0);
                  setAdjustmentReason('');
                }}
                className="px-4 py-2 border border-white/10 rounded text-sm text-text-primary hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Grid */}
      <div className="grid gap-4">
        {inventory.map((item) => {
          const stockPercentage = (item.current_stock / item.min_threshold) * 100;
          const isLowStock = item.current_stock <= item.min_threshold;

          return (
            <div
              key={item.variant_id}
              className={`glass-panel p-4 rounded-lg border transition-all ${
                isLowStock
                  ? 'border-neon-red/30 bg-neon-red/5'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">
                    {item.product_name}
                  </h3>
                  <p className="text-sm text-text-muted">{item.variant_name}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${isLowStock ? 'text-neon-red' : 'text-hyper-green'}`}>
                    {item.current_stock}
                  </p>
                  <p className="text-xs text-text-muted">units in stock</p>
                </div>
              </div>

              {/* Stock Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-muted">Stock Level</span>
                  <span className="text-xs font-semibold text-text-primary">
                    {Math.round(stockPercentage)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isLowStock ? 'bg-neon-red' : 'bg-hyper-green'
                    }`}
                    style={{ width: `${Math.min(100, stockPercentage)}%` }}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div className="flex justify-between">
                  <span className="text-text-muted">Min Threshold:</span>
                  <span className="text-text-primary font-semibold">
                    {item.min_threshold}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Total Value:</span>
                  <span className="text-text-primary font-semibold">
                    ${item.total_value.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => setAdjustmentVariant(item.variant_id)}
                className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isLowStock
                    ? 'bg-neon-red/20 text-neon-red hover:bg-neon-red/30'
                    : 'bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple/30'
                }`}
              >
                {isLowStock ? 'Adjust Now' : 'Adjust Stock'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Refresh Button */}
      <button
        onClick={() => fetchInventory(tenantId)}
        className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-sm text-text-primary hover:bg-white/5 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh Inventory
      </button>
    </div>
  );
}
