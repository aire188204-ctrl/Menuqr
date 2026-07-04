'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/lib/stores/adminStore';
import { UserPlus, Edit2, Trash2, Shield, Eye, EyeOff } from 'lucide-react';

export function AdminUserManager({ tenantId }: { tenantId: string }) {
  const {
    users,
    usersLoading,
    selectedUser,
    fetchUsers,
    updateUser,
    createUser,
    setSelectedUser,
  } = useAdminStore();
  const [isMounted, setIsMounted] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'Cashier' as const,
  });

  useEffect(() => {
    setIsMounted(true);
    fetchUsers(tenantId);
  }, [tenantId, fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser({
      ...formData,
      tenant_id: tenantId,
    });
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'Cashier',
    });
    setShowCreateForm(false);
  };

  const handleStatusChange = async (userId: string, newStatus: 'Active' | 'Suspended') => {
    await updateUser(userId, { status: newStatus } as any);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateUser(userId, { role: newRole as any });
  };

  if (!isMounted) {
    return <div className="glass-panel h-96 rounded-lg animate-pulse" />;
  }

  const roleColors = {
    Super_Admin: 'text-electric-cyan bg-electric-cyan/10',
    Store_Manager: 'text-cyber-purple bg-cyber-purple/10',
    Cashier: 'text-hyper-green bg-hyper-green/10',
    Technician: 'text-hyper-green bg-hyper-green/10',
  };

  const statusColors = {
    Active: 'bg-hyper-green/10 text-hyper-green',
    Suspended: 'bg-neon-red/10 text-neon-red',
    Inactive: 'bg-text-muted/10 text-text-muted',
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text-primary">Staff Roster</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-neon-purple flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="glass-panel-premium p-6 rounded-lg border border-white/10 space-y-4">
          <h3 className="font-semibold text-text-primary">Create New User</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className="px-3 py-2 bg-surface-secondary/50 glass-panel rounded text-text-primary text-sm"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className="px-3 py-2 bg-surface-secondary/50 glass-panel rounded text-text-primary text-sm"
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-surface-secondary/50 glass-panel rounded text-text-primary text-sm"
              required
            />
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as any })
              }
              className="w-full px-3 py-2 bg-surface-secondary/50 glass-panel rounded text-text-primary text-sm"
            >
              <option value="Cashier">Cashier</option>
              <option value="Technician">Technician</option>
              <option value="Store_Manager">Store Manager</option>
              <option value="Super_Admin">Super Admin</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn-neon-cyan px-4 py-2 rounded text-sm"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-white/10 rounded text-sm text-text-primary hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-panel-premium rounded-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-surface-secondary/30">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-primary">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-text-primary">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-semibold text-text-primary">
                  Role
                </th>
                <th className="px-4 py-3 text-left font-semibold text-text-primary">
                  Status
                </th>
                <th className="px-4 py-3 text-center font-semibold text-text-primary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-text-primary">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        roleColors[user.role as keyof typeof roleColors]
                      }`}
                    >
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.status}
                      onChange={(e) =>
                        handleStatusChange(user.id, e.target.value as any)
                      }
                      className={`px-2 py-1 rounded text-xs font-semibold border-0 cursor-pointer ${
                        statusColors[user.status as keyof typeof statusColors]
                      }`}
                    >
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-1.5 hover:bg-electric-cyan/10 rounded transition-colors text-electric-cyan"
                        title="View Audit Log"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRoleChange(user.id, 'Technician')}
                        className="p-1.5 hover:bg-cyber-purple/10 rounded transition-colors text-cyber-purple"
                        title="Edit Permissions"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Viewer */}
      {selectedUser && (
        <div className="glass-panel-premium p-6 rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">
              Audit Log - {selectedUser.first_name} {selectedUser.last_name}
            </h3>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <div className="text-xs text-text-muted p-2 bg-white/5 rounded">
              CHECKOUT - Sale processed for $999.99 - 2min ago
            </div>
            <div className="text-xs text-text-muted p-2 bg-white/5 rounded">
              CREATE_REPAIR - Job JOB-2025-0001 created - 15min ago
            </div>
            <div className="text-xs text-text-muted p-2 bg-white/5 rounded">
              UPDATE_INVENTORY - Stock adjusted for iPhone 15 Pro - 1hr ago
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
