import { create } from 'zustand';

interface StaffUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'Super_Admin' | 'Store_Manager' | 'Cashier' | 'Technician';
  status: 'Active' | 'Suspended' | 'Inactive';
  created_at: string;
}

interface TenantSettings {
  tenant_id: string;
  store_name: string;
  tax_percentage: number;
  currency_symbol: string;
  enable_installments: boolean;
  enable_repairs: boolean;
  enable_loyalty_points: boolean;
  metadata: Record<string, any>;
}

interface InventoryItem {
  variant_id: string;
  product_name: string;
  variant_name: string;
  current_stock: number;
  min_threshold: number;
  status: string;
  total_value: number;
}

interface AdminStats {
  total_revenue: number;
  repair_completion_rate: number;
  low_stock_alerts: number;
  active_repairs: number;
  total_customers: number;
}

interface AdminStore {
  // Auth & Session
  isAdmin: boolean;
  adminRole: string | null;
  setAdminRole: (role: string) => void;

  // Tenant Settings
  tenantSettings: TenantSettings | null;
  settingsLoading: boolean;
  settingsError: string | null;
  fetchTenantSettings: (tenantId: string) => Promise<void>;
  updateTenantSettings: (tenantId: string, data: Partial<TenantSettings>) => Promise<void>;

  // Users Management
  users: StaffUser[];
  usersLoading: boolean;
  usersError: string | null;
  selectedUser: StaffUser | null;
  fetchUsers: (tenantId: string) => Promise<void>;
  createUser: (userData: Partial<StaffUser>) => Promise<void>;
  updateUser: (userId: string, userData: Partial<StaffUser>) => Promise<void>;
  setSelectedUser: (user: StaffUser | null) => void;

  // Inventory Management
  inventory: InventoryItem[];
  inventoryLoading: boolean;
  inventoryError: string | null;
  lowStockAlerts: number;
  fetchInventory: (tenantId: string) => Promise<void>;
  adjustInventory: (
    tenantId: string,
    variantId: string,
    adjustment: number,
    reason: string
  ) => Promise<void>;

  // Analytics & Stats
  stats: AdminStats | null;
  statsLoading: boolean;
  fetchStats: (tenantId: string) => Promise<void>;

  // Audit Logging
  auditLogs: any[];
  fetchAuditLogs: (userId: string) => Promise<void>;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeModule: 'dashboard' | 'settings' | 'users' | 'inventory' | 'analytics';
  setActiveModule: (module: AdminStore['activeModule']) => void;
  toastMessage: string | null;
  setToastMessage: (message: string | null) => void;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  // Auth & Session
  isAdmin: false,
  adminRole: null,
  setAdminRole: (role: string) => set({ adminRole: role, isAdmin: true }),

  // Tenant Settings
  tenantSettings: null,
  settingsLoading: false,
  settingsError: null,
  fetchTenantSettings: async (tenantId: string) => {
    set({ settingsLoading: true, settingsError: null });
    try {
      const response = await fetch(
        `/api/v1/admin/tenant/${tenantId}/settings`
      );
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      set({ tenantSettings: data, settingsLoading: false });
    } catch (error) {
      set({
        settingsError: error instanceof Error ? error.message : 'Unknown error',
        settingsLoading: false,
      });
    }
  },
  updateTenantSettings: async (tenantId: string, data: Partial<TenantSettings>) => {
    set({ settingsLoading: true });
    try {
      const response = await fetch(
        `/api/v1/admin/tenant/${tenantId}/settings`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error('Failed to update settings');
      const result = await response.json();
      set({
        tenantSettings: { ...get().tenantSettings, ...data } as TenantSettings,
        settingsLoading: false,
        toastMessage: result.message,
      });
    } catch (error) {
      set({
        settingsError: error instanceof Error ? error.message : 'Unknown error',
        settingsLoading: false,
      });
    }
  },

  // Users Management
  users: [],
  usersLoading: false,
  usersError: null,
  selectedUser: null,
  fetchUsers: async (tenantId: string) => {
    set({ usersLoading: true, usersError: null });
    try {
      const response = await fetch(`/api/v1/admin/users?tenant_id=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const { data } = await response.json();
      set({ users: data, usersLoading: false });
    } catch (error) {
      set({
        usersError: error instanceof Error ? error.message : 'Unknown error',
        usersLoading: false,
      });
    }
  },
  createUser: async (userData: Partial<StaffUser>) => {
    try {
      const response = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Failed to create user');
      const { data } = await response.json();
      set({
        users: [...get().users, data],
        toastMessage: 'User created successfully',
      });
    } catch (error) {
      set({
        usersError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  updateUser: async (userId: string, userData: Partial<StaffUser>) => {
    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Failed to update user');
      set({
        users: get().users.map((u) => (u.id === userId ? { ...u, ...userData } : u)),
        toastMessage: 'User updated successfully',
      });
    } catch (error) {
      set({
        usersError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  setSelectedUser: (user: StaffUser | null) => set({ selectedUser: user }),

  // Inventory Management
  inventory: [],
  inventoryLoading: false,
  inventoryError: null,
  lowStockAlerts: 0,
  fetchInventory: async (tenantId: string) => {
    set({ inventoryLoading: true, inventoryError: null });
    try {
      const response = await fetch(
        `/api/v1/admin/inventory/adjust?tenant_id=${tenantId}&action=status`
      );
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      set({
        inventory: data.inventory,
        lowStockAlerts: data.summary?.low_stock_items || 0,
        inventoryLoading: false,
      });
    } catch (error) {
      set({
        inventoryError: error instanceof Error ? error.message : 'Unknown error',
        inventoryLoading: false,
      });
    }
  },
  adjustInventory: async (
    tenantId: string,
    variantId: string,
    adjustment: number,
    reason: string
  ) => {
    try {
      const response = await fetch('/api/v1/admin/inventory/adjust', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          variant_id: variantId,
          quantity_adjustment: adjustment,
          reason,
          adjusted_by_user_id: 'current-user-id',
        }),
      });
      if (!response.ok) throw new Error('Failed to adjust inventory');
      const result = await response.json();
      set({ toastMessage: result.message });
      // Refresh inventory
      get().fetchInventory(tenantId);
    } catch (error) {
      set({
        inventoryError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Analytics & Stats
  stats: null,
  statsLoading: false,
  fetchStats: async (tenantId: string) => {
    set({ statsLoading: true });
    try {
      // Mock stats - in production fetch from API
      const mockStats: AdminStats = {
        total_revenue: 45230.5,
        repair_completion_rate: 92.5,
        low_stock_alerts: 2,
        active_repairs: 7,
        total_customers: 342,
      };
      set({ stats: mockStats, statsLoading: false });
    } catch (error) {
      set({ statsLoading: false });
    }
  },

  // Audit Logging
  auditLogs: [],
  fetchAuditLogs: async (userId: string) => {
    try {
      const response = await fetch(`/api/v1/admin/users/${userId}/audit-log`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const { logs } = await response.json();
      set({ auditLogs: logs });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  },

  // UI State
  sidebarOpen: true,
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  activeModule: 'dashboard' as const,
  setActiveModule: (module: AdminStore['activeModule']) => set({ activeModule: module }),
  toastMessage: null,
  setToastMessage: (message: string | null) => set({ toastMessage: message }),
}));
