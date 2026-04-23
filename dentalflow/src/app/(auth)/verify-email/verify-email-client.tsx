"use client";

import { signOutAction } from "@/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type Props = { initialEmail: string };

export function VerifyEmailClient({ initialEmail }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onResend(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    const addr = email.trim();
    if (!addr) {
      setErr("Enter the email you used to sign up.");
      return;
    }
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: addr,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSending(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg("If that address is registered, we sent a new confirmation link.");
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold">Confirm your email</h1>
        <p className="mt-1 text-sm text-slate-500">
          We need a confirmed email before you can use the practice or patient area. Check your inbox for a
          link from Supabase, or resend the confirmation below.
        </p>
        <form onSubmit={onResend} className="mt-6 space-y-4" noValidate>
          {err ? (
            <p className="text-sm text-red-600" role="alert">
              {err}
            </p>
          ) : null}
          {msg ? (
            <p className="text-sm text-green-700 dark:text-green-400" role="status">
              {msg}
            </p>
          ) : null}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="verify-email"
          />
          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? "Sending…" : "Resend confirmation email"}
          </Button>
        </form>
        <form className="mt-3" action={signOutAction}>
          <Button type="submit" variant="secondary" className="w-full">
            Use a different account
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          <a href="/login" className="text-slate-800 underline dark:text-slate-200">
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}
