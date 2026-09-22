'use client';

import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load ward risk data',
  message = 'A temporary network or service error occurred while retrieving real-time thermal intelligence.',
  onRetry,
  className = ''
}) => {
  return (
    <div className={`p-6 rounded-2xl bg-red-50/90 border border-red-200 text-center space-y-3 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-700 mx-auto">
        <AlertOctagon className="w-5 h-5" />
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-sm text-red-900">{title}</h3>
        <p className="text-xs text-red-700 max-w-md mx-auto leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Data Load</span>
        </button>
      )}
    </div>
  );
};
