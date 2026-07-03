'use client';

import { Trash2, DollarSign, Package } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { TiltCard } from './TiltCard';

export function CartSummary() {
  const { items, removeItem, clearCart, getTotal } = useCartStore();
  const total = getTotal();

  return (
    <TiltCard className="p-6 card-lift" glowColor="purple">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-cyber-purple neon-text-purple">Invoice Cart</h2>
          <span className="badge-purple">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center">
            <Package className="w-12 h-12 mx-auto text-text-muted opacity-50 mb-3" />
            <p className="text-text-muted">No items added yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 p-3 rounded glass-panel hover:border-electric-cyan/30 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {item.device_model}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {item.imei_1}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-sm font-semibold text-electric-cyan min-w-[60px] text-right">
                      ${item.selling_price.toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 hover:bg-neon-red-20 text-neon-red rounded transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="divider-cyan my-4"></div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Subtotal</span>
                <span className="text-sm font-semibold text-text-primary">
                  ${total.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Estimated Tax (10%)</span>
                <span className="text-sm font-semibold text-text-primary">
                  ${(total * 0.1).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-glow">Total</span>
                <span className="text-lg font-bold text-electric-cyan neon-text-cyan glow-cyan">
                  ${(total * 1.1).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button className="btn-neon-cyan flex-1 px-4 py-2 rounded-lg text-sm">
                Checkout
              </button>
              <button
                onClick={clearCart}
                className="px-4 py-2 border border-neon-red text-neon-red rounded-lg font-semibold hover:bg-neon-red-20 transition-all text-sm"
              >
                Clear
              </button>
            </div>
          </>
        )}
      </div>
    </TiltCard>
  );
}
