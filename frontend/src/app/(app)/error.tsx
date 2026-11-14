'use client';

import { AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Card>
      <EmptyState
        icon={AlertOctagon}
        title="Something went wrong"
        description={error.message || 'An unexpected error occurred while loading this page.'}
        action={<Button onClick={reset}>Try again</Button>}
      />
    </Card>
  );
}
