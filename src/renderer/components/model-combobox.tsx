/**
 * Generic model selection combobox with custom item support
 * Unifies the model selection UI across all AI providers
 */

import { Combobox as BaseUiCombobox } from '@base-ui/react/combobox';
import { useCallback, useMemo } from 'react';
import {
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from '@/renderer/components/ui/combobox';

/**
 * Base model item interface - all providers must satisfy this
 */
export interface ModelItem {
  id: string;
  name: string;
}

/**
 * Group structure for organized model display
 */
export interface ModelGroup<T extends ModelItem = ModelItem> {
  value: string;
  items: T[];
}

/**
 * Props for the ModelCombobox component
 */
export interface ModelComboboxProps<T extends ModelItem> {
  /** Current model ID value */
  value: string;
  /** Callback when model changes */
  onChange: (modelId: string) => void;
  /** Grouped models to display */
  groups: ModelGroup<T>[];
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether to allow custom model IDs not in the list */
  allowCustom?: boolean;
  /** Custom function to render item label (defaults to item.name) */
  itemToString?: (item: T) => string;
  /** Whether the combobox is disabled */
  disabled?: boolean;
}

/**
 * Generic model selection combobox that handles:
 * - Grouped model display
 * - Custom item creation when allowCustom is true
 * - Unified filter logic (search by id and name)
 * - Proper handling of input changes vs selection changes
 */
export function ModelCombobox<T extends ModelItem>({
  value,
  onChange,
  groups,
  placeholder = 'Select or type a model',
  allowCustom = true,
  itemToString,
  disabled = false,
}: ModelComboboxProps<T>) {
  const { contains } = BaseUiCombobox.useFilter();

  // Derive flat items from groups
  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const normalizedValue = value.trim();

  // Custom item logic - creates a custom item when the value doesn't match any existing item
  const customItem = useMemo(() => {
    if (!allowCustom || normalizedValue.length === 0) return null;
    if (flatItems.some((item) => item.id === normalizedValue)) return null;
    // Create a minimal custom item that satisfies the ModelItem interface
    return { id: normalizedValue, name: normalizedValue } as T;
  }, [allowCustom, normalizedValue, flatItems]);

  // Build groups with custom item prepended if needed
  const displayGroups = useMemo(() => {
    if (!customItem) return groups;
    return [{ value: 'Custom', items: [customItem] }, ...groups];
  }, [customItem, groups]);

  // Find selected item from existing items or use custom item
  const selectedItem = useMemo(
    () =>
      flatItems.find((item) => item.id === normalizedValue) ??
      customItem ??
      null,
    [flatItems, normalizedValue, customItem],
  );

  // Get display label for an item
  const getItemLabel = useCallback(
    (item: T) => (itemToString ? itemToString(item) : item.name),
    [itemToString],
  );

  // Input value shows the selected item's label or the raw value for custom entries
  const inputValue = selectedItem
    ? getItemLabel(selectedItem)
    : normalizedValue;

  // Unified filter function - searches both id and name
  const filterFn = useCallback(
    (item: T, query: string) => {
      const trimmed = query.trim();
      if (trimmed.length === 0) return true;
      return contains(item.id, trimmed) || contains(item.name, trimmed);
    },
    [contains],
  );

  // Handle input value changes (typing)
  const handleInputValueChange = useCallback(
    (inputVal: string, details: { reason: string }) => {
      if (
        details.reason === 'input-change' ||
        details.reason === 'input-clear'
      ) {
        onChange(inputVal.trim());
      }
    },
    [onChange],
  );

  // Handle selection changes (clicking an item)
  const handleValueChange = useCallback(
    (selected: T | null) => {
      onChange(selected?.id ?? '');
    },
    [onChange],
  );

  return (
    <Combobox
      value={selectedItem}
      inputValue={inputValue}
      onInputValueChange={handleInputValueChange}
      onValueChange={handleValueChange}
      items={displayGroups}
      filter={filterFn}
      isItemEqualToValue={(a: T, b: T) => a.id === b.id}
      itemToStringLabel={getItemLabel}
      itemToStringValue={(item: T) => item.id}
      disabled={disabled}
    >
      <ComboboxInput placeholder={placeholder} showTrigger />
      <ComboboxPopup>
        <ComboboxEmpty>No models found.</ComboboxEmpty>
        <ComboboxList>
          {(group: ModelGroup<T>) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxGroupLabel>{group.value}</ComboboxGroupLabel>
              <ComboboxCollection>
                {(item: T) => (
                  <ComboboxItem key={item.id} value={item}>
                    {getItemLabel(item)}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}
