import { create } from 'zustand';

// ============================================================================
// ZUSTAND STATE MANAGEMENT
// ============================================================================

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface CartItem {
  id: string;
  imei_1: string;
  serial_number: string;
  device_model: string;
  selling_price: number;
  variant_id: string;
}

export interface RepairJob {
  id: string;
  job_no: string;
  customer_name: string;
  device_model: string;
  serial_or_imei: string;
  status: 'Pending' | 'Diagnosing' | 'Awaiting_Parts' | 'Completed' | 'Delivered';
  actual_cost?: number;
  created_at: string;
  updated_at: string;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

interface RepairStore {
  jobs: RepairJob[];
  selectedJob: RepairJob | null;
  setJobs: (jobs: RepairJob[]) => void;
  addJob: (job: RepairJob) => void;
  updateJob: (jobId: string, updates: Partial<RepairJob>) => void;
  selectJob: (job: RepairJob | null) => void;
}

interface AppStore {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  tenantId: string;
  setTenantId: (id: string) => void;
}

// Toast Store
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id: Math.random().toString(36).substring(7),
        },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

// Cart Store
export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
    })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  clearCart: () => set({ items: [] }),
  getTotal: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + item.selling_price, 0);
  },
}));

// Repair Store
export const useRepairStore = create<RepairStore>((set) => ({
  jobs: [],
  selectedJob: null,
  setJobs: (jobs) => set({ jobs }),
  addJob: (job) =>
    set((state) => ({
      jobs: [job, ...state.jobs],
    })),
  updateJob: (jobId, updates) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId ? { ...job, ...updates } : job,
      ),
    })),
  selectJob: (job) => set({ selectedJob: job }),
}));

// App Store
export const useAppStore = create<AppStore>((set) => ({
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  tenantId: '',
  setTenantId: (id) => set({ tenantId: id }),
}));
