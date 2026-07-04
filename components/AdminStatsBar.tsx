'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/lib/stores/adminStore';
import { TrendingUp, AlertTriangle, Zap, Clock } from 'lucide-react';

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'cyan' | 'purple' | 'green' | 'red';
  trend?: string;
}

export function AdminStatsBar({ tenantId }: { tenantId: string }) {
  const { stats, statsLoading, fetchStats } = useAdminStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchStats(tenantId);
  }, [tenantId, fetchStats]);

  if (!isMounted || statsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass-panel h-24 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      label: 'Total Revenue',
      value: stats ? `$${(stats.total_revenue / 1000).toFixed(1)}K` : '$0',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'cyan',
      trend: '+12.5%',
    },
    {
      label: 'Repair Completion',
      value: stats ? `${stats.repair_completion_rate}%` : '0%',
      icon: <Zap className="w-5 h-5" />,
      color: 'green',
      trend: '+2.3%',
    },
    {
      label: 'Low Stock Alerts',
      value: stats?.low_stock_alerts || 0,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: stats?.low_stock_alerts ? 'red' : 'green',
      trend: 'requires attention',
    },
    {
      label: 'Active Repairs',
      value: stats?.active_repairs || 0,
      icon: <Clock className="w-5 h-5" />,
      color: 'purple',
      trend: '+5 today',
    },
  ];

  const colorMap = {
    cyan: {
      bg: 'bg-electric-cyan/10',
      text: 'text-electric-cyan',
      icon: 'text-electric-cyan',
    },
    purple: {
      bg: 'bg-cyber-purple/10',
      text: 'text-cyber-purple',
      icon: 'text-cyber-purple',
    },
    green: {
      bg: 'bg-hyper-green/10',
      text: 'text-hyper-green',
      icon: 'text-hyper-green',
    },
    red: {
      bg: 'bg-neon-red/10',
      text: 'text-neon-red',
      icon: 'text-neon-red',
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, i) => {
        const colors = colorMap[stat.color];
        return (
          <div
            key={i}
            className={`glass-panel p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all card-lift ${colors.bg}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-text-muted mb-1">{stat.label}</p>
                <h3 className={`text-2xl font-bold ${colors.text}`}>
                  {stat.value}
                </h3>
                {stat.trend && (
                  <p className="text-xs text-text-muted mt-2">{stat.trend}</p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${colors.bg}`}>
                <div className={colors.icon}>{stat.icon}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
