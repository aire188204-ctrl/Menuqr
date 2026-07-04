'use client';

import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[v0] Error caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
          <div className="w-full max-w-md space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-neon-red/10 rounded-lg border border-neon-red/30">
                <AlertTriangle className="w-12 h-12 text-neon-red" />
              </div>
            </div>

            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold text-white">
                Something went wrong
              </h1>
              <p className="text-muted-foreground">
                The application encountered an unexpected error. Please try
                refreshing the page.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-4 bg-dark-charcoal border border-dark-charcoal rounded text-left">
                  <p className="text-xs text-neon-red font-mono break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-electric-cyan text-black rounded-lg font-semibold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 px-4 py-2 border border-dark-charcoal text-white rounded-lg font-semibold hover:bg-dark-charcoal/50 transition-all"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
