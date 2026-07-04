'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminStore } from '@/lib/stores/adminStore';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminStatsBar } from '@/components/AdminStatsBar';
import { AdminTenantSettings } from '@/components/AdminTenantSettings';
import { AdminUserManager } from '@/components/AdminUserManager';
import { AdminInventoryManager } from '@/components/AdminInventoryManager';
import { SystemStatusMonitor } from '@/components/SystemStatusMonitor';
import { Toast } from '@/components/Toast';
import { X, Lock } from 'lucide-react';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

export default function AdminDashboard() {
  const {
    sidebarOpen,
    activeModule,
    setAdminRole,
    adminRole,
    toastMessage,
    setToastMessage,
  } = useAdminStore();
  const [isMounted, setIsMounted] = useState(false);
  const [restrictedAction, setRestrictedAction] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Set admin role on mount
    setAdminRole('Super_Admin');
  }, [setAdminRole]);

  // Handle restricted action warning
  useEffect(() => {
    if (restrictedAction) {
      const timer = setTimeout(() => setRestrictedAction(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [restrictedAction]);

  if (!isMounted) {
    return (
      <div className="bg-black min-h-screen">
        <div className="flex items-center justify-center h-screen">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-12 h-12 rounded-lg bg-electric-cyan/30 animate-pulse mx-auto mb-4 glow-cyan-lg"></div>
            <p className="text-text-muted text-sm">Loading Central Operations Suite...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  const isRestrictedUser = adminRole !== 'Super_Admin';

  return (
    <div className="bg-black min-h-screen flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}
      >
        {/* Top Bar - Premium Glassmorphic */}
        <div className="sticky top-0 z-30 border-b border-slate-800/60">
          <div className="glass-panel-premium backdrop-blur-xl">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h1 className="text-2xl font-bold text-glow">Central Operations Suite</h1>
                <p className="text-xs text-text-muted mt-1">
                  Production Financial Control & Management
                </p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs bg-electric-cyan/20 text-electric-cyan px-3 py-1 rounded-full font-mono neon-text-cyan">
                    Tenant: {TENANT_ID.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      Test Store
                    </p>
                    <p className={`text-xs font-mono ${adminRole === 'Super_Admin' ? 'text-hyper-green' : 'text-text-muted'}`}>
                      {adminRole === 'Super_Admin' ? '✓ Super_Admin' : `○ ${adminRole}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status Monitor Inline */}
        <div className="border-b border-slate-800/60 px-6 py-3">
          <SystemStatusMonitor tenantId={TENANT_ID} />
        </div>

        {/* Restricted Access Warning */}
        <AnimatePresence>
          {restrictedAction && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-panel-premium mx-6 mt-4 p-3 rounded-lg border border-neon-red/50 bg-neon-red/10 flex items-center gap-3"
            >
              <Lock className="w-4 h-4 text-neon-red flex-shrink-0" />
              <span className="text-sm text-neon-red font-semibold">
                This action requires Super_Admin privileges
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="p-6 space-y-6">
          {/* Stats Bar */}
          {(activeModule === 'dashboard' || activeModule === 'analytics') && (
            <AdminStatsBar tenantId={TENANT_ID} onRestrictedAction={setRestrictedAction} />
          )}

          {/* Module Content with Smooth Transitions */}
          <AnimatePresence mode="wait">
            {activeModule === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                {isRestrictedUser ? (
                  <div className="glass-panel-premium p-8 rounded-lg border border-neon-red/30 text-center">
                    <Lock className="w-8 h-8 text-neon-red mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-neon-red mb-2">Access Denied</h3>
                    <p className="text-text-muted text-sm">
                      Settings management requires Super_Admin role
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-glow mb-4">
                      Tenant & Store Settings
                    </h2>
                    <AdminTenantSettings tenantId={TENANT_ID} />
                  </>
                )}
              </motion.div>
            )}

            {activeModule === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                {isRestrictedUser ? (
                  <div className="glass-panel-premium p-8 rounded-lg border border-neon-red/30 text-center">
                    <Lock className="w-8 h-8 text-neon-red mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-neon-red mb-2">Access Denied</h3>
                    <p className="text-text-muted text-sm">
                      RBAC management requires Super_Admin role
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-glow mb-4">
                      User & RBAC Management
                    </h2>
                    <AdminUserManager tenantId={TENANT_ID} onRestrictedAction={setRestrictedAction} />
                  </>
                )}
              </motion.div>
            )}

            {activeModule === 'inventory' && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-xl font-bold text-glow mb-4">
                  Inventory & Stock Management
                </h2>
                <AdminInventoryManager tenantId={TENANT_ID} onRestrictedAction={setRestrictedAction} />
              </motion.div>
            )}

            {activeModule === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Quick Actions & System Health */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel-premium p-6 rounded-lg border border-slate-800/60 neon-border-cyan"
                  >
                    <h3 className="font-bold text-text-primary mb-4 neon-text-cyan">Quick Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          if (isRestrictedUser) setRestrictedAction(true);
                        }}
                        className="w-full p-3 rounded-lg bg-electric-cyan/10 text-electric-cyan hover:bg-electric-cyan/20 transition-all text-sm font-medium border border-electric-cyan/20 hover:border-electric-cyan/40"
                      >
                        📊 View Sales Report
                      </button>
                      <button
                        onClick={() => {
                          if (isRestrictedUser) setRestrictedAction(true);
                        }}
                        className="w-full p-3 rounded-lg bg-cyber-purple/10 text-cyber-purple hover:bg-cyber-purple/20 transition-all text-sm font-medium border border-cyber-purple/20 hover:border-cyber-purple/40"
                      >
                        🔧 Repair Analytics
                      </button>
                      <button
                        onClick={() => {
                          if (isRestrictedUser) setRestrictedAction(true);
                        }}
                        className="w-full p-3 rounded-lg bg-hyper-green/10 text-hyper-green hover:bg-hyper-green/20 transition-all text-sm font-medium border border-hyper-green/20 hover:border-hyper-green/40"
                      >
                        ⬇️ Generate Export
                      </button>
                    </div>
                  </motion.div>

                  {/* System Health */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-panel-premium p-6 rounded-lg border border-slate-800/60 neon-border-green"
                  >
                    <h3 className="font-bold text-text-primary mb-4 neon-text-green">System Health</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">Database</span>
                        <span className="badge-green text-xs">Connected</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">API Server</span>
                        <span className="badge-green text-xs">Operational</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">Backup Status</span>
                        <span className="text-xs text-text-muted font-mono">2h ago</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Welcome & Documentation */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-panel-premium p-6 rounded-lg border border-slate-800/60 neon-border-cyan"
                >
                  <h3 className="font-bold text-text-primary mb-2 text-lg neon-text-cyan">
                    Central Operations Suite
                  </h3>
                  <p className="text-sm text-text-muted mb-4 leading-relaxed">
                    Production-grade management system for controlling all aspects of your multi-tenant mobile phone retail and repair operation.
                  </p>
                  <ul className="text-sm text-text-muted space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-electric-cyan font-bold">✓</span>
                      <span>Advanced tenant settings with module toggles and tax configuration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-electric-cyan font-bold">✓</span>
                      <span>Role-Based Access Control (RBAC) for staff hierarchy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-electric-cyan font-bold">✓</span>
                      <span>Real-time inventory tracking with low-stock alerts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-electric-cyan font-bold">✓</span>
                      <span>Live system status monitoring and audit logging</span>
                    </li>
                  </ul>
                </motion.div>
              </motion.div>
            )}

            {activeModule === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-xl font-bold text-glow mb-4">
                  Analytics & Reporting
                </h2>
                <div className="glass-panel-premium p-8 rounded-lg border border-slate-800/60 text-center">
                  <p className="text-text-muted mb-3">
                    Advanced analytics, charts, and business intelligence reports
                  </p>
                  <p className="text-xs text-text-subtle">Coming in next phase...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
