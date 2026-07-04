'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Toast } from '@/components/Toast';
import { IMEIScanner } from '@/components/IMEIScanner';
import { CartSummary } from '@/components/CartSummary';
import { RepairJobForm } from '@/components/RepairJobForm';
import { TiltCard } from '@/components/TiltCard';
import { Zap, AlertCircle, X } from 'lucide-react';

export default function Dashboard() {
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [tenantId, setTenantIdState] = useState('');
  const { setTenantId } = useAppStore();

  useEffect(() => {
    // For demo purposes, use a default tenant ID
    // In production, this would come from authentication
    const defaultTenantId = '00000000-0000-0000-0000-000000000001';
    setTenantIdState(defaultTenantId);
    setTenantId(defaultTenantId);
  }, [setTenantId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toast />

      {/* Header */}
      <header className="glass-panel border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-electric-cyan-10 rounded-lg neon-border-cyan">
                <Zap className="w-6 h-6 text-electric-cyan neon-text-cyan" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary neon-text-cyan">CellPhone POS</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="badge-cyan">
                <span className="w-2 h-2 bg-electric-cyan rounded-full"></span>
                Live
              </div>
              <p className="text-sm text-text-muted">
                Tenant: {tenantId.slice(0, 8)}...
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Scanner and Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Start Section */}
            <TiltCard className="p-6 card-lift" glowColor="cyan">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-glow mb-2">
                    Welcome to CellPhone POS
                  </h2>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Manage your mobile phone sales and repairs with our production-ready system.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setShowRepairForm(true)}
                    className="btn-neon-purple px-4 py-2 border border-cyber-purple rounded-lg text-sm"
                  >
                    New Repair Job
                  </button>
                  <button className="btn-neon-green px-4 py-2 border border-hyper-green rounded-lg text-sm">
                    View Inventory
                  </button>
                </div>
              </div>
            </TiltCard>

            {/* IMEI Scanner */}
            <TiltCard className="p-6" glowColor="cyan">
              <IMEIScanner />
            </TiltCard>

            {/* Repair Job Form Modal */}
            {showRepairForm && (
              <TiltCard className="p-6 relative" glowColor="purple">
                <button
                  onClick={() => setShowRepairForm(false)}
                  className="absolute top-4 right-4 p-1 hover:bg-surface-tertiary rounded transition-colors"
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
                <h3 className="text-lg font-bold text-cyber-purple mb-4">
                  Create New Repair Job
                </h3>
                <RepairJobForm onClose={() => setShowRepairForm(false)} />
              </TiltCard>
            )}

            {/* System Status */}
            <TiltCard className="p-6 border-hyper-green-20 bg-hyper-green-10 card-lift" glowColor="green">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-hyper-green-20 rounded-lg flex-shrink-0 mt-1 neon-border-green">
                  <Zap className="w-5 h-5 text-hyper-green neon-text-green" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-hyper-green neon-text-green">
                      System Status: Operational
                    </h4>
                    <span className="badge-green text-xs">Active</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    All services running normally. Database synced with Neon PostgreSQL.
                  </p>
                </div>
              </div>
            </TiltCard>
          </div>

          {/* Right Column - Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>

        {/* Features Grid */}
        <section className="mt-12 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-glow">Powerful Features</h2>
            <p className="text-text-muted text-sm">Everything you need to run a modern POS system</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'IMEI Scanning',
                description: 'Instantly identify devices and add to cart with barcode support.',
                icon: 'Scan',
              },
              {
                title: 'Repair Management',
                description: 'Track repairs from intake to delivery with status updates.',
                icon: 'Wrench',
              },
              {
                title: 'Inventory Tracking',
                description: 'Real-time stock management and parts deduction during repairs.',
                icon: 'Package',
              },
              {
                title: 'Cost Calculation',
                description: 'Automatic total cost with labor + parts calculations.',
                icon: 'DollarSign',
              },
              {
                title: 'Multi-tenant',
                description: 'Isolated data per tenant with full privacy and security.',
                icon: 'Shield',
              },
              {
                title: '3D Interactions',
                description: 'Immersive UI with 3D tilt effects and neon aesthetics.',
                icon: 'Zap',
              },
            ].map((feature, i) => (
              <TiltCard key={i} className="p-5 card-lift" glowColor={['cyan', 'purple', 'green'][i % 3] as any}>
                <h4 className="font-bold text-text-primary mb-2">{feature.title}</h4>
                <p className="text-sm text-text-muted leading-relaxed">{feature.description}</p>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* API Documentation Link */}
        <section className="mt-12 pb-8">
          <TiltCard
            className="p-6 border-electric-cyan-20 bg-electric-cyan-10 card-lift neon-border-cyan"
            glowColor="cyan"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-electric-cyan-10 rounded-lg flex-shrink-0 mt-1 neon-border-cyan">
                <AlertCircle className="w-6 h-6 text-electric-cyan neon-text-cyan" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-electric-cyan neon-text-cyan mb-2">
                  Documentation Available
                </h3>
                <p className="text-text-muted mb-4 leading-relaxed">
                  Check the repository for comprehensive API documentation:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-electric-cyan rounded-full"></span>
                    <code className="bg-surface-secondary/80 glass-panel px-2 py-1 rounded text-electric-cyan text-xs">
                      /POS_API_GUIDE.md
                    </code>
                    <span className="text-text-muted">Sales & IMEI Scanning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-electric-cyan rounded-full"></span>
                    <code className="bg-surface-secondary/80 glass-panel px-2 py-1 rounded text-electric-cyan text-xs">
                      /REPAIR_API_GUIDE.md
                    </code>
                    <span className="text-text-muted">Repair management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-electric-cyan rounded-full"></span>
                    <code className="bg-surface-secondary/80 glass-panel px-2 py-1 rounded text-electric-cyan text-xs">
                      /TESTING_REPAIR.md
                    </code>
                    <span className="text-text-muted">Test scenarios</span>
                  </li>
                </ul>
              </div>
            </div>
          </TiltCard>
        </section>
      </main>
    </div>
  );
}
