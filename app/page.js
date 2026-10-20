
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "../lib/supabase";

const CATEGORIES = [
  "All",
  "Music",
  "Nightlife",
  "Business",
  "Food & Drink",
  "Arts",
  "Sports",
  "Community",
  "Other",
];

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80";

export default function HomePage() {
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("All");
  const [favorites, setFavorites] = useState([]);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (!active) return;

      if (sessionError || !data.session) {
        router.replace("/auth");
        return;
      }

      setSession(data.session);
      setAuthReady(true);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;

      if (!newSession) {
        setSession(null);
        router.replace("/auth");
        return;
      }

      setSession(newSession);
      setAuthReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!authReady || !session) return;

    let active = true;

    async function loadEvents() {
      setLoading(true);
      setError("");

      const { data, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (eventError) {
        setError(
          "Events load nahi ho paaye. Database table aur permissions check karein."
        );
        setEvents([]);
      } else {
        setEvents(data || []);
      }

      setLoading(false);
    }

    loadEvents();

    return () => {
      active = false;
    };
  }, [authReady, session]);

  const filteredEvents = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const cityText = city.trim().toLowerCase();

    return events.filter((event) => {
      const title = String(event.title || event.name || "").toLowerCase();
      const description = String(event.description || "").toLowerCase();
      const eventCity = String(
        event.city || event.location || ""
      ).toLowerCase();
      const eventCategory = String(
        event.category || "Other"
      ).toLowerCase();

      const matchesSearch =
        !searchText ||
        title.includes(searchText) ||
        description.includes(searchText) ||
        eventCity.includes(searchText);

      const matchesCity =
        !cityText || eventCity.includes(cityText);

      const matchesCategory =
        category === "All" ||
        eventCategory === category.toLowerCase();

      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [events, search, city, category]);

  async function handleLogout() {
    setLoggingOut(true);

    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError("Logout nahi hua. Dobara try karein.");
      setLoggingOut(false);
      return;
    }

    router.replace("/auth");
  }

  function toggleFavorite(id) {
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  function getEventImage(event) {
    return (
      event.flyer_url ||
      event.flyer ||
      event.image_url ||
      event.image ||
      FALLBACK_IMAGE
    );
  }

  function getEventLocation(event) {
    return (
      event.venue ||
      event.address ||
      event.city ||
      event.location ||
      "Location to be announced"
    );
  }

  function getEventDate(event) {
    const rawDate =
      event.start_date ||
      event.event_date ||
      event.starts_at ||
      event.date;

    if (!rawDate) return "Date to be announced";

    const parsedDate = new Date(rawDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(rawDate);
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function openEvent(event) {
    const slug = event.slug || event.id;
    if (slug) router.push(`/event/${slug}`);
  }

  if (!authReady) {
    return (
      <main className="loading-screen">
        <div className="loading-logo">VYBE</div>
        <p>Checking your login...</p>
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: #090914;
            color: #fff;
            font-family: Arial, sans-serif;
          }
          .loading-logo {
            font-size: 42px;
            font-weight: 900;
            letter-spacing: 5px;
            color: #b79aff;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="navbar">
        <button
          className="logo"
          onClick={() => router.push("/")}
          aria-label="VYBE home"
        >
          VYBE<span>.</span>
        </button>

        <nav className="nav-links">
          <a href="#discover">Discover</a>
          <a href="#categories">Categories</a>
        </nav>

        <div className="nav-actions">
          <button
            className="organize-button"
            onClick={() => router.push("/organize")}
          >
            + Create Event
          </button>

          <button
            className="logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="live-dot" />
            YOUR CITY. YOUR PEOPLE. YOUR VYBE.
          </div>

          <h1>
            Find your
            <br />
            next <span>VYBE.</span>
          </h1>

          <p className="hero-description">
            Discover events, meet your people, and make every moment count.
          </p>

          <div className="search-panel">
            <label className="search-field">
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events, music, parties..."
              />
            </label>

            <label className="search-field city-field">
              <span>⌖</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City or location"
              />
            </label>

            <button
              className="search-button"
              onClick={() =>
                document
                  .getElementById("discover")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore Events
            </button>
          </div>

          <div className="hero-note">
            <span>✦</span> Discover something unforgettable
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-glow" />
          <div className="art-ring ring-one" />
          <div className="art-ring ring-two" />
          <div className="art-card card-one">
            <span>LIVE MUSIC</span>
            <strong>Feel the beat.</strong>
          </div>
          <div className="art-card card-two">
            <span>YOUR PEOPLE</span>
            <strong>Good times only.</strong>
          </div>
          <div className="art-center">
            <span>V</span>
            <small>FIND YOUR VYBE</small>
          </div>
        </div>
      </section>

      <section className="category-section" id="categories">
        <div className="section-heading">
          <div>
            <p className="section-kicker">EXPLORE YOUR INTERESTS</p>
            <h2>Find your scene</h2>
          </div>
        </div>

        <div className="category-list">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              className={`category-chip ${
                category === item ? "selected" : ""
              }`}
              onClick={() => setCategory(item)}
            >
              {item === "All" && "✦ "}
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="events-section" id="discover">
        <div className="section-heading events-heading">
          <div>
            <p className="section-kicker">WHAT'S HAPPENING</p>
            <h2>Discover events</h2>
            <p className="section-subtitle">
              The experiences everyone's talking about.
            </p>
          </div>

          <button
            className="text-button"
            onClick={() => {
              setSearch("");
              setCity("");
              setCategory("All");
            }}
          >
            Clear filters ↗
          </button>
        </div>

        {loading ? (
          <div className="message-panel">
            <div className="spinner" />
            <p>Finding your next VYBE...</p>
          </div>
        ) : error ? (
          <div className="message-panel">
            <p>{error}</p>
            <button
              className="organize-button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✦</div>
            <h3>No events found</h3>
            <p>
              Try another search or category, or be the first to create an
              event.
            </p>
            <button
              className="organize-button"
              onClick={() => router.push("/organize")}
            >
              Create an event
            </button>
          </div>
        ) : (
          <div className="event-grid">
            {filteredEvents.map((event) => {
              const eventId = event.id || event.slug;
              const isFavorite = favorites.includes(eventId);

              return (
                <article
                  className="event-card"
                  key={eventId}
                  onClick={() => openEvent(event)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openEvent(event);
                  }}
                >
                  <div className="event-image-wrap">
                    <img
                      className="event-image"
                      src={getEventImage(event)}
                      alt={event.title || event.name || "Event flyer"}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />

                    <span className="event-category">
                      {event.category || "Event"}
                    </span>

                    <button
                      className={`favorite-button ${
                        isFavorite ? "is-favorite" : ""
                      }`}
                      aria-label={
                        isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(eventId);
                      }}
                    >
                      {isFavorite ? "♥" : "♡"}
                    </button>
                  </div>

                  <div className="event-details">
                    <p className="event-date">{getEventDate(event)}</p>
                    <h3>{event.title || event.name || "Untitled event"}</h3>
                    <p className="event-location">
                      <span>⌖</span> {getEventLocation(event)}
                    </p>

                    <div className="event-card-footer">
                      <span className="event-price">
                        {event.price === 0 ||
                        event.is_free ||
                        event.ticket_type === "free"
                          ? "Free"
                          : event.price
                          ? `₹${event.price}`
                          : "See details"}
                      </span>
                      <span className="event-arrow">↗</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="organizer-banner">
        <div>
          <p className="section-kicker">GOT SOMETHING PLANNED?</p>
          <h2>Your event deserves a crowd.</h2>
          <p>
            Create your event on VYBE and bring the right people together.
          </p>
        </div>

        <button
          className="banner-button"
          onClick={() => router.push("/organize")}
        >
          Create your event <span>↗</span>
        </button>
      </section>

      <footer className="footer">
        <button className="footer-logo" onClick={() => router.push("/")}>
          VYBE<span>.</span>
        </button>
        <p>Find your people. Find your VYBE.</p>
        <span className="footer-copy">
          © {new Date().getFullYear()} VYBE
        </span>
      </footer>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #090914;
          color: #f7f5ff;
          font-family: Arial, Helvetica, sans-serif;
          overflow: hidden;
        }

        .navbar {
          min-height: 78px;
          padding: 0 7%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(9, 9, 20, 0.96);
        }

        .logo,
        .footer-logo {
          border: 0;
          background: transparent;
          color: #fff;
          font-size: 27px;
          font-weight: 900;
          letter-spacing: 3px;
          cursor: pointer;
        }

        .logo span,
        .footer-logo span {
          color: #a98aff;
        }

        .nav-links,
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .nav-links a {
          color: #c1bfd1;
          text-decoration: none;
          font-size: 14px;
        }

        .nav-links a:hover {
          color: #fff;
        }

        .organize-button,
        .logout-button,
        .search-button,
        .banner-button {
          border: 0;
          border-radius: 10px;
          padding: 13px 17px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }

        .organize-button,
        .search-button {
          color: white;
          background: linear-gradient(110deg, #7856ed, #b45de9);
        }

        .logout-button {
          color: #e5defc;
          border: 1px solid #393149;
          background: #151321;
        }

        .organize-button:hover,
        .logout-button:hover,
        .search-button:hover,
        .banner-button:hover {
          transform: translateY(-2px);
        }

        .hero {
          position: relative;
          min-height: 540px;
          padding: 75px 7% 65px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          align-items: center;
          gap: 30px;
          background:
            radial-gradient(
              ellipse at 78% 48%,
              rgba(107, 63, 185, 0.18),
              transparent 43%
            ),
            #090914;
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #c4a9ff;
          font-size: 11px;
          letter-spacing: 2px;
          font-weight: 700;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #b08aff;
          box-shadow: 0 0 14px #9b70ff;
        }

        .hero h1 {
          margin: 24px 0 18px;
          font-size: clamp(55px, 7.5vw, 94px);
          line-height: 0.99;
          letter-spacing: -5px;
          font-weight: 900;
        }

        .hero h1 span {
          color: #b28cff;
          text-shadow: 0 0 38px rgba(153, 107, 255, 0.28);
        }

        .hero-description {
          max-width: 430px;
          color: #b7b4c9;
          font-size: 16px;
          line-height: 1.8;
        }

        .search-panel {
          max-width: 680px;
          margin-top: 28px;
          padding: 9px;
          display: flex;
          gap: 8px;
          border: 1px solid #30283f;
          border-radius: 15px;
          background: #12111e;
        }

        .search-field {
          min-width: 0;
          flex: 1;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 8px;
          color: #a98aff;
        }

        .search-field span {
          font-size: 23px;
        }

        .search-field input {
          width: 100%;
          min-width: 0;
          padding: 12px 0;
          color: white;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 13px;
        }

        .search-field input::placeholder {
          color: #777387;
        }

        .search-button {
          white-space: nowrap;
          font-size: 12px;
        }

        .hero-note {
          margin-top: 24px;
          color: #8f8a9f;
          font-size: 12px;
        }

        .hero-note span {
          color: #b28cff;
          margin-right: 7px;
        }

        .hero-art {
          position: relative;
          min-height: 355px;
          display: flex;
          align-items: center;
          justify-content: center;
          isolation: isolate;
        }

        .art-glow {
          position: absolute;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: #6e3cb8;
          filter: blur(100px);
          opacity: 0.3;
        }

        .art-ring {
          position: absolute;
          width: 300px;
          height: 300px;
          border: 1px solid rgba(181, 141, 255, 0.25);
          border-radius: 50%;
          transform: rotate(-24deg) scaleY(0.7);
        }

        .ring-two {
          width: 360px;
          height: 360px;
          transform: rotate(40deg) scaleY(0.72);
          border-color: rgba(115, 91, 208, 0.3);
        }

        .art-center {
          width: 175px;
          height: 175px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 38px;
          border: 1px solid rgba(213, 190, 255, 0.4);
          background: linear-gradient(145deg, #39265b, #171126 70%);
          box-shadow: 0 20px 70px rgba(118, 63, 198, 0.25);
          transform: rotate(-7deg);
        }

        .art-center span {
          font-size: 85px;
          line-height: 0.9;
          font-weight: 900;
          color: #d1b9ff;
        }

        .art-center small {
          margin-top: 10px;
          color: #c3b2e8;
          font-size: 8px;
          letter-spacing: 2px;
        }

        .art-card {
          position: absolute;
          z-index: 2;
          padding: 16px 18px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          background: rgba(23, 20, 38, 0.9);
          box-shadow: 0 15px 45px rgba(0, 0, 0, 0.2);
        }

        .art-card span {
          display: block;
          margin-bottom: 7px;
          color: #bda2ff;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .art-card strong {
          font-size: 14px;
        }

        .card-one {
          top: 42px;
          right: 0;
          transform: rotate(5deg);
        }

        .card-two {
          bottom: 35px;
          left: 0;
          transform: rotate(-5deg);
        }

        .category-section,
        .events-section {
          padding: 52px 7%;
        }

        .category-section {
          border-top: 1px solid #211d2d;
          border-bottom: 1px solid #211d2d;
          background: #0d0c18;
        }

        .section-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
        }

        .section-kicker {
          margin: 0 0 10px;
          color: #a98aff;
          font-size: 10px;
          letter-spacing: 2px;
          font-weight: 800;
        }

        .section-heading h2,
        .organizer-banner h2 {
          margin: 0;
          font-size: clamp(27px, 4vw, 39px);
          letter-spacing: -1.3px;
        }

        .category-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 26px;
        }

        .category-chip {
          padding: 11px 16px;
          border: 1px solid #302b40;
          border-radius: 999px;
          background: #141220;
          color: #c2bfd1;
          cursor: pointer;
          font-size: 12px;
        }

        .category-chip:hover,
        .category-chip.selected {
          border-color: #a98aff;
          background: #2a2040;
          color: #e5d7ff;
        }

        .events-section {
          padding-top: 65px;
          padding-bottom: 75px;
        }

        .section-subtitle {
          color: #8f8a9f;
          font-size: 13px;
          margin-top: 12px;
        }

        .text-button {
          border: 0;
          background: transparent;
          color: #c1a8ff;
          cursor: pointer;
          white-space: nowrap;
        }

        .event-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          margin-top: 32px;
        }

        .event-card {
          min-width: 0;
          overflow: hidden;
          border: 1px solid #292437;
          border-radius: 16px;
          background: #11101c;
          cursor: pointer;
          transition: transform 0.2s, border-color 0.2s;
        }

        .event-card:hover {
          transform: translateY(-5px);
          border-color: #7252a8;
        }

        .event-image-wrap {
          position: relative;
          height: 220px;
          overflow: hidden;
          background: #211a32;
        }

        .event-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .event-card:hover .event-image {
          transform: scale(1.04);
        }

        .event-category {
          position: absolute;
          left: 13px;
          bottom: 13px;
          padding: 7px 10px;
          border-radius: 7px;
          background: rgba(14, 11, 24, 0.86);
          color: #e3d5ff;
          font-size: 10px;
        }

        .favorite-button {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 35px;
          height: 35px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 50%;
          background: rgba(12, 10, 22, 0.8);
          color: white;
          font-size: 21px;
          cursor: pointer;
        }

        .favorite-button.is-favorite {
          color: #ff7ba8;
        }

        .event-details {
          padding: 18px;
        }

        .event-date {
          margin: 0 0 9px;
          color: #b59aff;
          font-size: 11px;
          font-weight: 700;
        }

        .event-details h3 {
          margin: 0;
          color: #f5f1ff;
          font-size: 19px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .event-location {
          margin: 12px 0 19px;
          color: #9e99b0;
          font-size: 12px;
          line-height: 1.5;
        }

        .event-location span {
          color: #b59aff;
        }

        .event-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 14px;
          border-top: 1px solid #292437;
        }

        .event-price {
          color: #ded4f6;
          font-size: 12px;
          font-weight: 700;
        }

        .event-arrow {
          color: #b59aff;
          font-size: 20px;
        }

        .message-panel,
        .empty-state {
          min-height: 210px;
          margin-top: 28px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border: 1px dashed #383047;
          border-radius: 16px;
          color: #aaa5bd;
          background: #100f1b;
        }

        .empty-state h3 {
          margin: 12px 0 0;
          color: white;
          font-size: 22px;
        }

        .empty-state p {
          max-width: 420px;
          font-size: 13px;
          line-height: 1.7;
        }

        .empty-icon {
          color: #b59aff;
          font-size: 34px;
        }

        .spinner {
          width: 28px;
          height: 28px;
          border: 3px solid #373047;
          border-top-color: #b59aff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .organizer-banner {
          margin: 0 7% 65px;
          padding: 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          border: 1px solid #493566;
          border-radius: 18px;
          background:
            radial-gradient(
              ellipse at 85% 10%,
              rgba(154, 92, 228, 0.24),
              transparent 50%
            ),
            #171224;
        }

        .organizer-banner > div > p:last-child {
          color: #aaa4bd;
          font-size: 13px;
          line-height: 1.7;
        }

        .banner-button {
          flex-shrink: 0;
          color: white;
          background: linear-gradient(110deg, #7856ed, #b45de9);
        }

        .banner-button span {
          margin-left: 8px;
        }

        .footer {
          min-height: 100px;
          padding: 25px 7%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-top: 1px solid #211d2d;
          color: #89849b;
          font-size: 12px;
        }

        .footer-logo {
          font-size: 21px;
        }

        .footer-copy {
          white-space: nowrap;
        }

        @media (max-width: 900px) {
          .navbar {
            padding: 16px 5%;
            flex-wrap: wrap;
          }

          .nav-links {
            display: none;
          }

          .hero {
            padding: 55px 5%;
            grid-template-columns: 1fr;
          }

          .hero-art {
            min-height: 300px;
          }

          .category-section,
          .events-section {
            padding-left: 5%;
            padding-right: 5%;
          }

          .event-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .organizer-banner {
            margin-left: 5%;
            margin-right: 5%;
          }
        }

        @media (max-width: 560px) {
          .navbar {
            gap: 12px;
          }

          .logo {
            font-size: 23px;
          }

          .nav-actions {
            gap: 8px;
          }

          .organize-button,
          .logout-button {
            padding: 10px 11px;
            font-size: 11px;
          }

          .hero {
            padding-top: 48px;
          }

          .hero h1 {
            font-size: 62px;
            letter-spacing: -3px;
          }

          .hero-description {
            font-size: 14px;
          }

          .search-panel {
            flex-direction: column;
            padding: 12px;
          }

          .search-field {
            min-height: 43px;
            border-bottom: 1px solid #292437;
          }

          .search-button {
            min-height: 44px;
          }

          .hero-art {
            min-height: 270px;
          }

          .art-ring {
            width: 230px;
            height: 230px;
          }

          .ring-two {
            width: 285px;
            height: 285px;
          }

          .art-center {
            width: 135px;
            height: 135px;
            border-radius: 27px;
          }

          .art-center span {
            font-size: 65px;
          }

          .art-card {
            padding: 12px;
          }

          .art-card strong {
            font-size: 11px;
          }

          .card-one {
            right: -3px;
          }

          .card-two {
            left: -3px;
          }

          .category-section,
          .events-section {
            padding-top: 40px;
            padding-bottom: 45px;
          }

          .section-heading h2,
          .organizer-banner h2 {
            font-size: 29px;
          }

          .events-heading {
            align-items: start;
          }

          .text-button {
            font-size: 11px;
          }

          .event-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .event-image-wrap {
            height: 220px;
          }

          .organizer-banner {
            margin-bottom: 40px;
            padding: 25px 20px;
            flex-direction: column;
            align-items: flex-start;
          }

          .banner-button {
            width: 100%;
          }

          .footer {
            flex-wrap: wrap;
          }

          .footer p {
            order: 3;
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
