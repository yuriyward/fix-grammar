/**
 * Hotkeys settings section
 * Global shortcuts configuration UI
 */
import { Field, FieldError, FieldLabel } from '@/renderer/components/ui/field';
import { Input } from '@/renderer/components/ui/input';

export interface HotkeysSectionProps {
  fixSelection: string;
  togglePopup: string;
  onFixSelectionChange: (value: string) => void;
  onTogglePopupChange: (value: string) => void;
}

interface HotkeyFieldConfig {
  id: 'fixSelection' | 'togglePopup';
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
}

/**
 * Hotkeys section component for configuring global shortcuts.
 * Receives hotkey values and change handlers via props.
 */
export function HotkeysSection({
  fixSelection,
  togglePopup,
  onFixSelectionChange,
  onTogglePopupChange,
}: HotkeysSectionProps) {
  const hotkeyFields: HotkeyFieldConfig[] = [
    {
      id: 'fixSelection',
      label: 'Fix Selection',
      value: fixSelection,
      setValue: onFixSelectionChange,
      placeholder: 'CommandOrControl+Shift+F',
    },
    {
      id: 'togglePopup',
      label: 'Toggle Popup',
      value: togglePopup,
      setValue: onTogglePopupChange,
      placeholder: 'CommandOrControl+Shift+P',
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Global Shortcuts</h2>
      {hotkeyFields.map((field) => (
        <Field key={field.id} name={`hotkeys.${field.id}`}>
          <FieldLabel>{field.label}</FieldLabel>
          <Input
            value={field.value}
            onChange={(e) => field.setValue(e.target.value)}
            placeholder={field.placeholder}
          />
          <FieldError />
        </Field>
      ))}
    </div>
  );
}
