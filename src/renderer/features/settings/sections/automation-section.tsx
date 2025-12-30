/**
 * Automation settings section
 * Calibration and delay configuration UI
 */
import type { RefObject } from 'react';
import { Button } from '@/renderer/components/ui/button';
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from '@/renderer/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/renderer/components/ui/field';
import { Input } from '@/renderer/components/ui/input';
import { Spinner } from '@/renderer/components/ui/spinner';
import { Textarea } from '@/renderer/components/ui/textarea';
import type { AutomationCalibrationResult } from '@/shared/types/automation';

export interface AutomationSectionProps {
  // From useSettingsState
  clipboardSyncDelayMs: number;
  selectionDelayMs: number;
  isSaving: boolean;
  onClipboardSyncDelayChange: (ms: number) => void;
  onSelectionDelayChange: (ms: number) => void;

  // From useCalibration
  isCalibrating: boolean;
  calibration: AutomationCalibrationResult | null;
  calibrationText: string;
  calibrationStatus: string;
  calibrationFieldRef: RefObject<HTMLTextAreaElement | null>;
  onCalibrationTextChange: (text: string) => void;
  onCalibrate: () => Promise<void>;
}

/**
 * Automation section component for calibration and delay settings.
 * Receives all state and handlers via props.
 */
export function AutomationSection({
  clipboardSyncDelayMs,
  selectionDelayMs,
  isSaving,
  onClipboardSyncDelayChange,
  onSelectionDelayChange,
  isCalibrating,
  calibration,
  calibrationText,
  calibrationStatus,
  calibrationFieldRef,
  onCalibrationTextChange,
  onCalibrate,
}: AutomationSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Automation</h2>

      {/* Calibration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Calibration</CardTitle>
          <CardDescription>
            Recommended: click Calibrate to measure timing on your machine and
            auto-save safe values.
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              onClick={onCalibrate}
              disabled={isSaving || isCalibrating}
            >
              {isCalibrating ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="size-4" />
                  Calibrating…
                </span>
              ) : (
                'Calibrate'
              )}
            </Button>
          </CardAction>
        </CardHeader>
        <CardPanel className="space-y-3">
          <Field>
            <FieldLabel>Calibration Text</FieldLabel>
            <Textarea
              id="calibrationText"
              ref={calibrationFieldRef}
              value={calibrationText}
              onChange={(e) => onCalibrationTextChange(e.target.value)}
            />
          </Field>
          {calibration?.success && (
            <p className="text-sm text-muted-foreground">
              Measured clipboard update: p95{' '}
              {calibration.measuredClipboardMs.p95Ms}ms (max{' '}
              {calibration.measuredClipboardMs.maxMs}ms,{' '}
              {calibration.measuredClipboardMs.samplesMs.length} runs)
            </p>
          )}
        </CardPanel>
        {/* Accessibility: aria-live region for calibration status */}
        {calibrationStatus && (
          <output aria-live="polite" aria-atomic="true" className="sr-only">
            {calibrationStatus}
          </output>
        )}
      </Card>

      {/* Clipboard Sync Delay */}
      <Field name="automation.clipboardSyncDelayMs">
        <FieldLabel>Clipboard Sync Delay (ms)</FieldLabel>
        <FieldDescription>
          Maximum time to wait after copy; usually returns sooner once the
          clipboard updates.
        </FieldDescription>
        <Input
          type="number"
          min={0}
          max={5000}
          step={25}
          value={clipboardSyncDelayMs}
          onChange={(e) => {
            const next = e.target.valueAsNumber;
            onClipboardSyncDelayChange(Number.isFinite(next) ? next : 0);
          }}
        />
        <FieldError />
      </Field>

      {/* Selection Delay */}
      <Field name="automation.selectionDelayMs">
        <FieldLabel>Selection Delay (ms)</FieldLabel>
        <FieldDescription>
          Fixed delay after keyboard simulation.
        </FieldDescription>
        <Input
          type="number"
          min={0}
          max={5000}
          step={25}
          value={selectionDelayMs}
          onChange={(e) => {
            const next = e.target.valueAsNumber;
            onSelectionDelayChange(Number.isFinite(next) ? next : 0);
          }}
        />
        <FieldError />
      </Field>
    </div>
  );
}
