# Combobox Guide (Internal)

This project uses coss.ui wrappers around Base UI. For comboboxes, prefer
`src/renderer/components/ui/combobox.tsx` and follow the patterns below to avoid
selection and label mismatches.

## Recommended Patterns

### Use object values (not IDs) for `<ComboboxItem value={...}>`

Base UI Combobox is designed to work well when the item value is the full object:

- Good: `<ComboboxItem value={item}>…</ComboboxItem>`
- Bad: `<ComboboxItem value={item.id}>…</ComboboxItem>` while the root is controlled with an object value

If you store an ID (e.g. in settings), keep the combobox value as the object and
map back to an ID in `onValueChange`.

### Always define label/value conversion for object items

When using object values, provide:

- `itemToStringLabel`: what the input should display for the selected item
- `itemToStringValue`: what should be written to the hidden `<input>` for forms

If your item shape is `{ value, label }`, Base UI can infer these; otherwise,
provide them explicitly.

### Always define equality for object items

If `items` can be re-created (new object references), add `isItemEqualToValue`
so selection doesn’t break:

```tsx
isItemEqualToValue={(item, selected) => item.id === selected.id}
```

### Control `inputValue` carefully when you store IDs

If you store an ID string but want the input to show a human label:

1. Compute `selectedItem` from `items` using the stored ID
2. Set `inputValue` to `selectedItem?.name ?? rawString`
3. In `onInputValueChange`, update the stored string only for actual typing/clearing,
   and ignore selection events

Base UI’s docs show this pattern for async search and object values
(`https://base-ui.com/react/components/combobox.md`).

Example (sync, single):

```tsx
const selectedItem = items.find((x) => x.id === valueId) ?? null;
const inputValue = selectedItem ? selectedItem.name : valueId;

<Combobox
  value={selectedItem}
  inputValue={inputValue}
  itemToStringLabel={(item) => item.name}
  itemToStringValue={(item) => item.id}
  isItemEqualToValue={(item, selected) => item.id === selected.id}
  onValueChange={(next) => next && onChangeId(next.id)}
  onInputValueChange={(next, { reason }) => {
    if (reason === 'item-press') return;
    if (reason === 'input-change' || reason === 'input-clear') onChangeId(next);
  }}
>
  …
</Combobox>
```

## Filtering

Prefer Base UI’s locale-aware filter helpers:

```tsx
import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';
const { contains } = ComboboxPrimitive.useFilter();
```

Then implement multi-field filtering (ID + label) without manual `toLowerCase()`:

```tsx
filter={(item, query) => {
  const trimmed = query.trim();
  if (trimmed.length === 0) return true;
  return contains(item.id, trimmed) || contains(item.name, trimmed);
}}
```

It’s acceptable to import Base UI primitives directly for hooks not re-exported
by our coss.ui wrappers. This matches coss.ui particle patterns (see
`docs/cossui-particles-28.12.25.txt`, Autocomplete examples).

## Grouped Items

Base UI supports grouped items as:

```ts
type Group<T> = { value: string; items: T[] };
```

Render groups with `ComboboxList` + `ComboboxGroup` + `ComboboxCollection` (see
`src/renderer/features/settings/sections/ai-provider-section.tsx`).

## Multiple Selection (Chips)

Enable multiple selection with the `multiple` prop. Use `ComboboxChips` to render
selected items as removable chips:

```tsx
<Combobox multiple items={users} onValueChange={setSelectedUsers}>
  <ComboboxChips>
    <ComboboxValue>
      {(value: User[]) => (
        <>
          {value.map((user) => (
            <ComboboxChip key={user.id} aria-label={user.name}>
              {user.name}
              <ComboboxChipRemove aria-label="Remove" />
            </ComboboxChip>
          ))}
          <ComboboxInput placeholder={value.length > 0 ? '' : 'e.g. Michael'} />
        </>
      )}
    </ComboboxValue>
  </ComboboxChips>
  <ComboboxPopup>
    <ComboboxList>
      {(user) => (
        <ComboboxItem value={user}>
          {user.name}
          <ComboboxItemIndicator />
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxPopup>
</Combobox>
```

