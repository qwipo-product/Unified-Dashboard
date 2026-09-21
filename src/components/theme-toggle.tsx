import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";

/**
 * Light / dark mode toggle for the top navigation bar.
 *
 * Sits right before the user-profile dropdown so it's the last
 * action the seller's eye lands on before their identity. One
 * click flips the theme — Sun icon shows in dark mode (i.e. "tap to
 * go light"), Moon shows in light mode (tap to go dark). The
 * persisted preference is keyed under qwipo.theme via next-themes.
 *
 * The mount-guard (`mounted` state) is the standard next-themes
 * pattern to avoid SSR/hydration mismatch — until React has
 * hydrated, we render a placeholder with the same dimensions so
 * the layout doesn't shift.
 */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Effective theme — fall back to resolvedTheme so the icon is
  // correct on first paint after hydration even if `theme` is
  // "system".
  const current = theme ?? resolvedTheme ?? "light";
  const isDark = current === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  if (!mounted) {
    // Placeholder while next-themes is hydrating to avoid layout
    // shift. Same width as the live button.
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        aria-hidden
        tabIndex={-1}
      >
        <Sun className="h-[1.1rem] w-[1.1rem] opacity-0" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="h-9 w-9 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-[1.1rem] w-[1.1rem]" />
      ) : (
        <Moon className="h-[1.1rem] w-[1.1rem]" />
      )}
    </Button>
  );
}
