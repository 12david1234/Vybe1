
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
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!active) return;

        if (error) throw error;

        if (data.session) {
          router.replace("/");
          return;
        }
      } catch (err) {
        if (active) setError(err.message || "Unable to check login.");
      }

      if (active) setChecking(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) router.replace("/");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

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

        setMessage(
          "Account created. Please check your email to verify your account."
        );
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

        setMessage("Please verify your email and try signing in again.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="loading-page">
        <div className="logo">Party <span>Event</span></div>
        <p>Checking your account...</p>
        <style jsx>{`
          .loading-page {
            min-height: 100dvh;
            display: grid;
            align-content: center;
            justify-items: center;
            background: #f5f1ff;
            color: #51466f;
            font-family: Arial, sans-serif;
          }
          .logo {
            font-size: 34px;
            font-weight: 900;
            color: #7436ed;
          }
          .logo span {
            color: #f02c91;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-layout">
        <div className="intro">
          <button className="brand" onClick={() => router.push("/")}>
            Party <span>Event</span>
          </button>

          <div className="intro-copy">
            <span className="eyebrow">DISCOVER · ATTEND · CREATE</span>
            <h1>
              Discover
              <br />
              Events
              <br />
              <span>Near You</span>
            </h1>
            <p>
              Find parties, concerts, workshops and more. Create events, sell
              tickets or offer free RSVPs — all in one place.
            </p>

            <div className="feature">
              <b>✦</b>
              <div>
                <strong>Explore Events</strong>
                <small>Find events around the world</small>
              </div>
            </div>
            <div className="feature">
              <b>＋</b>
              <div>
                <strong>Create Events</strong>
                <small>Share your event with the community</small>
              </div>
            </div>
            <div className="feature">
              <b>◇</b>
              <div>
                <strong>Free RSVP or Tickets</strong>
                <small>Bring your audience together</small>
              </div>
            </div>
          </div>

          <div className="intro-footer">
            Your events. Your people. Your Party Event.
          </div>
        </div>

        <div className="card-wrap">
          <section className="auth-card">
            <div className="card-brand">
              Party <span>Event</span>
            </div>

            <h2>{mode === "login" ? "Welcome Back!" : "Create Account"}</h2>
            <p className="subtitle">
              {mode === "login"
                ? "Sign in to discover and organize events"
                : "Join Party Event and discover amazing events"}
            </p>

            <div className="mode-switch">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setError("");
                  setMessage("");
                }}
              >
                Email Login
              </button>
              <button
                type="button"
                className={mode === "signup" ? "active" : ""}
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setMessage("");
                }}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="At least 6 characters"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button className="submit" type="submit" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign In →"
                    : "Create Account →"}
              </button>
            </form>

            {message && <p className="notice">{message}</p>}
            {error && <p className="error" role="alert">{error}</p>}

            <p className="switch-copy">
              {mode === "login"
                ? "Don't have an account?"
                : "Already registered?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError("");
                  setMessage("");
                }}
              >
                {mode === "login" ? "Create Account" : "Sign In"}
              </button>
            </p>

            <button className="back-home" onClick={() => router.push("/")}>
              ← Back to Party Event
            </button>
          </section>
        </div>
      </section>

      <style jsx>{`
        .auth-page {
          min-height: 100dvh;
          display: grid;
          place-items: center;
          padding: 24px;
          box-sizing: border-box;
          color: #17152b;
          background: linear-gradient(125deg, #f5f0ff, #fff7fc 55%, #f0edff);
          font-family: Arial, Helvetica, sans-serif;
        }
        .auth-layout {
          width: 100%;
          max-width: 1050px;
          min-height: 650px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
          border: 1px solid white;
          border-radius: 26px;
          background: #ffffff80;
          box-shadow: 0 24px 80px #57379424;
        }
        .intro {
          display: flex;
          flex-direction: column;
          padding: 34px;
          background: linear-gradient(145deg, #eee6ff, #fff1fa 75%, #f6f2ff);
        }
        .brand {
          width: fit-content;
          padding: 0;
          border: 0;
          background: transparent;
          color: #7436ed;
          font-size: 29px;
          font-weight: 900;
          cursor: pointer;
        }
        .brand span,
        .card-brand span {
          color: #f02c91;
        }
        .intro-copy {
          margin: auto 0;
        }
        .eyebrow {
          color: #7436ed;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }
        h1 {
          margin: 18px 0;
          font-size: clamp(43px, 5vw, 65px);
          line-height: 0.99;
          font-weight: 900;
          letter-spacing: -3px;
        }
        h1 span {
          color: #a04adf;
        }
        .intro-copy > p {
          max-width: 370px;
          color: #625d78;
          font-size: 14px;
          line-height: 1.8;
        }
        .feature {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 20px;
        }
        .feature b {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 12px;
          color: white;
          font-size: 22px;
          background: linear-gradient(135deg, #7436ed, #f02c91);
        }
        .feature strong,
        .feature small {
          display: block;
        }
        .feature strong {
          font-size: 13px;
        }
        .feature small {
          margin-top: 4px;
          color: #716a85;
          font-size: 11px;
        }
        .intro-footer {
          color: #756a91;
          font-size: 12px;
          font-weight: 700;
        }
        .card-wrap {
          display: grid;
          place-items: center;
          padding: 28px;
        }
        .auth-card {
          width: 100%;
          max-width: 390px;
          box-sizing: border-box;
          padding: 32px;
          border: 1px solid #f0eaf9;
          border-radius: 23px;
          background: white;
          box-shadow: 0 16px 50px #4c307c13;
        }
        .card-brand {
          text-align: center;
          color: #7436ed;
          font-size: 29px;
          font-weight: 900;
        }
        h2 {
          margin: 14px 0 0;
          text-align: center;
          font-size: 24px;
          font-weight: 900;
        }
        .subtitle {
          margin: 8px 0 22px;
          color: #777187;
          text-align: center;
          font-size: 12px;
          line-height: 1.6;
        }
        .mode-switch {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px;
          padding: 4px;
          margin-bottom: 20px;
          border-radius: 13px;
          background: #f5f2fc;
        }
        .mode-switch button {
          padding: 10px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #777187;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .mode-switch button.active {
          color: white;
          background: linear-gradient(100deg, #7436ed, #f02c91);
        }
        label {
          display: block;
          margin: 15px 0 7px;
          font-size: 12px;
          font-weight: 800;
        }
        input {
          width: 100%;
          box-sizing: border-box;
          padding: 13px 12px;
          border: 1px solid #e8e4f0;
          border-radius: 11px;
          outline: none;
          background: white;
          color: #17152b;
          font-size: 13px;
        }
        input:focus {
          border-color: #9864f0;
          box-shadow: 0 0 0 3px #7436ed13;
        }
        .submit {
          width: 100%;
          margin-top: 22px;
          padding: 14px;
          border: 0;
          border-radius: 11px;
          color: white;
          background: linear-gradient(100deg, #7436ed, #f02c91);
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }
        .submit:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .notice,
        .error {
          margin-top: 12px;
          padding: 11px;
          border-radius: 10px;
          font-size: 11px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }
        .notice {
          color: #087443;
          background: #eafaf1;
        }
        .error {
          color: #b42345;
          background: #fff0f3;
        }
        .switch-copy {
          margin: 22px 0 0;
          color: #777187;
          text-align: center;
          font-size: 11px;
        }
        .switch-copy button {
          padding: 0;
          border: 0;
          background: transparent;
          color: #7436ed;
          font-weight: 800;
          cursor: pointer;
        }
        .back-home {
          display: block;
          margin: 20px auto 0;
          border: 0;
          background: transparent;
          color: #716a85;
          font-size: 11px;
          cursor: pointer;
        }
        @media (max-width: 700px) {
          .auth-page {
            padding: 14px;
            align-items: start;
          }
          .auth-layout {
            max-width: 440px;
            min-height: auto;
            margin: auto;
            grid-template-columns: 1fr;
            border-radius: 22px;
          }
          .intro {
            padding: 20px 22px 12px;
            background: transparent;
          }
          .intro-copy,
          .intro-footer {
            display: none;
          }
          .card-wrap {
            padding: 0 12px 16px;
          }
          .auth-card {
            max-width: none;
            padding: 25px 21px;
          }
        }
        @media (max-width: 360px) {
          .auth-page {
            padding: 10px;
          }
          .card-wrap {
            padding: 0 7px 10px;
          }
          .auth-card {
            padding: 22px 16px;
          }
        }
      `}</style>
    </main>
  );
}
