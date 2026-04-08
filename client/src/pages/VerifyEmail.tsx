import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Get email from sessionStorage (set during register/login)
  const email = sessionStorage.getItem("verify_email") ?? "";

  useEffect(() => {
    if (!email) {
      setLocation("/");
    }
  }, [email, setLocation]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      toast.success("Email verified! Welcome to GO-GETTER OS.");
      sessionStorage.removeItem("verify_email");
      window.location.href = "/";
    },
    onError: (err) => {
      toast.error(err.message);
      setCode("");
    },
  });

  const resendMutation = trpc.auth.resendCode.useMutation({
    onSuccess: () => {
      toast.success("A new verification code has been sent.");
      setCooldown(60);
      setCode("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleVerify = () => {
    if (code.length !== 6) return;
    verifyMutation.mutate({ email, code });
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    resendMutation.mutate({ email });
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Mail className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Verify Your Email
          </h1>
          <p className="text-slate-400 text-sm">
            We sent a 6-digit code to{" "}
            <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 backdrop-blur-sm">
          <div className="flex justify-center mb-6">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(val) => setCode(val)}
              onComplete={handleVerify}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="h-14 w-12 text-xl border-slate-700 text-white" />
                <InputOTPSlot index={1} className="h-14 w-12 text-xl border-slate-700 text-white" />
                <InputOTPSlot index={2} className="h-14 w-12 text-xl border-slate-700 text-white" />
              </InputOTPGroup>
              <InputOTPSeparator className="text-slate-600" />
              <InputOTPGroup>
                <InputOTPSlot index={3} className="h-14 w-12 text-xl border-slate-700 text-white" />
                <InputOTPSlot index={4} className="h-14 w-12 text-xl border-slate-700 text-white" />
                <InputOTPSlot index={5} className="h-14 w-12 text-xl border-slate-700 text-white" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || verifyMutation.isPending}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-11"
          >
            {verifyMutation.isPending ? "Verifying..." : "Verify Email"}
          </Button>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || resendMutation.isPending}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>

            <button
              onClick={() => {
                sessionStorage.removeItem("verify_email");
                setLocation("/");
              }}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Code expires in 10 minutes. Check your spam folder if you don't see it.
        </p>
      </div>
    </div>
  );
}
