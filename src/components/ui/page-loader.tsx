import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { useLocation } from "react-router";
import { cn } from "./utils";

/**
 * Slim top-of-viewport progress bar that animates briefly on every
 * route change. Pure visual affordance — the SPA loads code
 * synchronously so navigation is instant; this gives the user the
 * "something happened" feedback they expect from any modern web app.
 *
 * Mount once near the root (RootLayout) so it triggers for every
 * authenticated page transition.
 */
export function RouteProgress() {
  const location = useLocation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    // 320ms is just long enough for the eye to register without making
    // navigation feel sluggish.
    const t = setTimeout(() => setActive(false), 320);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="route-progress"
          className="fixed top-0 left-0 right-0 h-0.5 bg-blue-600 origin-left z-[100] shadow-[0_0_8px_rgba(37,99,235,0.5)]"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.85 }}
          exit={{ scaleX: 1, opacity: 0 }}
          transition={{
            scaleX: { duration: 0.28, ease: "easeOut" },
            opacity: { duration: 0.18 },
          }}
        />
      )}
    </AnimatePresence>
  );
}

interface PageLoaderProps {
  /** What's loading? Defaults to "Loading…". */
  label?: string;
  /**
   * Render inline (fills the parent container) or as a full-screen
   * overlay. Default `"inline"`.
   */
  variant?: "inline" | "overlay";
  className?: string;
}

/**
 * Full-screen / full-card spinner. Use inside a page when an
 * asynchronous data fetch is genuinely outstanding (e.g., when a
 * future build wires real APIs in). For instant in-memory data the
 * RouteProgress bar above is enough.
 */
export function PageLoader({
  label = "Loading…",
  variant = "inline",
  className,
}: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-gray-500",
        variant === "overlay"
          ? "fixed inset-0 z-[90] bg-white/70 backdrop-blur-sm"
          : "min-h-[240px] w-full py-12",
        className,
      )}
    >
      <Loader2 className="h-7 w-7 text-blue-600 animate-spin" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
