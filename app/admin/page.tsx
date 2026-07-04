'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/lib/stores/adminStore';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminStatsBar } from '@/components/AdminStatsBar';
import { AdminTenantSettings } from '@/components/AdminTenantSettings';
import { AdminUserManager } from '@/components/AdminUserManager';
import { AdminInventoryManager } from '@/components/AdminInventoryManager';
import { Toast } from '@/components/Toast';
import { X } from 'lucide-react';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

export default function AdminDashboard() {
  const {
    sidebarOpen,
    activeModule,
    setAdminRole,
    toastMessage,
    setToastMessage,
  } = useAdminStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Set admin role on mount
    setAdminRole('Super_Admin');
  }, [setAdminRole]);

  if (!isMounted) {
    return (
      <div className="bg-background min-h-screen">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-electric-cyan/20 animate-pulse mx-auto mb-4"></div>
            <p className="text-text-muted">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-30 glass-panel border-b border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-glow">Admin Control Center</h1>
              <p className="text-xs text-text-muted mt-1">
                Production-ready management system
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-text-primary">
                Test Store
              </p>
              <p className="text-xs text-text-muted">Super_Admin</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6">
          {/* Stats Bar */}
          {(activeModule === 'dashboard' || activeModule === 'analytics') && (
            <AdminStatsBar tenantId={TENANT_ID} />
          )}

          {/* Module Content */}
          {activeModule === 'settings' && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">
                Tenant & Store Settings
              </h2>
              <AdminTenantSettings tenantId={TENANT_ID} />
            </div>
          )}

          {activeModule === 'users' && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">
                User & RBAC Management
              </h2>
              <AdminUserManager tenantId={TENANT_ID} />
            </div>
          )}

          {activeModule === 'inventory' && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">
                Inventory & Stock Management
              </h2>
              <AdminInventoryManager tenantId={TENANT_ID} />
            </div>
          )}

          {activeModule === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Links */}
                <div className="glass-panel-premium p-6 rounded-lg border border-white/10">
                  <h3 className="font-bold text-text-primary mb-4">Quick Links</h3>
                  <div className="space-y-2">
                    <a
                      href="#"
                      className="block p-3 rounded-lg bg-electric-cyan/10 text-electric-cyan hover:bg-electric-cyan/20 transition-colors text-sm font-medium"
                    >
                      View Sales Report
                    </a>
                    <a
                      href="#"
                      className="block p-3 rounded-lg bg-cyber-purple/10 text-cyber-purple hover:bg-cyber-purple/20 transition-colors text-sm font-medium"
                    >
                      View Repair Analytics
                    </a>
                    <a
                      href="#"
                      className="block p-3 rounded-lg bg-hyper-green/10 text-hyper-green hover:bg-hyper-green/20 transition-colors text-sm font-medium"
                    >
                      Generate Export
                    </a>
                  </div>
                </div>

                {/* System Status */}
                <div className="glass-panel-premium p-6 rounded-lg border border-white/10">
                  <h3 className="font-bold text-text-primary mb-4">System Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">Database</span>
                      <span className="badge-green">Connected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">API Server</span>
                      <span className="badge-green">Operational</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">Backup</span>
                      <span className="text-xs text-text-muted">Last: 2h ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Welcome Section */}
              <div className="glass-panel-premium p-6 rounded-lg border border-white/10 neon-border-cyan">
                <h3 className="font-bold text-text-primary mb-2 neon-text-cyan">
                  Welcome to Admin Dashboard
                </h3>
                <p className="text-sm text-text-muted mb-4">
                  This is the central control center for managing your mobile phone retail and repair operation.
                  Use the sidebar to navigate between different management modules.
                </p>
                <ul className="text-sm text-text-muted space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-electric-cyan">✓</span>
                    <span>Configure store settings and enable/disable modules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-electric-cyan">✓</span>
                    <span>Manage staff with role-based access control (RBAC)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-electric-cyan">✓</span>
                    <span>Monitor inventory levels and adjust stock manually</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-electric-cyan">✓</span>
                    <span>View real-time analytics and audit logs</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeModule === 'analytics' && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">
                Analytics & Reports
              </h2>
              <div className="glass-panel-premium p-6 rounded-lg border border-white/10">
                <p className="text-text-muted">
                  Detailed analytics, charts, and reports coming soon...
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="glass-panel-premium p-4 rounded-lg border border-electric-cyan/30 flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm text-text-primary">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
