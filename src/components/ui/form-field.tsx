import { type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "./label";
import { cn } from "./utils";

interface FormFieldProps {
  /** Field label rendered above the input. */
  label?: ReactNode;
  /** Mark the label with a red asterisk. Default `false`. */
  required?: boolean;
  /**
   * Inline error text. When set, the label text picks up the red tint
   * and the error message renders directly under the input.
   */
  error?: string;
  /**
   * Helper text shown beneath the input when there's no error.
   * Suppressed automatically when `error` is set.
   */
  helper?: ReactNode;
  /** ID of the underlying input — used for label htmlFor and aria-describedby. */
  htmlFor?: string;
  /** The input / select / textarea element. Must accept aria-invalid. */
  children: ReactNode;
  className?: string;
}

/**
 * Standard "label + input + error message" wrapper used everywhere the
 * admin or seller fills out a form. Renders the inline error directly
 * underneath the input so the user doesn't have to scan toasts for
 * field-level validation feedback.
 *
 *   <FormField label="Full Name" required error={errors.fullName}>
 *     <Input
 *       value={fullName}
 *       onChange={(e) => setFullName(e.target.value)}
 *       aria-invalid={!!errors.fullName}
 *     />
 *   </FormField>
 */
export function FormField({
  label,
  required = false,
  error,
  helper,
  htmlFor,
  children,
  className,
}: FormFieldProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label
          htmlFor={htmlFor}
          className={cn(
            "text-sm font-medium",
            error ? "text-red-700" : "text-gray-700",
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}
      {children}
      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-1 text-xs text-red-600"
          role="alert"
        >
          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helper ? (
        <p className="text-xs text-gray-500">{helper}</p>
      ) : null}
    </div>
  );
}
