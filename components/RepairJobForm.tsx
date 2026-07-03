'use client';

import { useState, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { repairApi } from '@/lib/api-client';
import { useToastStore, useRepairStore, useAppStore } from '@/lib/store';

interface FormErrors {
  customer_name?: string;
  customer_phone?: string;
  device_model?: string;
  serial_or_imei?: string;
  issue_description?: string;
}

export function RepairJobForm({ onClose }: { onClose?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    device_model: '',
    serial_or_imei: '',
    issue_description: '',
  });

  const { addToast } = useToastStore();
  const { addJob } = useRepairStore();
  const { tenantId } = useAppStore();

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = 'Phone number is required';
    } else if (!/^[0-9\-\+\(\)\s]+$/.test(formData.customer_phone)) {
      newErrors.customer_phone = 'Invalid phone number format';
    }

    if (!formData.device_model.trim()) {
      newErrors.device_model = 'Device model is required';
    }

    if (!formData.serial_or_imei.trim()) {
      newErrors.serial_or_imei = 'Serial number or IMEI is required';
    }

    if (!formData.issue_description.trim()) {
      newErrors.issue_description = 'Issue description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast({
        type: 'error',
        message: 'Please fix the errors below.',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        tenant_id: tenantId,
        ...formData,
      };

      const response = await repairApi.createJob(payload) as any;

      if (response?.data) {
        const job = response.data.repair;
        addJob(job);

        addToast({
          type: 'success',
          message: `Job created: ${response.data.job_no}`,
          duration: 4000,
        });

        // Reset form
        setFormData({
          customer_name: '',
          customer_phone: '',
          device_model: '',
          serial_or_imei: '',
          issue_description: '',
        });

        onClose?.();
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        message:
          error.message ||
          'Failed to create repair job. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const FormField = ({
    label,
    name,
    type = 'text',
    placeholder,
    error,
    multiline = false,
  }: {
    label: string;
    name: string;
    type?: string;
    placeholder?: string;
    error?: string;
    multiline?: boolean;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-electric-cyan">
        {label}
        {!multiline && <span className="text-neon-red"> *</span>}
      </label>
      {multiline ? (
        <textarea
          name={name}
          value={(formData as any)[name]}
          onChange={handleChange}
          placeholder={placeholder}
          rows={3}
          className={`w-full px-3 py-2 bg-surface-secondary border rounded-lg outline-none text-text-primary placeholder:text-text-subtle transition-all ${
            error
              ? 'border-neon-red focus:border-neon-red focus:shadow-lg focus:shadow-neon-red-20'
              : 'border-white/5 focus:border-electric-cyan focus:shadow-lg focus:shadow-electric-cyan-50'
          }`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={(formData as any)[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-surface-secondary border rounded-lg outline-none text-text-primary placeholder:text-text-subtle transition-all ${
            error
              ? 'border-neon-red focus:border-neon-red focus:shadow-lg focus:shadow-neon-red-20'
              : 'border-white/5 focus:border-electric-cyan focus:shadow-lg focus:shadow-electric-cyan-50'
          }`}
        />
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-neon-red">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Customer Name"
        name="customer_name"
        placeholder="Enter customer name"
        error={errors.customer_name}
      />

      <FormField
        label="Phone Number"
        name="customer_phone"
        type="tel"
        placeholder="e.g., +1 (555) 123-4567"
        error={errors.customer_phone}
      />

      <FormField
        label="Device Model"
        name="device_model"
        placeholder="e.g., iPhone 15 Pro, Samsung Galaxy S24"
        error={errors.device_model}
      />

      <FormField
        label="Serial or IMEI"
        name="serial_or_imei"
        placeholder="Enter device serial number or IMEI"
        error={errors.serial_or_imei}
      />

      <FormField
        label="Issue Description"
        name="issue_description"
        placeholder="Describe the device issue in detail"
        error={errors.issue_description}
        multiline
      />

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-hyper-green text-black rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? 'Creating...' : 'Create Job'}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-white/5 rounded-lg font-semibold hover:bg-surface-secondary transition-all"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
