
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "../../lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { data, error: authError } =
          await supabase.auth.getSession();

        if (authError) throw authError;

        if (!data.session) {
          router.replace("/auth");
          return;
        }

        if (active) {
          setUser(data.session.user);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Could not load your profile.");
          setLoading(false);
        }
      }
    }

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/auth");
      } else if (active) {
        setUser(session.user);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    setError("");

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      setSigningOut(false);
      return;
    }

    router.replace("/auth");
  }

  if (loading) {
    return (
      <main className="profile-page">
        <p>Loading your profile...</p>
        <style jsx>{`
          .profile-page {
            min-height: 100dvh;
            display: grid;
            place-items: center;
            font-family: Arial, sans-serif;
            color: #51466f;
            background: #f7f3ff;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <Link href="/" className="brand">
          Party <span>Event</span>
        </Link>

        <div className="avatar">
          {(user?.email?.[0] || "U").toUpperCase()}
        </div>

        <h1>My Profile</h1>
        <p className="subtitle">Manage your Party Event account</p>

        <div className="info">
          <span>Email address</span>
          <strong>{user?.email || "Not available"}</strong>
        </div>

        <div className="info">
          <span>Account ID</span>
          <strong className="user-id">{user?.id || "Not available"}</strong>
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        <Link href="/" className="primary">
          Explore Events
        </Link>

        <Link href="/organize" className="secondary">
          Create an Event
        </Link>

        <button
          className="logout"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? "Signing out..." : "Sign Out"}
        </button>
      </section>

      <style jsx>{`
        .profile-page {
          min-height: 100dvh;
          display: grid;
          place-items: center;
          padding: 20px;
          font-family: Arial, Helvetica, sans-serif;
          color: #211a35;
          background: linear-gradient(135deg, #f4efff, #fff4fa);
        }
        .profile-card {
          width: 100%;
          max-width: 430px;
          padding: 30px;
          border: 1px solid #eee5ff;
          border-radius: 24px;
          background: white;
          box-shadow: 0 20px 60px #56328b16;
        }
        .brand {
          display: block;
          text-align: center;
          text-decoration: none;
          color: #7436ed;
          font-size: 27px;
          font-weight: 900;
        }
        .brand span {
          color: #f02c91;
        }
        .avatar {
          width: 76px;
          height: 76px;
          display: grid;
          place-items: center;
          margin: 28px auto 14px;
          border-radius: 50%;
          color: white;
          font-size: 30px;
          font-weight: 900;
          background: linear-gradient(120deg, #7436ed, #f02c91);
        }
        h1 {
          margin: 0;
          text-align: center;
          font-size: 26px;
        }
        .subtitle {
          margin: 8px 0 25px;
          text-align: center;
          color: #777187;
          font-size: 13px;
        }
        .info {
          margin: 12px 0;
          padding: 14px;
          border-radius: 12px;
          background: #f8f6fc;
        }
        .info span,
        .info strong {
          display: block;
        }
        .info span {
          margin-bottom: 6px;
          color: #777187;
          font-size: 11px;
        }
        .info strong {
          font-size: 13px;
          overflow-wrap: anywhere;
        }
        .user-id {
          font-size: 11px !important;
        }
        .primary,
        .secondary,
        .logout {
          width: 100%;
          display: block;
          box-sizing: border-box;
          margin-top: 12px;
          padding: 14px;
          border: 0;
          border-radius: 11px;
          text-align: center;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }
        .primary {
          color: white;
          background: linear-gradient(100deg, #7436ed, #f02c91);
        }
        .secondary {
          color: #7436ed;
          border: 1px solid #e5d9ff;
          background: white;
        }
        .logout {
          color: #b42345;
          background: #fff0f3;
        }
        .logout:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .error {
          padding: 10px;
          border-radius: 9px;
          color: #b42345;
          background: #fff0f3;
          font-size: 12px;
          overflow-wrap: anywhere;
        }
      `}</style>
    </main>
  );
}
