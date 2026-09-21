import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface CopyOnHoverProps {
  value: string;
  children: React.ReactNode;
  label?: string;
}

// Wraps a cell value with a hover-reveal copy icon. Click copies the
// raw value to the clipboard and flashes a check for ~1.5s.
//
// Uses a named Tailwind group (group/copy) so this component's hover
// state never bleeds into parent groups — important on rows where the
// whole tr already has a hover:bg-gray-50 style.
export function CopyOnHover({ value, children, label }: CopyOnHoverProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      // Fallback for sandboxed contexts / older browsers where the
      // async Clipboard API is unavailable. execCommand("copy") is
      // deprecated but universally supported.
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      toast.success(`${label ?? "Value"} copied`);
      setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <span className="group/copy inline-flex items-center gap-1.5 max-w-full align-middle">
      <span className="min-w-0">{children}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="opacity-0 group-hover/copy:opacity-100 focus-visible:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400 shrink-0"
        aria-label={`Copy ${label ?? "value"}`}
        title={`Copy ${label ?? "value"}`}
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-600" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
    </span>
  );
}
