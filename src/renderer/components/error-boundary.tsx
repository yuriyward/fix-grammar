/**
 * React error boundary with recovery UI
 */
import { AlertTriangle, ClipboardCopy, Home, RefreshCw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/renderer/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, copied: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = async () => {
    const errorText = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-screen items-center justify-center bg-background p-6">
            <div className="w-full max-w-2xl space-y-8">
              {/* Icon and Title */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-destructive/10 p-4">
                  <AlertTriangle className="size-12 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Something went wrong
                  </h1>
                  <p className="text-muted-foreground max-w-md">
                    Try reloading the page or go home.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button onClick={this.handleReload} size="lg">
                  <RefreshCw className="size-4" />
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" size="lg">
                  <Home className="size-4" />
                  Go Home
                </Button>
                <Button
                  onClick={this.handleCopyError}
                  variant="outline"
                  size="lg"
                >
                  <ClipboardCopy className="size-4" />
                  {this.state.copied ? 'Copied!' : 'Copy Error'}
                </Button>
              </div>

              {/* Error Details */}
              <details className="rounded-lg border bg-card p-4 text-sm text-card-foreground">
                <summary className="cursor-pointer font-semibold text-foreground hover:text-foreground/80 transition-colors">
                  Technical Details
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="font-medium text-destructive mb-1">
                      Error Message:
                    </p>
                    <code className="block rounded bg-muted p-3 text-xs overflow-x-auto">
                      {this.state.error?.message}
                    </code>
                  </div>
                  {this.state.error?.stack && (
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">
                        Stack Trace:
                      </p>
                      <pre className="rounded bg-muted p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">
                        Component Stack:
                      </p>
                      <pre className="rounded bg-muted p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
