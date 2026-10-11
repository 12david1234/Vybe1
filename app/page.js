
"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser as supabase } from "../lib/supabase";

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [eventError, setEventError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (!error) setSession(data.session);
      setAuthReady(true);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadEvents() {
      setEventsLoading(true);
      setEventError("");

      const { data, error } = await supabase
        .from("events")
        .select(
          "id,title,description,starts_at,city,country,venue,category,price,currency,image_url,slug,status"
        )
        .eq("status", "published")
        .order("starts_at", { ascending: true })
        .limit(50);

      if (error) {
        setEventError("Events could not be loaded right now.");
        setEvents([]);
      } else {
        setEvents(data || []);
      }

      setEventsLoading(false);
    }

    loadEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const term = search.trim().toLowerCase();
    const eventCity = (event.city || "").toLowerCase();

    const matchesSearch =
      !term ||
      [
        event.title,
        event.description,
        event.category,
        event.city,
        event.venue,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));

    const matchesCity =
      !city.trim() || eventCity.includes(city.trim().toLowerCase());

    return matchesSearch && matchesCity;
  });

  async function handleLogout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      setLoggingOut(false);
      return;
    }

    setSession(null);
    window.location.href = "/";
  }

  function formatDate(value) {
    if (!value) return "Date to be announced";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Date to be announced";

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main style={styles.page}>
      <header style={styles.navbar}>
        <a href="/" style={styles.brand}>
          VYBE
        </a>

        <nav style={styles.navLinks}>
          <a href="#discover" style={styles.navLink}>
            Discover
          </a>

          <a href="/organize" style={styles.navLink}>
            Organize
          </a>

          {!authReady ? (
            <span style={styles.navLink}>Loading...</span>
          ) : session ? (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={styles.navButton}
            >
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          ) : (
            <a href="/auth" style={styles.navLink}>
              Sign in
            </a>
          )}
        </nav>
      </header>

      <section style={styles.hero}>
        <div style={styles.heroActions}>
          <a href="/" style={styles.heroLogo}>
            VYBE<span style={{ color: "#a78bfa" }}>.</span>
          </a>

          {!authReady ? (
            <span style={styles.loginButton}>Loading...</span>
          ) : session ? (
            <div style={styles.accountBox}>
              <span style={styles.accountText}>
                {session.user?.email || "Account"}
              </span>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={styles.loginButton}
              >
                {loggingOut ? "..." : "Log out"}
              </button>
            </div>
          ) : (
            <a href="/auth" style={styles.loginButton}>
              Log in
            </a>
          )}

          <a href="/organize" style={styles.createButton}>
            Create event
          </a>
        </div>

        <div style={styles.heroContent}>
          <div style={styles.eyebrow}>
            ✦ YOUR CITY. YOUR PEOPLE. YOUR VYBE.
          </div>

          <h1 style={styles.title}>
            Find your
            <br />
            people.
            <br />
            <span style={styles.purpleText}>Feel the</span>
            <br />
            <span style={styles.purpleText}>moment.</span>
          </h1>

          <p style={styles.description}>
            Discover events, meet new people, and find something worth going
            out for. Your next experience starts here.
          </p>

          <form
            style={styles.searchBox}
            onSubmit={(e) => {
              e.preventDefault();
              document
                .getElementById("discover")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <input
              type="search"
              placeholder="Search events, music, meetups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />

            <input
              type="text"
              placeholder="Enter city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={styles.searchInput}
            />

            <button type="submit" style={styles.searchButton}>
              Find events
            </button>
          </form>
        </div>
      </section>

      <section id="discover" style={styles.eventsSection}>
        <div style={styles.sectionHeading}>
          <div>
            <p style={styles.sectionEyebrow}>EXPLORE YOUR WORLD</p>
            <h2 style={styles.sectionTitle}>Discover events</h2>
          </div>
          <span style={styles.eventCount}>{filteredEvents.length} events</span>
        </div>

        {eventsLoading ? (
          <p style={styles.muted}>Finding events for you...</p>
        ) : eventError ? (
          <p style={styles.muted}>{eventError}</p>
        ) : filteredEvents.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>✦</div>
            <h3 style={styles.emptyTitle}>Your next moment starts here.</h3>
            <p style={styles.muted}>
              No published events match your search yet. Try another search
              or check back soon.
            </p>
            <a href="/organize" style={styles.createButton}>
              Create an event
            </a>
          </div>
        ) : (
          <div style={styles.eventGrid}>
            {filteredEvents.map((event) => (
              <article key={event.id} style={styles.eventCard}>
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title || "Event"}
                    style={styles.eventImage}
                  />
                ) : (
                  <div style={styles.eventImagePlaceholder}>VYBE ✦</div>
                )}

                <div style={styles.eventBody}>
                  <span style={styles.category}>
                    {event.category || "Community"}
                  </span>

                  <h3 style={styles.eventTitle}>
                    {event.title || "Untitled event"}
                  </h3>

                  <p style={styles.eventMeta}>
                    {formatDate(event.starts_at)}
                  </p>

                  <p style={styles.eventMeta}>
                    {[event.city, event.country].filter(Boolean).join(", ") ||
                      "Location to be announced"}
                  </p>

                  {event.description && (
                    <p style={styles.eventDescription}>
                      {event.description}
                    </p>
                  )}

                  <p style={styles.eventPrice}>
                    {event.price == null || event.price === ""
                      ? "Price to be announced"
                      : Number(event.price) === 0
                        ? "Free"
                        : `${event.currency || "₹"} ${event.price}`}
                  </p>

                  <a
                    href={
                      event.slug
                        ? `/events/${encodeURIComponent(event.slug)}`
                        : "/auth"
                    }
                    style={styles.eventLink}
                  >
                    View event →
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer style={styles.footer}>
        <a href="/" style={styles.brand}>
          VYBE
        </a>
        <p style={styles.muted}>Your city. Your people. Your VYBE.</p>
      </footer>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#08080b",
    color: "#f9fafb",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  navbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "24px 6%",
    borderBottom: "1px solid #24242a",
    flexWrap: "wrap",
  },
  brand: {
    color: "#fff",
    fontSize: 36,
    fontWeight: 900,
    textDecoration: "none",
    letterSpacing: "-2px",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
  },
  navLink: {
    color: "#c4c4cf",
    textDecoration: "none",
    fontSize: 15,
  },
  navButton: {
    color: "#d6c6ff",
    background: "transparent",
    border: "none",
    fontSize: 15,
    cursor: "pointer",
  },
  hero: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "16px 5% 72px",
  },
  heroActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    padding: "0 0 22px",
    borderBottom: "1px solid #24242a",
  },
  heroLogo: {
    color: "#fff",
    fontSize: 36,
    fontWeight: 900,
    letterSpacing: "-2px",
    textDecoration: "none",
  },
  accountBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  accountText: {
    color: "#c4b5fd",
    fontSize: 13,
    maxWidth: 180,
    overflowWrap: "anywhere",
  },
  loginButton: {
    display: "inline-block",
    padding: "15px 22px",
    borderRadius: 40,
    border: "1px solid #393946",
    background: "#15151d",
    color: "#fff",
    textDecoration: "none",
    fontSize: 15,
    cursor: "pointer",
  },
  createButton: {
    display: "inline-block",
    padding: "17px 24px",
    borderRadius: 40,
    background: "#8955f6",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  },
  heroContent: {
    maxWidth: 700,
    margin: "80px auto 0",
  },
  eyebrow: {
    display: "inline-block",
    padding: "12px 18px",
    borderRadius: 40,
    border: "1px solid #453450",
    background: "#17101f",
    color: "#d9c4ff",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: "clamp(48px, 9vw, 88px)",
    lineHeight: 1.02,
    letterSpacing: "-4px",
    margin: "48px 0 24px",
    fontWeight: 900,
  },
  purpleText: {
    color: "#a78bfa",
  },
  description: {
    color: "#a4a4b2",
    fontSize: 20,
    lineHeight: 1.8,
    maxWidth: 600,
  },
  searchBox: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 18,
    marginTop: 42,
    border: "1px solid #292934",
    borderRadius: 24,
    background: "#14141c",
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #343441",
    borderRadius: 12,
    background: "#0c0c12",
    color: "#fff",
    padding: 17,
    fontSize: 16,
    outlineColor: "#a78bfa",
  },
  searchButton: {
    border: "none",
    borderRadius: 12,
    background: "#8955f6",
    color: "#fff",
    padding: 17,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
  eventsSection: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "40px 5% 90px",
  },
  sectionHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 30,
  },
  sectionEyebrow: {
    color: "#b79aff",
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: 700,
  },
  sectionTitle: {
    fontSize: 34,
    margin: "8px 0",
    letterSpacing: "-1px",
  },
  eventCount: {
    color: "#c4b5fd",
    fontSize: 14,
  },
  eventGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
    gap: 20,
  },
  eventCard: {
    border: "1px solid #292934",
    borderRadius: 20,
    overflow: "hidden",
    background: "#13131b",
    minWidth: 0,
  },
  eventImage: {
    display: "block",
    width: "100%",
    height: 190,
    objectFit: "cover",
    background: "#22202e",
  },
  eventImagePlaceholder: {
    height: 190,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #22163c, #101018)",
    color: "#c4b5fd",
    fontSize: 28,
    fontWeight: 900,
  },
  eventBody: {
    padding: 20,
  },
  category: {
    color: "#c4b5fd",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  eventTitle: {
    fontSize: 21,
    lineHeight: 1.3,
    margin: "12px 0",
    overflowWrap: "anywhere",
  },
  eventMeta: {
    color: "#a4a4b2",
    fontSize: 14,
    lineHeight: 1.6,
  },
  eventDescription: {
    color: "#c4c4cf",
    fontSize: 14,
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },
  eventPrice: {
    color: "#fff",
    fontWeight: 700,
    marginTop: 18,
  },
  eventLink: {
    display: "inline-block",
    marginTop: 8,
    color: "#c4b5fd",
    textDecoration: "none",
    fontWeight: 700,
  },
  emptyBox: {
    padding: "42px 20px",
    borderRadius: 20,
    border: "1px solid #292934",
    background: "#13131b",
    textAlign: "center",
  },
  emptyIcon: {
    color: "#a78bfa",
    fontSize: 38,
  },
  emptyTitle: {
    fontSize: 24,
  },
  muted: {
    color: "#a4a4b2",
    lineHeight: 1.7,
  },
  footer: {
    borderTop: "1px solid #24242a",
    padding: "32px 6%",
    textAlign: "center",
  },
};

