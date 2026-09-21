import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Mobile + OTP auth for the management dashboard. Demo implementation:
 * any Indian mobile number gets an OTP, and the OTP is verified locally
 * (123456). Swap `requestOtp` / `verifyOtp` with the real auth API —
 * the context shape is what pages depend on.
 */

export interface AuthUser {
  name: string;
  phone: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True while restoring the session from storage on first mount. */
  loading: boolean;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "qwipo.udash.auth";
export const DEMO_OTP = "123456";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      // Corrupt/blocked storage — treat as signed out.
    }
    setLoading(false);
  }, []);

  const requestOtp = useCallback(async (phone: string) => {
    // Real impl: POST /auth/otp { phone }
    await new Promise((r) => setTimeout(r, 600));
    void phone;
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    await new Promise((r) => setTimeout(r, 500));
    if (otp !== DEMO_OTP) {
      throw new Error("Incorrect OTP. Use 123456 in this demo build.");
    }
    const authed: AuthUser = {
      name: "Management User",
      phone,
      role: "Leadership",
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authed));
    } catch {
      // Storage unavailable — session lives for this tab only.
    }
    setUser(authed);
    return authed;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, requestOtp, verifyOtp, logout }),
    [user, loading, requestOtp, verifyOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
