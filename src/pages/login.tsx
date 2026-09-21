import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { ArrowLeft, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth, DEMO_OTP } from "@/lib/auth-context";

import logo from "@qwipo/tokens/assets/Qwipo_Secondary_Logo_for_Light_BG@4x-8.png";
import logoDark from "@qwipo/tokens/assets/Qwipo_Secondary_Logo_for_Dark_BG.svg";

type Step = "phone" | "otp";

export function Login() {
  const { user, requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const phoneValid = /^[6-9]\d{9}$/.test(phone);

  const sendOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!phoneValid) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await requestOtp(phone);
      setStep("otp");
      setOtp("");
      setResendIn(30);
      toast.success(`OTP sent to +91 ${phone}`);
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (code: string) => {
    setError(null);
    setBusy(true);
    try {
      await verifyOtp(phone, code);
      toast.success("Signed in");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setOtp("");
    } finally {
      setBusy(false);
    }
  };

  const logoSrc = mounted && resolvedTheme === "dark" ? logoDark : logo;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      {/* Soft brand wash behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 0%, color-mix(in srgb, var(--primary) 10%, transparent), transparent 70%)",
        }}
      />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <img src={logoSrc} alt="Qwipo" className="h-9" />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">Command center</h1>
            <p className="mt-1 text-sm text-gray-600">
              One dashboard for the entire Qwipo network
            </p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            {step === "phone" ? (
              <form onSubmit={sendOtp} className="space-y-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Smartphone className="h-4 w-4" />
                  </span>
                  Sign in with mobile
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile number</Label>
                  <div className="flex">
                    <span className="flex h-9 items-center rounded-l-md border border-r-0 border-input bg-gray-50 px-3 text-sm text-gray-600">
                      +91
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="98480 12345"
                      className="rounded-l-none"
                      value={phone}
                      maxLength={10}
                      aria-invalid={!!error}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                        setError(null);
                      }}
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={busy || !phoneValid}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send OTP
                </Button>
                <p className="text-center text-xs text-gray-500">
                  Access is limited to authorized Qwipo management accounts
                </p>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  Verify OTP
                </div>
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-medium text-gray-900">+91 {phone}</span>
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(v) => {
                      setOtp(v);
                      setError(null);
                      if (v.length === 6) void submitOtp(v);
                    }}
                    disabled={busy}
                    autoFocus
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {error && <p className="text-center text-xs text-red-600">{error}</p>}
                <Button
                  className="w-full"
                  disabled={busy || otp.length !== 6}
                  onClick={() => void submitOtp(otp)}
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify and sign in
                </Button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    onClick={() => {
                      setStep("phone");
                      setError(null);
                    }}
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Change number
                  </button>
                  <button
                    type="button"
                    disabled={resendIn > 0 || busy}
                    className="font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                    onClick={() => void sendOtp()}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
                  </button>
                </div>
                <p className="rounded-md bg-gray-50 px-3 py-2 text-center text-[11px] text-gray-500">
                  Demo build — the OTP is {DEMO_OTP}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[11px] text-gray-400">
          Qwipo · ONDC seller network + Qwipo 2.0 · Internal use only
        </p>
      </div>
    </div>
  );
}
