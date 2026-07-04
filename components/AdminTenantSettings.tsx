'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/lib/stores/adminStore';
import { Save, RefreshCw } from 'lucide-react';

export function AdminTenantSettings({ tenantId }: { tenantId: string }) {
  const { tenantSettings, settingsLoading, fetchTenantSettings, updateTenantSettings } =
    useAdminStore();
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    tax_percentage: 10,
    currency_symbol: '$',
    enable_installments: false,
    enable_repairs: true,
    enable_loyalty_points: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchTenantSettings(tenantId);
  }, [tenantId, fetchTenantSettings]);

  useEffect(() => {
    if (tenantSettings) {
      setFormData({
        store_name: tenantSettings.store_name,
        tax_percentage: tenantSettings.tax_percentage,
        currency_symbol: tenantSettings.currency_symbol,
        enable_installments: tenantSettings.enable_installments,
        enable_repairs: tenantSettings.enable_repairs,
        enable_loyalty_points: tenantSettings.enable_loyalty_points,
      });
    }
  }, [tenantSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateTenantSettings(tenantId, formData);
    setIsSaving(false);
  };

  if (!isMounted) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-panel h-12 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel-premium p-6 rounded-lg border border-white/10">
        <h2 className="text-lg font-bold text-text-primary mb-6">Store Configuration</h2>

        <div className="space-y-4">
          {/* Store Name */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Store Name
            </label>
            <input
              type="text"
              name="store_name"
              value={formData.store_name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-surface-secondary/50 glass-panel rounded-lg text-text-primary placeholder:text-text-subtle focus:outline-none focus:border-electric-cyan transition-colors"
              placeholder="Enter store name"
            />
          </div>

          {/* Tax Percentage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Tax Percentage (%)
              </label>
              <input
                type="number"
                name="tax_percentage"
                value={formData.tax_percentage}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-4 py-2 bg-surface-secondary/50 glass-panel rounded-lg text-text-primary focus:outline-none focus:border-electric-cyan transition-colors"
              />
            </div>

            {/* Currency Symbol */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Currency Symbol
              </label>
              <input
                type="text"
                name="currency_symbol"
                value={formData.currency_symbol}
                onChange={handleInputChange}
                maxLength="3"
                className="w-full px-4 py-2 bg-surface-secondary/50 glass-panel rounded-lg text-text-primary focus:outline-none focus:border-electric-cyan transition-colors"
              />
            </div>
          </div>

          {/* Module Toggles */}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Enable Modules</h3>

            <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
              <input
                type="checkbox"
                name="enable_repairs"
                checked={formData.enable_repairs}
                onChange={handleInputChange}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-sm text-text-primary">Repair Management</span>
              <span className="ml-auto text-xs badge-green">Recommended</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
              <input
                type="checkbox"
                name="enable_installments"
                checked={formData.enable_installments}
                onChange={handleInputChange}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-sm text-text-primary">Installment Plans</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
              <input
                type="checkbox"
                name="enable_loyalty_points"
                checked={formData.enable_loyalty_points}
                onChange={handleInputChange}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-sm text-text-primary">Loyalty Points System</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={handleSave}
            disabled={isSaving || settingsLoading}
            className="btn-neon-cyan flex items-center gap-2 px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
          <button
            onClick={() => fetchTenantSettings(tenantId)}
            className="px-4 py-2 border border-white/10 rounded-lg text-sm text-text-primary hover:bg-white/5 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Metadata JSON Editor */}
      <div className="glass-panel-premium p-6 rounded-lg border border-white/10">
        <h3 className="text-sm font-bold text-text-primary mb-3">Advanced JSON Metadata</h3>
        <textarea
          className="w-full h-32 px-4 py-2 bg-surface-secondary/50 glass-panel rounded-lg text-text-primary font-mono text-xs focus:outline-none focus:border-electric-cyan transition-colors"
          placeholder='{"key": "value"}'
          defaultValue={JSON.stringify(tenantSettings?.metadata || {}, null, 2)}
        />
        <p className="text-xs text-text-muted mt-2">
          For advanced configurations not covered by standard settings
        </p>
      </div>
    </div>
  );
}
