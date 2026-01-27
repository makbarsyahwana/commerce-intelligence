'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/atoms/Button';

interface SyncNowButtonProps {
  disabled?: boolean;
  className?: string;
}

type SyncNowApiSuccess = {
  success: true;
  message?: string;
  timestamp?: string;
};

type SyncNowApiError = {
  success?: false;
  error?: string;
  message?: string;
  timestamp?: string;
};

type SyncNowApiResponse = SyncNowApiSuccess | SyncNowApiError;

function getErrorMessage(response: Response, payload: SyncNowApiResponse | null): string {
  if (payload && 'message' in payload && payload.message) return payload.message;
  if (payload && 'error' in payload && payload.error) return payload.error;
  if (response.status === 401) return 'Admin access required';
  return response.statusText || 'Request failed';
}

export default function SyncNowButton({ disabled = false, className = '' }: SyncNowButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/sync-now', { method: 'POST' });
      const payload = (await response.json().catch(() => null)) as SyncNowApiResponse | null;

      if (!response.ok) {
        setError(getErrorMessage(response, payload));
        return;
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const isDisabled = disabled || isLoading;
  const label = isLoading ? 'Starting sync...' : disabled ? 'Sync in Progress...' : 'Sync Now';

  return (
    <div className={className}>
      <Button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        loading={isLoading}
        variant="primary"
      >
        {label}
      </Button>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
