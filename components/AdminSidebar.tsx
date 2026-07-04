'use client';

import { useAdminStore } from '@/lib/stores/adminStore';
import {
  LayoutDashboard,
  Settings,
  Users,
  Package,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function AdminSidebar() {
  const { sidebarOpen, setSidebarOpen, activeModule, setActiveModule } = useAdminStore();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      module: 'dashboard' as const,
    },
    {
      icon: Settings,
      label: 'Settings',
      module: 'settings' as const,
    },
    {
      icon: Users,
      label: 'Users & RBAC',
      module: 'users' as const,
    },
    {
      icon: Package,
      label: 'Inventory',
      module: 'inventory' as const,
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      module: 'analytics' as const,
    },
  ];

  return (
    <aside
      className={`glass-panel-premium fixed left-0 top-0 h-screen border-r border-white/10 transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-electric-cyan/20 flex items-center justify-center neon-border-cyan">
              <span className="text-electric-cyan text-sm font-bold">⚙</span>
            </div>
            <span className="text-sm font-bold text-text-primary neon-text-cyan">
              Admin
            </span>
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-text-muted hover:text-text-primary"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 p-4">
        {menuItems.map(({ icon: Icon, label, module }) => (
          <button
            key={module}
            onClick={() => setActiveModule(module)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
              activeModule === module
                ? 'bg-electric-cyan/20 text-electric-cyan neon-border-cyan'
                : 'text-text-muted hover:text-text-primary hover:bg-white/5'
            }`}
            title={label}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        {sidebarOpen && (
          <div className="p-3 rounded-lg bg-white/5 text-xs text-text-muted">
            <p className="font-semibold text-text-primary mb-1">Admin Mode</p>
            <p>Super_Admin Access</p>
          </div>
        )}
      </div>
    </aside>
  );
}
