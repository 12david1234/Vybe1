
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser as supabase } from "../lib/supabase";

const categories = [
  { name: "Music", icon: "♫", color: "#ffe8f1" },
  { name: "Nightlife", icon: "🍸", color: "#f0e8ff" },
  { name: "Parties", icon: "🎉", color: "#fff0e8" },
  { name: "Festivals", icon: "🎪", color: "#fff5dc" },
  { name: "Food & Drink", icon: "🍴", color: "#e6f5ff" },
  { name: "Sports", icon: "🏀", color: "#ffece7" },
  { name: "Arts & Culture", icon: "🎨", color: "#f3eaff" },
  { name: "Business", icon: "💼", color: "#ecebff" },
  { name: "Wellness", icon: "🌿", color: "#e5f8ed" },
  { name: "Comedy", icon: "☻", color: "#fff4d9" },
  { name: "Community", icon: "♟", color: "#e6f4ff" },
  { name: "Other", icon: "•••", color: "#f0f1f5" },
];

const fallbackImages = [
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=900&q=80",
];

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [dateFilter, setDateFilter] = useState("any");
  const [favorites, setFavorites] = useState([]);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function getSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (!error) setSession(data.session);
      setAuthReady(true);
    }

    getSession();

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
    let active = true;

    async function loadEvents() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("events")
        .select(
          "id,title,description,starts_at,city,country,venue,category,price,currency,image_url,slug,status"
        )
        .eq("status", "published")
        .order("starts_at", { ascending: true })
        .limit(100);

      if (!active) return;

      if (error) {
        setError("Events could not be loaded. Please try again later.");
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
  }, []);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    return events.filter((event) => {
      const term = search.trim().toLowerCase();
      const eventCategory = (event.category || "Other").toLowerCase();

      const matchesSearch =
        !term ||
        [
          event.title,
          event.description,
          event.category,
          event.city,
          event.country,
          event.venue,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesCity =
        !city.trim() ||
        [event.city, event.country]
          .filter(Boolean)
          .join(", ")
          .toLowerCase()
          .includes(city.trim().toLowerCase());

      const matchesCategory =
        !category ||
        eventCategory.includes(category.toLowerCase()) ||
        (category === "Food & Drink" &&
          /food|drink|restaurant/i.test(eventCategory)) ||
        (category === "Arts & Culture" &&
          /art|culture/i.test(eventCategory));

      const eventDate = event.starts_at
        ? new Date(event.starts_at)
        : null;

      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate =
          eventDate &&
          eventDate >= today &&
          eventDate < new Date(today.getTime() + 86400000);
      }

      if (dateFilter === "weekend") {
        const day = today.getDay();
        const daysUntilSaturday = (6 - day + 7) % 7;
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + daysUntilSaturday);

        const monday = new Date(saturday);
        monday.setDate(saturday.getDate() + 2);

        matchesDate =
          eventDate && eventDate >= saturday && eventDate < monday;
      }

      if (dateFilter === "upcoming") {
        matchesDate = eventDate && eventDate >= today;
      }

      return (
        matchesSearch &&
        matchesCity &&
        matchesCategory &&
        matchesDate
      );
    });
  }, [events, search, city, category, dateFilter]);

  async function handleLogout() {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      setLoggingOut(false);
      return;
    }

    window.location.href = "/";
  }

  function formatDate(value) {
    if (!value) return { month: "TBA", day: "—", full: "Date to be announced" };

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return { month: "TBA", day: "—", full: "Date to be announced" };
    }

    return {
      month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      day: date.toLocaleDateString("en-US", { day: "2-digit" }),
      full: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  }

  function toggleFavorite(id) {
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  function resetFilters() {
    setSearch("");
    setCity("");
    setCategory("");
    setDateFilter("any");
  }

  return (
    <main className="vybe">
      <header className="vybe-nav">
        <a className="vybe-logo" href="/">VYBE</a>

        <nav className="vybe-nav-links">
          <a className="vybe-nav-active" href="/">⌂ <span>Home</span></a>
          <a href="#trending">Explore Events</a>

          <a href="#categories">Categories⌄</a>
          <a href="/organize">♧ Create Event</a>
          {session && <a href="#my-events">My Events</a>}
        </nav>

        <div className="vybe-nav-right">
          <label className="vybe-location">
            <span>📍</span>
            <input
              aria-label="Location"
              placeholder="Any location"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>

          <button
            className="vybe-icon-button"
            aria-label="Focus search"
            onClick={() =>
              document.getElementById("event-search")?.focus()
            }
          >
            ⌕
          </button>

          <a className="vybe-create" href="/organize">Create Event</a>

          {!authReady ? (
            <span className="vybe-account">…</span>
          ) : session ? (
            <button
              className="vybe-account"
              onClick={handleLogout}
              disabled={loggingOut}
              title="Log out"
            >
              {loggingOut ? "…" : "↪"}
            </button>
          ) : (
            <a className="vybe-account" href="/auth" title="Sign in">↗</a>
          )}
        </div>
      </header>

      <section className="vybe-hero">
        <div className="vybe-hero-copy">
          <div className="vybe-kicker">DISCOVER · ATTEND · CREATE</div>

          <h1>
            Find Your Next
            <br />
            <span>Great Experience</span>
          </h1>

          <p>
            Explore the best events, parties, concerts, festivals,
            and more happening around the world.
          </p>

          <form
            className="vybe-search"
            onSubmit={(e) => {
              e.preventDefault();
              document
                .getElementById("trending")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <label className="vybe-search-term">
              <span>⌕</span>
              <input
                id="event-search"
                placeholder="Search events, artists, or venues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <label className="vybe-search-city">
              <span>♧</span>
              <input
                aria-label="Search city"
                placeholder="Any location"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>

            <select
              aria-label="Event date"
              className="vybe-date-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="any">Any date</option>
              <option value="today">Today</option>
              <option value="weekend">This weekend</option>
              <option value="upcoming">Upcoming</option>
            </select>

            <button className="vybe-search-button" type="submit">
              Search
            </button>
          </form>

          <div className="vybe-popular">
            <span>Popular:</span>
            <button onClick={() => setDateFilter("today")}>Tonight</button>
            <button onClick={() => setDateFilter("weekend")}>This Weekend</button>
            <button onClick={() => setCategory("Music")}>Music</button>
            <button onClick={() => setCategory("Nightlife")}>Nightlife</button>
            <button onClick={() => setDateFilter("upcoming")}>Upcoming Events</button>
            <button onClick={() => setCategory("")}>All Events</button>
          </div>
        </div>

        <div className="vybe-hero-visual">
          <img
            className="vybe-hero-main-image"
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85"
            alt="People enjoying a live music event"
          />

          <div className="vybe-hero-overlay">
            <span>Good Events.</span>
            <strong>Better People.</strong>
          </div>

          <a
            href="#trending"
            className="vybe-feature-tile vybe-tile-one"
          >
            <img src={fallbackImages[0]} alt="" />
            <span>Music Events <b>↗</b></span>
          </a>

          <a
            href="#categories"
            className="vybe-feature-tile vybe-tile-two"
          >
            <img src={fallbackImages[1]} alt="" />
            <span>Nightlife <b>↗</b></span>
          </a>

          <a
            href="#trending"
            className="vybe-feature-tile vybe-tile-three"
          >
            <img src={fallbackImages[2]} alt="" />
            <span>Food &amp; Drink <b>↗</b></span>
          </a>
        </div>
      </section>

      <section id="categories" className="vybe-section vybe-categories-section">
        <div className="vybe-section-title-row">
          <h2>Popular Categories</h2>
          <button className="vybe-view-link" onClick={() => setCategory("")}>
            View All →
          </button>
        </div>

        <div className="vybe-category-grid">
          {categories.map((item) => (
            <button
              key={item.name}
              className={`vybe-category ${
                category === item.name ? "is-selected" : ""
              }`}
              style={{ "--category-bg": item.color }}
              onClick={() =>
                setCategory((current) =>
                  current === item.name ? "" : item.name
                )
              }
            >
              <span>{item.icon}</span>
              <strong>{item.name}</strong>
            </button>
          ))}
        </div>
      </section>

      <section id="trending" className="vybe-section vybe-trending">
        <div className="vybe-section-title-row">
          <div>
            <h2><span className="vybe-fire">♨</span> Trending This Week</h2>
            <p>The hottest events happening near you and around the world.</p>
          </div>
          <button
            className="vybe-view-link"
            onClick={resetFilters}
          >
            View All Events →
          </button>
        </div>

        {(category || search || city || dateFilter !== "any") && (
          <div className="vybe-filter-status">
            Showing filtered events
            <button onClick={resetFilters}>Clear filters ×</button>
          </div>
        )}

        {loading ? (
          <div className="vybe-message">Finding great events for you…</div>
        ) : error ? (
          <div className="vybe-message">{error}</div>
        ) : filteredEvents.length === 0 ? (
          <div className="vybe-empty">
            <div className="vybe-empty-icon">✦</div>
            <h3>No events found yet</h3>
            <p>
              Try another search or be the first to organize an event.
            </p>
            <button className="vybe-create" onClick={resetFilters}>
              Clear filters
            </button>{" "}
            <a className="vybe-create" href="/organize">Create Event</a>
          </div>
        ) : (
          <div className="vybe-event-grid">
            {filteredEvents.map((event, index) => {
              const date = formatDate(event.starts_at);
              const isFree =
                event.price === 0 ||
                event.price === "0" ||
                event.price == null ||
                event.price === "";

              const image =
                event.image_url || fallbackImages[index % fallbackImages.length];

              return (
                <article className="vybe-event-card" key={event.id}>
                  <a
                    className="vybe-event-image-wrap"
                    href={
                      event.slug
                        ? `/events/${encodeURIComponent(event.slug)}`
                        : "#trending"
                    }
                  >
                    <img
                      className="vybe-event-image"
                      src={image}
                      alt={event.title || "Event flyer"}
                    />

                    <span className="vybe-event-badge">
                      {isFree ? "✦ Free RSVP" : index % 2 === 0 ? "★ Featured" : "✦ Popular"}
                    </span>

                    <span className="vybe-date-badge">
                      <small>{date.month}</small>
                      <strong>{date.day}</strong>
                    </span>
                  </a>

                  <button
                    className={`vybe-favorite ${
                      favorites.includes(event.id) ? "is-favorite" : ""
                    }`}
                    onClick={() => toggleFavorite(event.id)}
                    aria-label="Toggle favorite"
                  >
                    {favorites.includes(event.id) ? "♥" : "♡"}
                  </button>

                  <div className="vybe-event-info">
                    <a
                      className="vybe-event-title"
                      href={
                        event.slug
                          ? `/events/${encodeURIComponent(event.slug)}`
                          : "#trending"
                      }
                    >
                      {event.title || "Untitled event"}
                    </a>

                    <p className="vybe-event-location">
                      📍{" "}
                      {[
                        event.venue,
                        event.city,
                        event.country,
                      ].filter(Boolean).join(", ") || "Location to be announced"}
                    </p>

                    <div className="vybe-event-bottom">
                      <span className="vybe-event-category">
                        {event.category || "Community"}
                      </span>
                      <span className="vybe-event-price">
                        {isFree
                          ? "Free"
                          : `${event.currency || "₹"}${event.price}`}
                      </span>
                    </div>

                    <div className="vybe-event-footer">
                      <span>{date.full}</span>
                      <a
                        href={
                          event.slug
                            ? `/events/${encodeURIComponent(event.slug)}`
                            : "#trending"
                        }
                      >
                        Details →
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="vybe-footer">
        <a className="vybe-logo" href="/">VYBE</a>
        <p>Your city. Your people. Your VYBE.</p>
        <div>
          <a href="/">Discover</a>
          <a href="/organize">Organize an event</a>
          <a href="/auth">{session ? "Account" : "Sign in"}</a>
          {session && (
            <button onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          )}
        </div>
        <small>© {new Date().getFullYear()} VYBE. All rights reserved.</small>
      </footer>
    </main>
  );
}