Key points:
- Chips render inside `ComboboxValue` render prop
- Input is placed after chips for proper tab order
- Each chip needs a unique `key` and descriptive `aria-label`

See `p-combobox-12.tsx` in coss.ui particles for form integration.

## Async Search

For large datasets or remote searching, disable client-side filtering and manage
results asynchronously:

```tsx
const [searchResults, setSearchResults] = useState<User[]>([]);
const [isPending, startTransition] = useTransition();
const { contains } = ComboboxPrimitive.useFilter();

// Debounce and fetch
useEffect(() => {
  const controller = new AbortController();
  
  if (query === '') {
    setSearchResults([]);
    return;
  }

  const timeoutId = setTimeout(async () => {
    startTransition(async () => {
      const results = await searchUsers(query, contains);
      if (!controller.signal.aborted) {
        setSearchResults(results);
      }
    });
  }, 300); // 300ms debounce

  return () => {
    clearTimeout(timeoutId);
    controller.abort();
  };
}, [query]);

<Combobox
  filter={null}  // Disable client-side filtering
  items={searchResults}
  onInputValueChange={(next, { reason }) => {
    if (reason !== 'item-press') setQuery(next);
  }}
>
  <ComboboxPopup aria-busy={isPending || undefined}>
    <ComboboxStatus>
      {isPending ? 'Searching...' : `${searchResults.length} results`}
    </ComboboxStatus>
    {/* ... */}
  </ComboboxPopup>
</Combobox>
```

Essential practices:
- Set `filter={null}` to skip client-side filtering
- Debounce input (300ms recommended) to reduce API calls
- Use `AbortController` to cancel outdated requests
- Use React 18's `useTransition` for non-blocking updates
- Show loading state with `aria-busy` and `ComboboxStatus`

For multiple selection with async, merge `searchResults` with `selectedValues`
to keep selected items visible even when filtered out. See Base UI's official
async multiple example for the full pattern.

## Status and Empty Messages

Use `ComboboxStatus` for loading states, errors, or search hints, and
`ComboboxEmpty` for no-results feedback:

```tsx
<ComboboxPopup aria-busy={isLoading || undefined}>
  <ComboboxStatus>
    {isLoading ? (
      <>
        <Spinner />
        Searching...
      </>
    ) : error ? (
      <span className="text-destructive">{error}</span>
    ) : query === '' ? (
      'Start typing to search people...'
    ) : (
      `${results.length} result${results.length === 1 ? '' : 's'} found`
    )}
  </ComboboxStatus>
  
  <ComboboxEmpty>
    {query ? `No matches for "${query}". Try a different search term.` : null}
  </ComboboxEmpty>
  
  <ComboboxList>{/* ... */}</ComboboxList>
</ComboboxPopup>
```

`ComboboxStatus` shows unconditionally; `ComboboxEmpty` only when the list is empty.
Both auto-hide if their children are `null` or empty strings.

## Accessibility

Base UI handles most ARIA attributes automatically (roles, expanded state, active
descendant, etc.). Ensure:

- **Labels**: Provide `aria-label` on `ComboboxInput` if no visible label exists
- **Loading**: Set `aria-busy` on `ComboboxPopup` during async operations
- **Keyboard**: Arrow keys, Enter, Escape, and Tab work out of the box
- **Focus management**: Focus stays on input; `aria-activedescendant` tracks highlighted item
- **Screen readers**: Test with VoiceOver (macOS) or NVDA (Windows)

The component follows WAI-ARIA 1.2 combobox pattern with strong assistive
technology support.

## Common Pitfalls

- Mixed value types (`Combobox value={object}` but `ComboboxItem value={string}`) breaks selection.
- Missing `isItemEqualToValue` causes “selected item not shown” when items are re-created.
- `onInputValueChange` reasons are a union; don’t compare against non-existent reasons (TypeScript will warn).
