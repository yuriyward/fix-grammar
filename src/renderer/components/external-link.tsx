/**
 * External link button using shell API
 */
import type { ComponentProps } from 'react';
import { openExternalLink } from '@/actions/shell';
import { cn } from '@/renderer/lib/tailwind';

type ExternalLinkProps = Omit<ComponentProps<'button'>, 'onClick'> & {
  href?: string;
};

export default function ExternalLink({
  children,
  className,
  href,
  ...props
}: ExternalLinkProps) {
  function open() {
    if (!href) {
      return;
    }

    openExternalLink(href);
  }

  return (
    <button
      type="button"
      className={cn(
        'cursor-pointer underline bg-transparent border-none p-0 text-inherit font-inherit',
        className,
      )}
      {...props}
      onClick={open}
    >
      {children}
    </button>
  );
}
