'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Database, Zap, Clock } from 'lucide-react';

interface SystemStatus {
  database: 'connected' | 'disconnected' | 'checking';
  apiServer: 'operational' | 'degraded' | 'checking';
  lastBackup: string;
  responseTime: number;
}

export function SystemStatusMonitor({ tenantId }: { tenantId: string }) {
  const [status, setStatus] = useState<SystemStatus>({
    database: 'checking',
    apiServer: 'checking',
    lastBackup: '2h ago',
    responseTime: 0,
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Simulate polling for system health
    const checkHealth = async () => {
      try {
        const start = performance.now();
        const response = await fetch('/api/health', {
          method: 'GET',
          headers: { 'X-Tenant-ID': tenantId },
          signal: AbortSignal.timeout(3000),
        }).catch(() => null);
        
        const responseTime = Math.round(performance.now() - start);
        
        setStatus({
          database: response?.ok ? 'connected' : 'disconnected',
          apiServer: response?.ok ? 'operational' : 'degraded',
          lastBackup: '2h ago',
          responseTime: responseTime > 0 ? responseTime : 0,
        });
      } catch (error) {
        setStatus((prev) => ({
          ...prev,
          database: 'disconnected',
          apiServer: 'degraded',
        }));
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [tenantId]);

  if (!isMounted) {
    return (
      <div className="flex items-center gap-4 overflow-x-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-slate-800/40 rounded animate-pulse flex-shrink-0 w-32"></div>
        ))}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'operational':
        return 'text-hyper-green';
      case 'degraded':
        return 'text-neon-red';
      default:
        return 'text-text-muted';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'connected':
      case 'operational':
        return 'bg-hyper-green/10';
      case 'degraded':
        return 'bg-neon-red/10';
      default:
        return 'bg-slate-800/20';
    }
  };

  const StatusBadge = ({ label, value, icon: Icon, status }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 ${getStatusBg(status)} border border-slate-700/40 backdrop-blur-sm`}
    >
      <Icon className={`w-3.5 h-3.5 ${getStatusColor(status)}`} />
      <span className="text-text-muted">{label}:</span>
      <span className={`font-semibold ${getStatusColor(status)}`}>{value}</span>
    </motion.div>
  );

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      <StatusBadge
        label="Database"
        value={status.database === 'connected' ? 'Connected' : 'Offline'}
        icon={Database}
        status={status.database}
      />
      <StatusBadge
        label="API"
        value={status.apiServer === 'operational' ? 'Operational' : 'Degraded'}
        icon={Server}
        status={status.apiServer}
      />
      <StatusBadge
        label="Response"
        value={`${status.responseTime}ms`}
        icon={Zap}
        status={status.responseTime < 500 ? 'connected' : 'degraded'}
      />
      <StatusBadge
        label="Backup"
        value={status.lastBackup}
        icon={Clock}
        status="connected"
      />
    </div>
  );
}
