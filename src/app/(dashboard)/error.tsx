'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Dashboard error:', error); }, [error]);
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-muted-foreground">Failed to load this page.</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
