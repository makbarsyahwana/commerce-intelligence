'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const ERROR_ICON = (
  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const TROUBLESHOOTING_STEPS = [
  'Check your database connection',
  'Verify environment variables',
  'Contact your administrator'
] as const;

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-lg mx-auto text-center px-4">
        <ErrorIcon />
        <ErrorMessage />
        <ActionButtons reset={reset} />
        <TroubleshootingInfo />
        {process.env.NODE_ENV === 'development' && (
          <ErrorDetails error={error} />
        )}
      </div>
    </div>
  );
}

function ErrorIcon() {
  return (
    <div className="mb-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {ERROR_ICON}
      </div>
    </div>
  );
}

function ErrorMessage() {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
      <p className="text-gray-600 mb-6">
        We encountered an error while loading your dashboard. Please try again or contact support if the problem persists.
      </p>
    </div>
  );
}

function ActionButtons({ reset }: { reset: () => void }) {
  return (
    <div className="space-y-4">
      <button
        onClick={reset}
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

function TroubleshootingInfo() {
  return (
    <div className="text-sm text-gray-500">
      <p className="mb-2">If this error continues, you can:</p>
      <ul className="text-left space-y-1">
        {TROUBLESHOOTING_STEPS.map((step, index) => (
          <li key={index}>• {step}</li>
        ))}
      </ul>
    </div>
  );
}

function ErrorDetails({ error }: { error: Error & { digest?: string } }) {
  return (
    <details className="mt-6 text-left">
      <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
        Error Details (Development Only)
      </summary>
      <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto">
        <div className="mb-2">
          <strong>Error:</strong> {error.message}
        </div>
        <div className="mb-2">
          <strong>Stack:</strong>
        </div>
        <pre className="whitespace-pre-wrap">{error.stack}</pre>
        {error.digest && (
          <div className="mt-2">
            <strong>Digest:</strong> {error.digest}
          </div>
        )}
      </div>
    </details>
  );
}
