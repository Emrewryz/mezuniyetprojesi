'use client';

import { Component, ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; message: string; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-4">
          <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">Bir şeyler ters gitti.</p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm leading-relaxed">{this.state.message || 'Beklenmedik bir hata oluştu.'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={14} /> Tekrar Dene
            </button>
            <Link href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}