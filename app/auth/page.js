
"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AuthPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sendOtp(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const cleanPhone = phone.replace(/\s/g, "");
    const formattedPhone = cleanPhone.startsWith("+")
      ? cleanPhone
      : `+91${cleanPhone}`;

    if (!/^\+[1-9]\d{7,14}$/.test(formattedPhone)) {
      setError("Sahi phone number daalein, country code ke saath.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (error) {
      setError(error.message);
    } else {
      setPhone(formattedPhone);
      setStep("otp");
      setMessage("SMS OTP bhej diya gaya hai.");
    }

    setLoading(false);
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp.trim(),
      type: "sms",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage("Phone verify ho gaya! Login successful.");

    window.location.href = "/";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "#080b16",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 28,
          borderRadius: 20,
          background: "#111827",
          border: "1px solid #273449",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ fontSize: 34, margin: "0 0 8px" }}>
          <span style={{ color: "#8b5cf6" }}>VYBE</span>
        </h1>

        <h2 style={{ fontSize: 24, marginBottom: 8 }}>
          Phone Verification
        </h2>

        <p style={{ color: "#aab4c8", lineHeight: 1.5 }}>
          Continue with your phone number. SMS verification is required.
        </p>

        {step === "phone" ? (
          <form onSubmit={sendOtp}>
            <label htmlFor="phone">Phone number</label>

            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={inputStyle}
            />

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Sending OTP..." : "Send SMS OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp}>
            <p style={{ color: "#aab4c8" }}>
              OTP sent to {phone}
            </p>

            <label htmlFor="otp">Enter 6-digit OTP</label>

            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
              maxLength={6}
              style={inputStyle}
            />

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              style={buttonStyle}
            >
              {loading ? "Verifying..." : "Verify OTP & Login"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
                setMessage("");
              }}
              style={secondaryButtonStyle}
            >
              Change phone number
            </button>
          </form>
        )}

        {message && (
          <p style={{ color: "#4ade80", overflowWrap: "anywhere" }}>
            {message}
          </p>
        )}

        {error && (
          <p style={{ color: "#f87171", overflowWrap: "anywhere" }}>
            {error}
          </p>
        )}

        <p style={{ color: "#8994a8", fontSize: 12, marginTop: 24 }}>
          By continuing, you agree to use VYBE responsibly.
        </p>
      </section>
    </main>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  marginTop: 8,
  marginBottom: 18,
  padding: 14,
  borderRadius: 10,
  border: "1px solid #374151",
  background: "#0b1220",
  color: "white",
  fontSize: 16,
};

const buttonStyle = {
  width: "100%",
  padding: 14,
  border: "none",
  borderRadius: 10,
  background: "#7c3aed",
  color: "white",
  fontSize: 16,
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  width: "100%",
  padding: 12,
  marginTop: 10,
  border: "1px solid #374151",
  borderRadius: 10,
  background: "transparent",
  color: "white",
  fontSize: 14,
  cursor: "pointer",
};
