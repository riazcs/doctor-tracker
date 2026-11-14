import { FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="The page you are looking for doesn't exist or has been moved."
        action={
          <Link href="/dashboard" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-fg">
            Back to dashboard
          </Link>
        }
      />
    </div>
  );
}
