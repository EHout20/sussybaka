"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [magicLoading, setMagicLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function onOAuth(provider: "google" | "apple") {
    setErr(null);
    setMsg(null);
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    setOauthLoading(null);
    if (error) {
      setErr(error.message);
    }
  }

  async function onMagicLink() {
    setErr(null);
    setMsg(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErr("Enter your email first, then request a magic link.");
      return;
    }

    setMagicLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
      },
    });
    setMagicLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }
    setMsg("Magic link sent by Supabase. Check your email.");
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.2),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.15),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.16),transparent_35%)]" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white/95 p-8 shadow-2xl shadow-sky-950/40 backdrop-blur dark:bg-slate-900/95">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-400">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">DentalFlow</h1>
        <p className="mt-1 text-sm text-slate-500">Authentication is fully managed by Supabase</p>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={() => onOAuth("google")}
            disabled={oauthLoading !== null || magicLoading}
            aria-label="Continue with Google"
          >
            <GoogleIcon />
            {oauthLoading === "google" ? "Connecting to Google..." : "Continue with Google"}
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            onClick={() => onOAuth("apple")}
            disabled={oauthLoading !== null || magicLoading}
            aria-label="Continue with Apple"
          >
            <AppleIcon />
            {oauthLoading === "apple" ? "Connecting to Apple..." : "Continue with Apple"}
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs uppercase tracking-wide text-slate-400">or passwordless email</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onMagicLink();
          }}
          className="mt-2 space-y-4"
          noValidate
        >
          {err ? (
            <p className="text-sm text-red-600" role="alert">
              {err}
            </p>
          ) : null}
          {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="email"
          />
          <Button
            type="submit"
            className="w-full"
            variant="outline"
            disabled={magicLoading || oauthLoading !== null}
          >
            {magicLoading ? "Sending magic link..." : "Email me a magic link"}
          </Button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          Your password is not stored by this app. Authentication credentials are handled by Supabase Auth.
        </p>
        <p className="mt-6 text-xs text-amber-800 dark:text-amber-200">
          Demo only: all data is synthetic. Production use requires BAAs, legal review, secure hosting, backups,
          and consent workflows. See README and ARCHITECTURE.md.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 3.4 14.6 2.5 12 2.5 6.9 2.5 2.8 6.7 2.8 12S6.9 21.5 12 21.5c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.9-.1-1.3H12z"
      />
      <path fill="#34A853" d="M3.8 7.5l3.2 2.4C7.7 8 9.7 6.6 12 6.6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 3.4 14.6 2.5 12 2.5 8.3 2.5 5.1 4.5 3.8 7.5z" />
      <path fill="#FBBC05" d="M12 21.5c2.5 0 4.6-.8 6.2-2.3l-2.9-2.2c-.8.6-1.8 1-3.3 1-3.9 0-5.1-2.6-5.4-3.8l-3.3 2.5c1.4 2.9 4.5 4.8 8.7 4.8z" />
      <path fill="#4285F4" d="M21.2 14.2c.1-.4.1-.8.1-1.2 0-.4 0-.9-.1-1.3H12v3.9h5.4c-.3 1.1-1 2-2.1 2.7l2.9 2.2c1.7-1.5 3-3.8 3-6.3z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.72 12.58c.01 2.87 2.5 3.82 2.53 3.83-.02.07-.39 1.35-1.28 2.67-.77 1.14-1.57 2.28-2.83 2.31-1.24.03-1.64-.74-3.06-.74-1.43 0-1.88.72-3.04.76-1.22.05-2.14-1.22-2.92-2.35-1.59-2.3-2.8-6.49-1.17-9.32.81-1.41 2.26-2.3 3.83-2.33 1.2-.02 2.33.81 3.06.81.73 0 2.11-1 3.55-.85.6.03 2.28.24 3.36 1.82-.09.05-2.01 1.17-2.03 3.39zM14.83 5.02c.64-.78 1.07-1.86.96-2.94-.92.04-2.04.62-2.7 1.39-.6.69-1.12 1.79-.98 2.84 1.03.08 2.08-.52 2.72-1.29z" />
    </svg>
  );
}
