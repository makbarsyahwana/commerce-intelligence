import { getLatestSyncRun } from '@/lib/services/dashboardQueries';
import SyncNowButton from './SyncNowButton';

interface SyncStatusProps {
  className?: string;
}

export default async function SyncStatus({ className = '' }: SyncStatusProps) {
  const latestSyncRun = await getLatestSyncRun();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'RUNNING':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'FAILED':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatDuration = (startedAt: Date, finishedAt: Date | null) => {
    const end = finishedAt ? new Date(finishedAt) : new Date();
    const start = new Date(startedAt);
    const durationMs = end.getTime() - start.getTime();
    
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${(durationMs / 1000).toFixed(1)}s`;
    } else {
      return `${(durationMs / 60000).toFixed(1)}m`;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Sync Status</h2>
        {latestSyncRun?.status === 'RUNNING' && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Running</span>
          </div>
        )}
      </div>

      {!latestSyncRun ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p>No sync runs found</p>
          <p className="text-sm text-gray-400 mt-2">Run your first sync to see status here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(latestSyncRun.status)}`}>
                {getStatusIcon(latestSyncRun.status)}
                <span className="capitalize">{latestSyncRun.status || 'Unknown'}</span>
              </div>
              <span className="text-sm text-gray-500">
                {formatTimeAgo(latestSyncRun.startedAt)}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {formatDuration(latestSyncRun.startedAt, latestSyncRun.finishedAt)}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500">Provider</p>
              <p className="text-sm font-medium text-gray-900">
                {latestSyncRun.provider || 'All Providers'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Started</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(latestSyncRun.startedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Products</p>
              <p className="text-sm font-medium text-gray-900">
                {latestSyncRun.productsFetched?.toLocaleString() || '0'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Orders</p>
              <p className="text-sm font-medium text-gray-900">
                {latestSyncRun.ordersFetched?.toLocaleString() || '0'}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {latestSyncRun.errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Error Details</p>
                  <p className="text-sm text-red-700 mt-1">{latestSyncRun.errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Sync Button */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex gap-3 items-start">
              <SyncNowButton disabled={latestSyncRun.status === 'RUNNING'} />
              <a
                href="/api/admin/sync-status"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                View API Status
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
