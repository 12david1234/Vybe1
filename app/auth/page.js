
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
    setError("");
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });

        if (error) throw error;

        if (data.session) {
          router.replace("/");
          return;
        }

        setMessage("Account created. Please check your email to verify it.");
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
      setError(err.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="auth-loading">
        <span className="auth-logo">VYBE</span>
        <p>Loading your experience...</p>
        <style jsx>{`
          .auth-loading {
            min-height: 100dvh;
            display: grid;
            place-content: center;
            justify-items: center;
            background: #f5f1ff;
            color: #51466f;
            font-family: Arial, sans-serif;
          }
          .auth-logo {
            font-size: 42px;
            font-weight: 900;
            letter-spacing: -2px;
            background: linear-gradient(110deg, #7436ed, #f02c91);
            color: transparent;
            background-clip: text;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <section className="auth-layout">
        <div className="auth-intro">
          <button
            className="brand"
            type="button"
            onClick={() => router.push("/")}
          >
            VYBE<span>.</span>
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

            <div className="intro-feature">
              <span className="feature-icon">▣</span>
              <div>
                <strong>Explore Events</strong>
                <small>Find amazing events around the world</small>
              </div>
            </div>

            <div className="intro-feature">
              <span className="feature-icon">＋</span>
              <div>
                <strong>Create Events</strong>
                <small>Share your event with the community</small>
              </div>
            </div>

            <div className="intro-feature">
              <span className="feature-icon">◇</span>
              <div>
                <strong>Free RSVP or Tickets</strong>
                <small>Bring your audience together</small>
              </div>
            </div>
          </div>

          <div className="intro-footer">
            Your events. Your people. Your VYBE.
          </div>
        </div>

        <div className="auth-card-wrap">
          <section className="auth-card">
            <div className="card-brand">VYBE<span>.</span></div>

            <h2>{mode === "login" ? "Welcome Back!" : "Join VYBE"}</h2>
            <p className="card-subtitle">
              {mode === "login"
                ? "Sign in to your account to continue"
                : "Create an account to discover and organize events"}
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
                ✉ Email
              </button>
              <button
                type="button"
                onClick={() =>
                  setMessage(
                    "Phone login is not configured yet. Please use email."
                  )
                }
              >
                ☎ Phone
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="auth-email">Email address</label>
              <div className="input-wrap">
                <span>✉</span>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <label htmlFor="auth-password">Password</label>
              <div className="input-wrap">
                <span>♙</span>
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  placeholder="Enter your password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {mode === "login" && (
                <div className="remember-row">
                  <span>Secure sign in</span>
                  <button
                    type="button"
                    onClick={() =>
                      setMessage(
                        "For password recovery, use your Supabase configured recovery flow."
                      )
                    }
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button className="submit-button" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign In →"
                    : "Create Account →"}
              </button>
            </form>

            {message && <p className="notice">{message}</p>}
            {error && <p className="error" role="alert">{error}</p>}

            <div className="or-divider"><span>OR</span></div>

            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                setMessage(
                  "Google sign in needs to be enabled in your Supabase authentication settings."
                )
              }
            >
              <span className="google-mark">G</span>
              Continue with Google
            </button>

            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                setMessage(
                  "Apple sign in needs to be enabled in your Supabase authentication settings."
                )
              }
            >
              <span className="apple-mark">●</span>
              Continue with Apple
            </button>

            <p className="switch-copy">
              {mode === "login"
                ? "Don't have an account?"
                : "Already registered?"}
              {" "}
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
          </section>
        </div>
      </section>

      <style jsx>{`
        .auth-page {
          position: relative;
          min-height: 100dvh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
          color: #17152b;
          background: linear-gradient(125deg, #f5f0ff, #fff7fc 55%, #f0edff);
          font-family: Arial, Helvetica, sans-serif;
        }
        .auth-glow {
          position: absolute;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          filter: blur(95px);
          pointer-events: none;
        }
        .auth-glow-one {
          top: -140px;
          left: -100px;
          background: #cbb6ff;
          opacity: .55;
        }
        .auth-glow-two {
          right: -120px;
          bottom: -150px;
          background: #ffb8df;
          opacity: .5;
        }
        .auth-layout {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1050px;
          min-height: 650px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
          border: 1px solid #ffffff;
          border-radius: 28px;
          background: rgba(255,255,255,.46);
          box-shadow: 0 24px 80px rgba(87,55,148,.14);
        }
        .auth-intro {
          display: flex;
          flex-direction: column;
          padding: 35px;
          background:
            radial-gradient(ellipse at 15% 90%, #e5d8ff 0, transparent 45%),
            linear-gradient(145deg, #eee6ff, #fff1fa 75%, #f6f2ff);
        }
        .brand {
          width: fit-content;
          border: 0;
          padding: 0;
          background: transparent;
          color: #7436ed;
          font-size: 34px;
          font-weight: 900;
          letter-spacing: -2px;
          cursor: pointer;
        }
        .brand span,
        .card-brand span {
          color: #f02c91;
        }
        .intro-copy {
          margin: auto 0;
          max-width: 430px;
        }
        .eyebrow {
          color: #7436ed;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }
        .intro-copy h1 {
          margin: 18px 0;
          font-size: clamp(43px, 5vw, 65px);
          line-height: .99;
          font-weight: 900;
          letter-spacing: -3px;
        }
        .intro-copy h1 span {
          background: linear-gradient(100deg, #7436ed, #f02c91);
          color: transparent;
          background-clip: text;
        }
        .intro-copy > p {
          max-width: 370px;
          color: #625d78;
          font-size: 14px;
          line-height: 1.8;
        }
        .intro-feature {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 20px;
        }
        .feature-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 12px;
          color: white;
          font-size: 23px;
          background: linear-gradient(135deg, #7436ed, #f02c91);
          box-shadow: 0 5px 14px #7436ed30;
        }
        .intro-feature strong,
        .intro-feature small {
          display: block;
        }
        .intro-feature strong {
          font-size: 13px;
        }
        .intro-feature small {
          margin-top: 4px;
          color: #716a85;
          font-size: 11px;
        }
        .intro-footer {
          color: #756a91;
          font-size: 12px;
          font-weight: 700;
        }
        .auth-card-wrap {
          display: grid;
          place-items: center;
          padding: 28px;
          background: rgba(255,255,255,.48);
        }
        .auth-card {
          width: 100%;
          max-width: 390px;
          padding: 32px;
          border: 1px solid #f0eaf9;
          border-radius: 23px;
          background: #fff;
          box-shadow: 0 16px 50px #4c307c13;
        }
        .card-brand {
          text-align: center;
          font-size: 34px;
          font-weight: 900;
          letter-spacing: -2px;
          color: #7436ed;
        }
        .auth-card h2 {
          margin: 14px 0 0;
          text-align: center;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -.6px;
        }
        .card-subtitle {
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
        }
        .mode-switch button.active {
          color: white;
          background: linear-gradient(100deg, #7436ed, #f02c91);
          box-shadow: 0 4px 12px #7436ed25;
        }
        .auth-card label {
          display: block;
          margin: 15px 0 7px;
          font-size: 12px;
          font-weight: 800;
        }
        .input-wrap {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          border: 1px solid #e8e4f0;
          border-radius: 11px;
          background: #fff;
          color: #827b94;
        }
        .input-wrap:focus-within {
          border-color: #9864f0;
          box-shadow: 0 0 0 3px #7436ed13;
        }
        .input-wrap span {
          flex-shrink: 0;
          font-size: 16px;
        }
        .input-wrap input {
          width: 100%;
          min-width: 0;
          padding: 13px 0;
          border: 0;
          outline: 0;
          color: #17152b;
          background: transparent;
          font-size: 13px;
        }
        .input-wrap input::placeholder {
          color: #aaa5b7;
        }
        .remember-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin: 14px 0;
          color: #716a85;
          font-size: 10px;
        }
        .remember-row button,
        .switch-copy button {
          border: 0;
          padding: 0;
          background: transparent;
          color: #7436ed;
          font-size: inherit;
          font-weight: 800;
        }
        .submit-button {
          width: 100%;
          margin-top: 20px;
          padding: 14px;
          border: 0;
          border-radius: 11px;
          color: white;
          background: linear-gradient(100deg, #7436ed, #f02c91);
          box-shadow: 0 6px 16px #a03ce52b;
          font-size: 13px;
          font-weight: 800;
        }
        .submit-button:disabled {
          opacity: .6;
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
        .or-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 17px 0;
          color: #9992a8;
          font-size: 10px;
        }
        .or-divider::before,
        .or-divider::after {
          content: "";
          height: 1px;
          flex: 1;
          background: #eeeaf4;
        }
        .secondary-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 9px;
          padding: 12px;
          border: 1px solid #e8e4f0;
          border-radius: 11px;
          background: #fff;
          color: #29253b;
          font-size: 11px;
          font-weight: 700;
        }
        .secondary-button:hover {
          background: #faf8ff;
          border-color: #d9c8ff;
        }
        .google-mark {
          color: #4285f4;
          font-size: 16px;
          font-weight: 900;
        }
        .apple-mark {
          color: #111;
          font-size: 15px;
        }
        .switch-copy {
          margin: 23px 0 0;
          color: #777187;
          text-align: center;
          font-size: 11px;
        }
        @media (max-width: 700px) {
          .auth-page {
            padding: 16px;
            align-items: flex-start;
          }
          .auth-layout {
            min-height: auto;
            max-width: 440px;
            margin: auto;
            grid-template-columns: 1fr;
            border-radius: 22px;
          }
          .auth-intro {
            padding: 22px 23px 15px;
            background: transparent;
          }
          .brand {
            font-size: 31px;
          }
          .intro-copy {
            display: none;
          }
          .intro-footer {
            display: none;
          }
          .auth-card-wrap {
            padding: 0 12px 16px;
            background: transparent;
          }
          .auth-card {
            max-width: none;
            padding: 25px 21px;
            border-radius: 19px;
            box-shadow: 0 12px 35px #4c307c10;
          }
          .card-brand {
            font-size: 32px;
          }
          .auth-card h2 {
            font-size: 23px;
          }
        }
        @media (max-width: 360px) {
          .auth-page {
            padding: 10px;
          }
          .auth-card-wrap {
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
