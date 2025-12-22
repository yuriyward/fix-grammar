/**
 * Error Boundary Component tests
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '@/renderer/components/error-boundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Component that throws with custom message
const ThrowCustomError = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('normal rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child content</div>
        </ErrorBoundary>,
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child1">First</div>
          <div data-testid="child2">Second</div>
        </ErrorBoundary>,
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should catch errors and display fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should display error message in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowCustomError message="Custom error message" />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('should display "Try reloading the page or go home" message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText('Try reloading the page or go home.'),
      ).toBeInTheDocument();
    });

    it('should show Technical Details section', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Technical Details')).toBeInTheDocument();
    });

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('action buttons', () => {
    it('should render Reload Page button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(
        screen.getByRole('button', { name: /reload page/i }),
      ).toBeInTheDocument();
    });

    it('should render Go Home button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(
        screen.getByRole('button', { name: /go home/i }),
      ).toBeInTheDocument();
    });

    it('should render Copy Error button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(
        screen.getByRole('button', { name: /copy error/i }),
      ).toBeInTheDocument();
    });

    it('should call window.location.reload when Reload Page is clicked', () => {
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock, href: '/' },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      fireEvent.click(screen.getByRole('button', { name: /reload page/i }));

      expect(reloadMock).toHaveBeenCalled();
    });

    it('should navigate to home when Go Home is clicked', () => {
      const locationMock = { reload: vi.fn(), href: '/some-page' };
      Object.defineProperty(window, 'location', {
        value: locationMock,
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      fireEvent.click(screen.getByRole('button', { name: /go home/i }));

      expect(locationMock.href).toBe('/');
    });

    it('should copy error to clipboard when Copy Error is clicked', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      fireEvent.click(screen.getByRole('button', { name: /copy error/i }));

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalled();
      });
    });

    it('should show "Copied!" after successful copy', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      fireEvent.click(screen.getByRole('button', { name: /copy error/i }));

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });
  });

  describe('custom fallback', () => {
    it('should render custom fallback when provided', () => {
      render(
        <ErrorBoundary
          fallback={<div data-testid="custom-fallback">Custom fallback</div>}
        >
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    });

    it('should not render default fallback when custom is provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(
        screen.queryByText('Something went wrong'),
      ).not.toBeInTheDocument();
    });
  });

  describe('error details', () => {
    it('should display error message in details', () => {
      render(
        <ErrorBoundary>
          <ThrowCustomError message="Detailed error message" />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Detailed error message')).toBeInTheDocument();
    });

    it('should have expandable Technical Details section', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      const details = screen.getByText('Technical Details').closest('details');
      expect(details).toBeInTheDocument();
    });
  });
});
