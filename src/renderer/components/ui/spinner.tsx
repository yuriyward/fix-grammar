import { Loader2Icon } from 'lucide-react';
import type * as React from 'react';

import { cn } from '@/renderer/lib/tailwind';

function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof Loader2Icon>) {
  return (
    <Loader2Icon
      aria-label="Loading"
      className={cn('animate-spin', className)}
      role="status"
      {...props}
    />
  );
}

export { Spinner };
