"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

/**
 * Global toast surface for the whole app.
 *
 * Positioning + sizing decisions:
 *   - position: top-center — bottom-right was easy to miss; the top
 *     edge is where the user's eye naturally lands after submitting
 *     a form or clicking a primary CTA.
 *   - expand: stacked toasts spread out instead of collapsing, so
 *     several quick actions (validate → save → notify) all stay
 *     readable.
 *   - duration: 4500ms — long enough to read a sentence comfortably,
 *     short enough not to linger.
 *   - richColors: tints the whole toast based on type. success →
 *     green, error → red, warning → amber, info → blue. The seller
 *     can tell from across the room whether something failed.
 *   - toastOptions.classNames: bumps the base typography + padding
 *     so toasts are visibly larger than Sonner's default.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      richColors
      expand
      duration={4500}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          // Wider visual envelope — Sonner's default is 356px which
          // looks tight at the top of the viewport.
          "--width": "440px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          // Larger base toast: bigger text, more vertical padding,
          // stronger shadow so it stands off the page.
          toast:
            "text-sm font-medium py-3 px-4 shadow-lg border-2 rounded-lg",
          title: "text-sm font-semibold leading-snug",
          description: "text-xs leading-relaxed",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
