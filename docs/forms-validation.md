# Forms and validation

This project uses Base UI form primitives (`@base-ui/react/form` + `@base-ui/react/field`) for layout,
accessibility, error rendering, and submission behavior. Zod is used for validating values.

This document describes the recommended pattern for building new forms with validation and inline errors
in the renderer process.

## Principles

- Keep form state in the renderer (controlled inputs) and validate from that state.
- Use the same Zod schema in renderer and IPC when possible (put shared schemas in `src/shared/`).
- Render errors via Base UI’s `Form` `errors` prop + `FieldError` inside `Field`.
- Avoid “silent invalid” fields: any Base UI control (including `@base-ui/react/input`, which is a
  `Field.Control`) must be inside a `Field.Root`.

## Process boundaries (important)

- Renderer code must not import `src/ipc/**`.
- Shared validation that needs to run in both renderer and IPC should live under `src/shared/schemas/**`.
- IPC-only request schemas stay in `src/ipc/**` (e.g., “test connection” inputs).

## Recommended approach (renderer)

1. Define/consume a Zod schema for the form values.
2. Keep form values in component state (or a local reducer).
3. On submit:
   - Build a `candidate` object from state
   - `schema.safeParse(candidate)`
   - if invalid: map Zod issues to `Record<string, string>` keyed by field path, pass it to `<Form errors={...}>`
   - if valid: submit parsed data to IPC, show a success toast

### Mapping Zod errors to Base UI `Form.errors`

Base UI expects `errors` to be an object where keys match the `name` on `<Field.Root>`, and values are
`string | string[]`.

In this repo we typically use “first error only”:

- `src/renderer/lib/validation.ts` → `extractFieldErrors()`
- Keys are dotted paths (e.g. `ai.lmstudioBaseURL`, `hotkeys.fixSelection`)

## Base UI structure

### Minimal validated field

For inputs:

```tsx
<Field name="profile.email">
  <FieldLabel>Email</FieldLabel>
  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
  <FieldError />
</Field>
```

### Select and Autocomplete need `name` on the root

Base UI clears external errors on change by calling `clearErrors(name)`. For `Select` and `Autocomplete`,
make sure the component root has the same `name` as the wrapping `Field`:

```tsx
<Field name="ai.provider">
  <FieldLabel>Provider</FieldLabel>
  <Select name="ai.provider" value={provider} onValueChange={setProvider}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>{/* ... */}</SelectContent>
  </Select>
  <FieldError />
</Field>
```

```tsx
<Field name="ai.model">
  <FieldLabel>Model</FieldLabel>
  <Autocomplete name="ai.model" value={model} onValueChange={setModel}>
    <AutocompleteInput showTrigger />
    <AutocompletePopup>{/* ... */}</AutocompletePopup>
  </Autocomplete>
  <FieldError />
</Field>
```

### Never place `Field.Control` outside a `Field`

Many components in `src/renderer/components/ui/` are implemented as Base UI `Field.Control` under the hood
(e.g. `Input`, `Textarea`, Base UI combobox input). If you use them without a wrapping `<Field>`, Base UI
can still register them as fields, but they won’t have a `FieldError` to render and can end up “invalid”
with no message (and steal focus on submit).

If a control is not part of validation, still wrap it in `<Field>` (without a `name`) so it participates
correctly in the Field state model.

## When to validate: `validationMode`

This project generally prefers `validationMode="onSubmit"` for settings-style forms:

- errors appear only after the first submit
- when using `Form.errors` (external errors), Base UI will clear a field’s external error when the user changes
  that field (for inputs automatically; for selects/comboboxes only if `name` is set on the root)

Use `onBlur` or `onChange` only when you need immediate feedback.

## External errors and invalid styling

`Form.errors` controls what `FieldError` renders, but it does not automatically set `aria-invalid` or make the
field “invalid” for styling/focus purposes. If you want a field to be styled as invalid (and to be discoverable
by selectors like `[aria-invalid="true"]`), set `invalid` on the corresponding `<Field>` when an external error
exists:

```tsx
const errors = /* Record<string, string | string[]> */;

<Field name="profile.email" invalid={Boolean(errors['profile.email'])}>
  <FieldLabel>Email</FieldLabel>
  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
  <FieldError />
</Field>
```

## Conditional fields and hidden inputs

If a field is only shown for a specific provider/mode, the schema should only validate it in that case.
Do conditional validation inside `.superRefine(...)` and gate it on the controlling value (e.g. provider).

Avoid validating “hidden” state: it leads to submit failures with no visible error/focus target.

## Submit button placement

To trigger form submit from outside the form (e.g. in a header), use the native HTML association:

```tsx
<Button form="my-form" type="submit">Save</Button>
<Form id="my-form" onSubmit={handleSubmit}>{/* ... */}</Form>
```

## “Other” buttons inside a form

Any button inside a `<form>` should be explicitly `type="button"` unless it’s meant to submit.
Our `Button` component defaults to `type="button"`, but be careful when using other button components or
native `<button>` elements.

## When to use `react-hook-form`

Prefer Base UI + local state unless you have a real need for:

- large dynamic forms (arrays of fields, nested structures, many conditional sections)
- fine-grained field meta (`dirty`, `touched`, `watch`) across many fields
- performance constraints due to frequent rerenders

If you do adopt an external form library, use Base UI only for rendering and set `FieldError match={true}`
to control visibility yourself.

## Alternative: let Base UI build values

If you don't need controlled inputs, you can use Base UI’s `onFormSubmit` to receive a `Record<string, unknown>`
of form values (keyed by field `name`) and then validate it with Zod.
