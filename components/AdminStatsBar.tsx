'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAdminStore } from '@/lib/stores/adminStore';
import { TrendingUp, AlertTriangle, Zap, Clock } from 'lucide-react';

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'cyan' | 'purple' | 'green' | 'red';
  trend?: string;
}

interface MousePos {
  x: number;
  y: number;
}

export function AdminStatsBar({ 
  tenantId, 
  onRestrictedAction 
}: { 
  tenantId: string;
  onRestrictedAction?: (value: boolean) => void;
}) {
  const { stats, statsLoading, fetchStats } = useAdminStore();
  const [isMounted, setIsMounted] = useState(false);
  const [mousePos, setMousePos] = useState<MousePos>({ x: 0, y: 0 });
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setIsMounted(true);
    fetchStats(tenantId);
  }, [tenantId, fetchStats]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const card = cardRefs.current[index];
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 3D perspective tilt
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

    // Cursor-tracking spotlight
    setMousePos({ x, y });
  };

  const handleMouseLeave = (index: number) => {
    const card = cardRefs.current[index];
    if (card) {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    }
  };

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
      glowColor: 'rgba(0, 242, 254, 0.3)',
      shadowColor: '#00F2FE',
    },
    purple: {
      bg: 'bg-cyber-purple/10',
      text: 'text-cyber-purple',
      icon: 'text-cyber-purple',
      glowColor: 'rgba(79, 172, 254, 0.3)',
      shadowColor: '#4FACFE',
    },
    green: {
      bg: 'bg-hyper-green/10',
      text: 'text-hyper-green',
      icon: 'text-hyper-green',
      glowColor: 'rgba(0, 255, 135, 0.3)',
      shadowColor: '#00FF87',
    },
    red: {
      bg: 'bg-neon-red/10',
      text: 'text-neon-red',
      icon: 'text-neon-red',
      glowColor: 'rgba(255, 51, 102, 0.3)',
      shadowColor: '#ff3366',
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, i) => {
        const colors = colorMap[stat.color];
        return (
          <motion.div
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onMouseMove={(e) => handleMouseMove(e, i)}
            onMouseLeave={() => handleMouseLeave(i)}
            className={`glass-panel-premium p-5 rounded-lg border border-slate-800/60 transition-all duration-300 relative overflow-hidden group cursor-pointer`}
            style={{
              boxShadow: `0 0 20px ${colors.glowColor}`,
            }}
          >
            {/* Cursor-tracking spotlight */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-40 pointer-events-none transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle 150px at ${mousePos.x}px ${mousePos.y}px, ${colors.glowColor}, transparent 80%)`,
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-text-muted mb-2 uppercase tracking-wide font-mono">
                  {stat.label}
                </p>
                <h3 className={`text-3xl font-bold ${colors.text} neon-text-${stat.color}`}>
                  {stat.value}
                </h3>
                {stat.trend && (
                  <p className="text-xs text-text-muted mt-3 font-medium">
                    {stat.trend}
                  </p>
                )}
              </div>
              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className={`p-3 rounded-lg ${colors.bg} border border-${stat.color}/30`}
              >
                <div className={`${colors.icon} w-6 h-6`}>{stat.icon}</div>
              </motion.div>
            </div>

            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-${stat.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          </motion.div>
        );
      })}
    </div>
  );
}
