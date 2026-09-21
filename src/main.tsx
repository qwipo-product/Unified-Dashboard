import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import App from "./App.tsx";
import "./index.css";

// next-themes flips a `dark` class on <html>, which drives Tailwind v4's
// @custom-variant dark and every token's dark override in @qwipo/tokens.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="qwipo.theme"
      disableTransitionOnChange
    >
      <App />
      <Toaster position="top-right" />
    </ThemeProvider>
  </StrictMode>,
);
