/**
 * Dashboard page route component
 */
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/renderer/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/renderer/components/ui/card';

function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col p-6">
      <h1 className="mb-6 text-3xl font-bold">Grammar Copilot</h1>

      <div className="flex-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>App Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Ready to rewrite</p>
            <p className="mt-2 text-sm">
              Use keyboard shortcuts to fix text anywhere on your system.
            </p>
          </CardContent>
        </Card>

        <Button
          onClick={() => navigate({ to: '/settings' })}
          className="w-full"
        >
          Open Settings
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: DashboardPage,
});
