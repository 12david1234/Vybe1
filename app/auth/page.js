
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (!error && data.session) {
        window.location.replace("/");
        return;
      }

      setCheckingSession(false);
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

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
          window.location.replace("/");
          return;
        }

        setMessage(
          "Account created. Check your email for the verification link."
        );
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          window.location.replace("/");
          return;
        }

        setMessage("Login successful. Please try opening the homepage.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main style={styles.page}>
        <p>Checking login...</p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <a href="/" style={styles.logo}>VYBE</a>

        <h1 style={styles.heading}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>

        <p style={styles.subtitle}>
          {mode === "login"
            ? "Log in with your email and password."
            : "Sign up with your email to get started."}
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email" style={styles.label}>Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <label htmlFor="password" style={styles.label}>Password</label>
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
            style={styles.input}
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Log In"
                : "Create Account"}
          </button>
        </form>

        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}

        <p style={styles.switchText}>
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            style={styles.switchButton}
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage("");
              setError("");
            }}
          >
            {mode === "login" ? "Sign Up" : "Log In"}
          </button>
        </p>

        <a href="/" style={styles.homeLink}>Back to VYBE</a>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    boxSizing: "border-box",
    background: "#080b16",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 28,
    boxSizing: "border-box",
    borderRadius: 20,
    background: "#111827",
    border: "1px solid #273449",
  },
  logo: {
    color: "#a78bfa",
    fontSize: 32,
    fontWeight: "bold",
    textDecoration: "none",
  },
  heading: { fontSize: 27, marginBottom: 8 },
  subtitle: { color: "#aab4c8", lineHeight: 1.5, marginBottom: 24 },
  label: { display: "block", marginBottom: 8, fontSize: 14 },
  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: 14,
    marginBottom: 18,
    borderRadius: 10,
    border: "1px solid #374151",
    background: "#0b1220",
    color: "#fff",
    fontSize: 16,
  },
  button: {
    width: "100%",
    padding: 14,
    border: "none",
    borderRadius: 10,
    background: "#7c3aed",
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    cursor: "pointer",
  },
  success: { color: "#4ade80", overflowWrap: "anywhere", lineHeight: 1.5 },
  error: { color: "#f87171", overflowWrap: "anywhere", lineHeight: 1.5 },
  switchText: { color: "#aab4c8", textAlign: "center", marginTop: 24 },
  switchButton: {
    color: "#c4b5fd",
    background: "none",
    border: "none",
    fontSize: 14,
    fontWeight: "bold",
    cursor: "pointer",
  },
  homeLink: {
    display: "block",
    marginTop: 18,
    textAlign: "center",
    color: "#aab4c8",
    textDecoration: "none",
    fontSize: 14,
  },
};

