/**
 * Form validation helper utilities
 */
import type { ZodError } from 'zod';

/**
 * Extract field-level errors from a Zod validation error
 * Returns a flat object mapping field paths to error messages (first error only per field)
 */
export function extractFieldErrors(zodError: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of zodError.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message; // First error only
    }
  }
  return errors;
}

/**
 * Focus the first invalid field in the form
 * Uses requestAnimationFrame to ensure React has rendered the error state
 */
export function focusFirstInvalidField(errors: Record<string, string>): void {
  if (Object.keys(errors).length === 0) return;

  // Run after React renders the errors
  requestAnimationFrame(() => {
    const form = document.getElementById('settings-form');
    if (!(form instanceof HTMLElement)) return;

    const firstFieldError = form.querySelector('[data-slot="field-error"]');
    const field = firstFieldError?.closest('[data-slot="field"]');

    const focusTarget =
      field?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      field?.querySelector<HTMLElement>(
        'input, textarea, button, [tabindex]:not([tabindex="-1"])',
      ) ??
      form.querySelector<HTMLElement>('[aria-invalid="true"]');

    focusTarget?.focus();
  });
}
