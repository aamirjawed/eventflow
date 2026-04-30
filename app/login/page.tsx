"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/index";
import { Zap, Mail, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      setIsLocalhost(true);
    }
  }, []);

  const searchParams = useSearchParams();
  const verifyMode = searchParams.get("verify") === "1";
  const errorParam = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log(`[AUTH] Login attempt for: ${email}`);

    // ALWAYS try "credentials" login first. 
    // If the email is whitelisted, lib/auth.ts will allow it instantly.
    const res = await signIn("credentials", {
      email,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (res?.ok) {
      console.log("[AUTH] Instant login successful (Admin Bypass)");
      window.location.href = "/dashboard";
      return;
    }

    // FALLBACK: Standard Magic Link for non-whitelisted users or if credentials fail
    console.log("[AUTH] Instant login failed, falling back to Magic Link.");
    const emailRes = await signIn("email", {
      email,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (emailRes?.error) {
      setError("This email is not authorized to access the dashboard.");
    } else {
      setSent(true);
    }
  }

  if (verifyMode || sent) {
    return (
      <div className="text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
          <Mail className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-muted-foreground text-sm mt-2">
            We sent a magic link to <strong>{email || "your email"}</strong>.
            <br />
            Click it to sign in — no password needed.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Didn&apos;t receive it? Check spam or{" "}
          <button className="text-primary hover:underline" onClick={() => setSent(false)}>
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Admin Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>

      {(error || errorParam) && (
        <p className="text-sm text-destructive">
          {error || "Access denied. Your email is not on the admin list."}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        Send magic link
      </Button>

      {/* Auto Login for Dev */}
      {isLocalhost && (
        <div className="pt-4 border-t border-dashed mt-4">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full border-primary/20 text-primary hover:bg-primary/5 gap-2"
            onClick={async () => {
              setLoading(true);
              await signIn("credentials", {
                email: email, // Leave empty to let backend use ADMIN_EMAILS[0]
                callbackUrl: "/dashboard",
              });
            }}
          >
            <Zap className="h-4 w-4 fill-primary" />
            Auto Login (Dev Mode)
          </Button>
          <p className="text-[10px] text-center text-muted-foreground mt-2 italic">
            This button bypasses email verification and is only visible on localhost.
          </p>
        </div>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Admin sign in</h1>
            <p className="text-muted-foreground text-sm mt-1">
              No password required — we&apos;ll email you a link.
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Not an admin?{" "}
          <a href="/register" className="text-primary hover:underline font-medium">
            Register for the event →
          </a>
        </p>
      </div>
    </div>
  );
}
