import { useRef, type ReactNode } from "react";
import { Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { cn } from "./utils";

export type ImageUploaderAspect = "square" | "16/9" | "circle";
export type ImageUploaderSize = "sm" | "md" | "lg" | "fill";

interface ImageUploaderProps {
  /** Current image URL — `null` means "no image yet". */
  value: string | null;
  /**
   * Called when the user picks a new file (`file`) or clears the image
   * (`null`). The parent owns the URL lifecycle (creating / revoking
   * blob URLs); this component just hands the file back.
   */
  onChange: (file: File | null) => void;
  /** Aspect ratio for the picker tile. Default `square`. */
  aspect?: ImageUploaderAspect;
  /**
   * Visual size of the tile:
   *   sm   — 64×64 (inline, dense lists like brand rows)
   *   md   — 96×96 (cards / list rows)
   *   lg   — 144×144 (modals, prominent slots)
   *   fill — 100% width (full-bleed card / dialog)
   * Default `md`.
   */
  size?: ImageUploaderSize;
  /** Override the empty-state primary line. */
  placeholder?: string;
  /**
   * Override the empty-state helper line. Pass `null` to suppress it
   * (auto-suppressed on `sm`). Default `PNG / JPG up to a few MB`.
   */
  helper?: string | null;
  /** Alt text for the rendered image. */
  alt?: string;
  /** Show the small "Remove" button beneath the tile. Default `true`. */
  removable?: boolean;
  /** Extra classes appended to the wrapper. */
  className?: string;
  /** Hover overlay copy when an image is present. Default "Replace image". */
  replaceLabel?: string;
}

const SIZE_CLASSES: Record<Exclude<ImageUploaderSize, "fill">, string> = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-36 h-36",
};

/**
 * Single source of truth for "click a tile to upload an image" everywhere
 * in the admin module. Consistent dashed border, consistent icon, clear
 * "Click to upload" copy, hover overlay for replacement, and a unified
 * Remove affordance.
 *
 * Used by:
 *   - Category Master cover image dialog
 *   - Add / Edit Company dialog (company logo)
 *   - Brand row (per-brand logo) — `size="sm"` for the dense layout
 *   - Per-company Categories tab (each tile)
 *   - Add Seller (business photo) — `aspect="circle"`
 */
export function ImageUploader({
  value,
  onChange,
  aspect = "square",
  size = "md",
  placeholder,
  helper,
  alt = "Image",
  removable = true,
  className,
  replaceLabel = "Replace image",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onChange(f);
    if (inputRef.current) inputRef.current.value = "";
  };

  const tileSize =
    size === "fill" ? "w-full" : SIZE_CLASSES[size];
  const aspectClass =
    aspect === "16/9"
      ? "aspect-[16/9]"
      : aspect === "circle"
        ? "aspect-square"
        : "aspect-square";
  const radius =
    aspect === "circle" ? "rounded-full" : "rounded-lg";

  // Suppress helper text on the smallest tile — there's no room.
  const showHelper = helper !== null && size !== "sm";
  const resolvedPlaceholder = placeholder ?? "Click to upload";
  const resolvedHelper =
    helper === undefined ? "PNG / JPG up to a few MB" : helper ?? "";

  return (
    <div
      className={cn(
        "flex flex-col items-start gap-1.5",
        size === "fill" ? "w-full" : "inline-flex",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handlePick}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex items-center justify-center overflow-hidden border-2 border-dashed transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          tileSize,
          aspectClass,
          radius,
          value
            ? "border-transparent"
            : "border-gray-300 hover:border-blue-400 bg-gray-50 text-gray-500 hover:text-blue-600",
        )}
        title={value ? "Click to change image" : "Click to upload image"}
      >
        {value ? (
          <>
            <img
              src={value}
              alt={alt}
              className={cn("w-full h-full object-cover", radius)}
            />
            <span
              className={cn(
                "absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white",
                radius,
              )}
            >
              <Upload
                className={cn(
                  size === "sm" ? "h-4 w-4" : "h-5 w-5",
                )}
              />
              {size !== "sm" && (
                <span className="text-xs font-medium">{replaceLabel}</span>
              )}
            </span>
          </>
        ) : (
          <EmptyState
            size={size}
            primary={resolvedPlaceholder}
            secondary={showHelper ? resolvedHelper : ""}
          />
        )}
      </button>
      {removable && value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
          Remove
        </button>
      )}
    </div>
  );
}

function EmptyState({
  size,
  primary,
  secondary,
}: {
  size: ImageUploaderSize;
  primary: string;
  secondary: string;
}) {
  // For the smallest tile we just show an icon — no labels (the row's
  // own context already tells the admin what they're uploading).
  if (size === "sm") {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <ImageIcon className="h-5 w-5 text-gray-300" />
        <Upload className="h-3 w-3" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1.5 px-2 text-center">
      <ImageIcon
        className={cn(
          size === "fill" ? "h-10 w-10" : "h-7 w-7",
          "text-gray-300",
        )}
      />
      <span className="text-xs font-medium leading-none">{primary}</span>
      {secondary && (
        <span className="text-[11px] text-gray-400 leading-tight">
          {secondary}
        </span>
      )}
    </div>
  );
}

/**
 * Convenience helper: turn an `ImageUploader.onChange` payload into an
 * imperative blob URL update and call back the parent's setter. Most
 * callers want this exact pattern (revoke previous → create new → store)
 * so we ship it here to avoid copy/paste.
 */
export function makeImageUploadHandler(
  current: string | null,
  setUrl: (next: string | null) => void,
  revoke: (url: string | null) => void,
): (file: File | null) => void {
  return (file) => {
    revoke(current);
    if (!file) {
      setUrl(null);
      return;
    }
    setUrl(URL.createObjectURL(file));
  };
}
