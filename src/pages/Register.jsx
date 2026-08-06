import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, Phone, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/LanguageContext";
import { toast } from "@/components/ui/use-toast";

export default function Register() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("male");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t("Passwords do not match"));
      return;
    }
    // Only Gmail addresses are allowed — temp/disposable emails are blocked.
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith("@gmail.com")) {
      setError(t("Only Gmail addresses are allowed. Please use a @gmail.com email or sign up with Google."));
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || t("Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
        const uid = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const promoCode = 'GB' + uid;
        // Assign a unique anime avatar based on the chosen gender.
        let avatar_url = "";
        try {
          const r = await base44.functions.invoke("assignAvatar", { gender });
          avatar_url = r?.data?.image_url || "";
        } catch { /* avatar assignment is optional */ }
        try { await base44.auth.updateMe({ uid, phone, gender, avatar_url, promo_code: promoCode }); } catch { /* profile fields optional */ }
      }
      // Show the promo-code welcome banner before entering the home page.
      window.location.href = "/promo-welcome";
    } catch (err) {
      setError(err.message || t("Invalid verification code"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: t("Code sent"),
        description: t("Check your email for the new code."),
      });
    } catch (err) {
      setError(err.message || t("Failed to resend code"));
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/promo-welcome");
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title={t("Verify your email")}
        subtitle={`${t("Check your email for the new code.")}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-9 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              {t("Verifying...")}
            </>
          ) : (
            t("Verify")
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {t("Didn't receive the code?")}{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            {t("Resend")}
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title={t("Create your account")}
      subtitle={t("Sign up to get started")}
      footer={
        <>
          {t("Already have an account?")}{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t("Log in")}
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-9 text-sm font-medium mb-4"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-4 h-4 mr-1.5" />
        {t("Continue with Google")}
      </Button>

      <div className="mb-4">
        <LanguageSwitcher variant="auth" />
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">{t("or")}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("Email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-9"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t("Phone Number")}</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+1 555 000 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("Gender")}</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGender("male")}
              className={`flex items-center justify-center gap-1.5 h-9 rounded-md border text-sm font-medium transition-colors ${gender === "male" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-accent"}`}
            >
              <UserIcon className="w-4 h-4" /> {t("Male")}
            </button>
            <button
              type="button"
              onClick={() => setGender("female")}
              className={`flex items-center justify-center gap-1.5 h-9 rounded-md border text-sm font-medium transition-colors ${gender === "female" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-accent"}`}
            >
              <UserIcon className="w-4 h-4" /> {t("Female")}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("Password")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-9 pr-9"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showPassword ? t("Hide password") : t("Show password")}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t("Confirm Password")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-9 pr-9"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showConfirm ? t("Hide password") : t("Show password")}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full h-9 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              {t("Creating account...")}
            </>
          ) : (
            t("Create account")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}