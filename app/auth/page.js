
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "../../lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (!error && data.session) {
        router.replace("/");
        return;
      }

      setChecking(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        if (data.session) {
          router.replace("/");
          return;
        }

        setMessage("Account created. Check your email to verify it.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          router.replace("/");
          return;
        }

        setMessage("Please verify your email and try again.");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-white">
        <p className="font-semibold text-violet-700">Loading VYBE...</p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-violet-50 to-pink-100 px-4 py-10 text-slate-900">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-pink-300/30 blur-3xl" />

      <section className="relative w-full max-w-md rounded-3xl border border-white bg-white/90 p-6 shadow-2xl shadow-violet-200/60 backdrop-blur sm:p-9">
        <a
          href="/auth"
          className="inline-block bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-4xl font-black tracking-tight text-transparent"
        >
          VYBE
        </a>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
          Discover · Attend · Create
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight">
          {mode === "login" ? "Welcome back" : "Join VYBE"}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {mode === "login"
            ? "Sign in to discover events and manage your experiences."
            : "Create your account to discover and organize events."}
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-semibold">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              className="mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-3.5 font-bold text-white shadow-lg shadow-pink-200 transition hover:brightness-105 disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Log In →"
                : "Create Account →"}
          </button>
        </form>

        {message && (
          <p className="mt-4 break-words rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 break-words rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === "login"
            ? "Don't have an account?"
            : "Already registered?"}{" "}
          <button
            type="button"
            className="font-bold text-violet-700 hover:text-pink-600"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage("");
              setError("");
            }}
          >
            {mode === "login" ? "Sign Up" : "Log In"}
          </button>
        </p>

        <p className="mt-6 text-center text-xs text-slate-400">
          Your events. Your people. Your VYBE.
        </p>
      </section>
    </main>
  );
}
