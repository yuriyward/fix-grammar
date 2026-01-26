/**
 * Langfuse observability settings section
 */
import { Button } from '@/renderer/components/ui/button';
import { Field, FieldLabel } from '@/renderer/components/ui/field';
import { Input } from '@/renderer/components/ui/input';
import { Switch } from '@/renderer/components/ui/switch';
import type { UseLangfuseKeysReturn } from '../hooks/use-langfuse-keys';

export interface LangfuseSectionProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  isSaving: boolean;
  keys: UseLangfuseKeysReturn;
}

export function LangfuseSection({
  enabled,
  onEnabledChange,
  isSaving,
  keys,
}: LangfuseSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Observability</h2>

      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div className="space-y-0.5">
          <div className="text-sm font-medium">Langfuse Tracing</div>
          <div className="text-xs text-muted-foreground">
            Send AI prompts and responses to Langfuse for monitoring
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={isSaving}
        />
      </div>

      <Field>
        <FieldLabel>
          Public Key{' '}
          {keys.hasKeys && (
            <span className="text-muted-foreground">(saved)</span>
          )}
        </FieldLabel>
        <Input
          type="password"
          value={keys.publicKey}
          onChange={(e) => keys.setPublicKey(e.target.value)}
          placeholder={
            keys.hasKeys ? keys.publicKeyPreview || '******' : 'pk-lf-...'
          }
          disabled={isSaving}
        />
      </Field>

      <Field>
        <FieldLabel>Secret Key</FieldLabel>
        <Input
          type="password"
          value={keys.secretKey}
          onChange={(e) => keys.setSecretKey(e.target.value)}
          placeholder={
            keys.hasKeys ? keys.secretKeyPreview || '******' : 'sk-lf-...'
          }
          disabled={isSaving}
        />
      </Field>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={keys.handleSave}
          disabled={
            isSaving || !keys.publicKey.trim() || !keys.secretKey.trim()
          }
        >
          Save Keys
        </Button>
        {keys.hasKeys && (
          <Button
            type="button"
            onClick={keys.handleDelete}
            variant="destructive"
            disabled={isSaving}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
