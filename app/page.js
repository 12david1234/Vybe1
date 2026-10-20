
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser as supabase } from "../lib/supabase";

const CATEGORIES = [
  { name: "Music", icon: "♫", color: "violet" },
  { name: "Nightlife", icon: "♬", color: "pink" },
  { name: "Food & Drink", icon: "♨", color: "orange" },
  { name: "Arts & Culture", icon: "▧", color: "blue" },
  { name: "Workshops", icon: "✧", color: "pink" },
  { name: "Business", icon: "▣", color: "blue" },
  { name: "Sports", icon: "◎", color: "green" },
  { name: "More", icon: "•••", color: "violet" },
];

const SAMPLE_EVENTS = [
  {
    title: "Neon Nights Music Festival",
    category: "Music",
    city: "New York",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85",
    price: "Explore event",
  },
  {
    title: "Sunset Beach Party",
    category: "Nightlife",
    city: "Los Angeles",
    image:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=85",
    price: "Free RSVP",
  },
  {
    title: "Tech & AI Workshop",
    category: "Workshops",
    city: "San Francisco",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=85",
    price: "Explore event",
  },
  {
    title: "Urban Art Festival",
    category: "Arts & Culture",
    city: "Chicago",
    image:
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85",
    price: "Explore event",
  },
];

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1800&q=90";

export default function HomePage() {
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [session, setSession] = useState(null);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        const { data: authData } = await supabase.auth.getSession();

        if (active) setSession(authData?.session || null);

        let result = await supabase
          .from("events")
          .select("*")
          .eq("status", "published")
          .order("starts_at", { ascending: true })
          .limit(24);

        // Fallback if this project uses a different date column.
        if (result.error) {
          result = await supabase
            .from("events")
            .select("*")
            .eq("status", "published")
            .limit(24);
        }

        if (active && !result.error) {
          setEvents(result.data || []);
        }
      } catch (error) {
        console.error("VYBE home load error:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const visibleEvents = useMemo(() => {
    const allEvents = events.length
      ? events.map((event) => ({
          ...event,
          title: event.title || "Untitled event",
          category: event.category || "Events",
          city: event.city || event.location_address || "",
          image:
            event.image_url ||
            "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85",
          price:
            event.ticket_mode === "sell"
              ? `${event.currency || "₹"} ${event.price ?? 0}`
              : "Free RSVP",
        }))
      : SAMPLE_EVENTS;

    return allEvents.filter((event) => {
      const text = `${event.title} ${event.category} ${event.city || ""}`;
      const matchesSearch = text
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      const matchesCity = !city.trim() ||
        String(event.city || "")
          .toLowerCase()
          .includes(city.trim().toLowerCase());
      const matchesCategory =
        category === "All" ||
        event.category?.toLowerCase() === category.toLowerCase();

      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [events, search, city, category]);

  async function logOut() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  function openEvent(event) {
    if (event.slug) router.push(`/events/${event.slug}`);
    else router.push("/events");
  }

  return (
    <main className="vybe-home">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #fff;
          color: #17152b;
          font-family: Arial, Helvetica, sans-serif;
        }
        .vybe-home {
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 5% 0%, #f0e6ff 0, transparent 34%),
            radial-gradient(ellipse at 100% 25%, #ffe7f4 0, transparent 30%),
            #fff;
          color: #17152b;
        }
        .vybe-wrap { width: min(1320px, calc(100% - 48px)); margin: auto; }
        .vybe-header {
          position: sticky; top: 0; z-index: 30;
          display: flex; align-items: center; gap: 24px;
          min-height: 76px; padding: 12px max(24px, calc((100vw - 1320px)/2));
          background: rgba(255,255,255,.94);
          border-bottom: 1px solid #eee7f6;
          backdrop-filter: blur(18px);
        }
        .vybe-logo {
          flex-shrink: 0; border: 0; background: transparent;
          font-size: 29px; line-height: 1; font-weight: 950;
          letter-spacing: -1.5px; color: #7434ec; cursor: pointer;
        }
        .vybe-logo span { color: #ef2c9b; }
        .vybe-nav { display: flex; align-items: center; gap: 23px; }
        .vybe-nav a {
          color: #4d4860; text-decoration: none; font-size: 13px;
          font-weight: 750; white-space: nowrap;
        }
        .vybe-nav a:hover { color: #7939ee; }
        .vybe-header-search {
          display: flex; align-items: center; gap: 8px;
          min-width: 160px; max-width: 240px; flex: 1;
          border: 1px solid #e9e3f1; border-radius: 999px;
          background: #faf9fd; padding: 10px 14px;
        }
        .vybe-header-search input {
          width: 100%; min-width: 0; border: 0; outline: 0;
          background: transparent; color: #211b36; font-size: 12px;
        }
        .vybe-header-right {
          display: flex; align-items: center; gap: 10px; margin-left: auto;
        }
        .vybe-gradient {
          border: 0; border-radius: 13px; color: white; cursor: pointer;
          font-weight: 800; text-decoration: none;
          background: linear-gradient(110deg, #7138f5, #ed269d);
          box-shadow: 0 8px 22px #a45bf12b;
          transition: transform .2s, box-shadow .2s;
        }
        .vybe-gradient:hover { transform: translateY(-1px); box-shadow: 0 10px 25px #a45bf144; }
        .vybe-create { padding: 13px 18px; font-size: 13px; white-space: nowrap; }
        .vybe-icon-btn {
          width: 39px; height: 39px; border: 1px solid #eee7f6;
          border-radius: 50%; background: white; color: #4e4265;
          cursor: pointer; font-size: 17px;
        }
        .vybe-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          display: grid; place-items: center; background: #f0e6ff;
          color: #7434ec; font-weight: 900;
        }
        .vybe-mobile-menu { display: none; }
        .vybe-hero {
          display: grid; grid-template-columns: 1fr 1fr; gap: 36px;
          align-items: center; padding-top: 40px; padding-bottom: 34px;
        }
        .vybe-eyebrow {
          display: inline-flex; align-items: center; gap: 9px;
          color: #7c42e8; font-size: 11px; font-weight: 900;
          letter-spacing: 2.4px; text-transform: uppercase;
        }
        .vybe-eyebrow:before {
          content: ""; width: 8px; height: 8px; border-radius: 50%;
          background: #ed319e; box-shadow: 0 0 0 5px #f7e8ff;
        }
        .vybe-hero h1 {
          margin: 20px 0 16px; max-width: 700px;
          font-size: clamp(43px, 5.4vw, 76px); line-height: .99;
          letter-spacing: -3.6px; font-weight: 950;
        }
        .vybe-hero h1 span {
          display: block;
          background: linear-gradient(100deg, #7434f4 4%, #c23fe9 52%, #f02a9b 100%);
          color: transparent; background-clip: text; -webkit-background-clip: text;
        }
        .vybe-hero-copy {
          max-width: 530px; color: #777187; font-size: 16px;
          line-height: 1.8; margin: 0 0 22px;
        }
        .vybe-search-card {
          padding: 10px; display: grid; gap: 8px;
          grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) auto;
          border: 1px solid #e9e1f4; border-radius: 18px;
          background: white; box-shadow: 0 14px 42px #54229c0c;
        }
        .vybe-search-field {
          display: flex; align-items: center; gap: 9px;
          padding: 12px; min-width: 0; color: #8d5bf0;
        }
        .vybe-search-field input {
          width: 100%; min-width: 0; outline: 0; border: 0;
          background: transparent; color: #28223a; font-size: 13px;
        }
        .vybe-search-button { padding: 0 22px; min-height: 47px; font-size: 13px; }
        .vybe-popular {
          display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
          margin-top: 15px; color: #888098; font-size: 12px;
        }
        .vybe-chip {
          border: 1px solid #eee7f7; border-radius: 999px; background: white;
          padding: 7px 11px; color: #6e647e; cursor: pointer; font-size: 11px;
        }
        .vybe-chip:hover { border-color: #c8a7ff; color: #7938ed; }
        .vybe-art { position: relative; min-width: 0; }
        .vybe-main-photo {
          position: relative; overflow: hidden; border-radius: 25px;
          height: 355px; background: #261042; box-shadow: 0 20px 50px #4b1d751b;
        }
        .vybe-main-photo:after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(0deg, #19082b9c, transparent 65%),
            linear-gradient(90deg, #2e0b4c38, transparent);
        }
        .vybe-main-photo img { width: 100%; height: 100%; object-fit: cover; }
        .vybe-photo-caption {
          position: absolute; z-index: 1; left: 25px; bottom: 24px;
          color: white; font-size: clamp(25px, 3vw, 39px);
          font-weight: 950; line-height: 1.05; letter-spacing: -1px;
        }
        .vybe-photo-caption span { color: #e9a4ff; }
        .vybe-floating {
          position: absolute; right: -13px; top: 20px; z-index: 2;
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; border: 1px solid #ffffffa3;
          border-radius: 15px; background: #ffffffed;
          box-shadow: 0 10px 35px #19072c20; font-size: 11px; font-weight: 850;
        }
        .vybe-floating strong { color: #8438eb; font-size: 18px; }
        .vybe-art-badges {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 10px; margin-top: 12px;
        }
        .vybe-art-badge {
          display: flex; align-items: center; gap: 8px; min-width: 0;
          border: 1px solid #eee6f7; border-radius: 13px;
          padding: 9px; background: white; color: #40364f;
          font-size: 11px; font-weight: 800;
        }
        .vybe-art-badge img {
          width: 35px; height: 35px; border-radius: 9px; object-fit: cover;
        }
        .vybe-section { padding: 25px 0 38px; }
        .vybe-section-head {
          display: flex; align-items: end; justify-content: space-between;
          gap: 15px; margin-bottom: 18px;
        }
        .vybe-section-head h2 {
          margin: 0; color: #1b1730; font-size: 25px;
          font-weight: 950; letter-spacing: -.8px;
        }
        .vybe-section-head p { margin: 6px 0 0; color: #8a8397; font-size: 13px; }
        .vybe-view-all {
          color: #8039ed; text-decoration: none; font-size: 12px;
          font-weight: 850; white-space: nowrap;
        }
        .vybe-categories {
          display: grid; grid-template-columns: repeat(8, minmax(0, 1fr));
          gap: 14px;
        }
        .vybe-category {
          display: flex; flex-direction: column; align-items: center; gap: 9px;
          padding: 15px 6px; border: 1px solid #f0eaf7; border-radius: 17px;
          background: #fff; cursor: pointer; color: #484054;
          font-size: 11px; font-weight: 800; transition: .2s;
        }
        .vybe-category:hover, .vybe-category.active {
          transform: translateY(-2px); border-color: #d5b6ff;
          box-shadow: 0 9px 24px #7434f40e; color: #7434ec;
        }
        .vybe-category-icon {
          display: grid; place-items: center; width: 43px; height: 43px;
          border-radius: 14px; font-size: 23px; font-weight: 900;
          background: #f1e9ff; color: #7838ee;
        }
        .vybe-category-icon.pink { background: #ffe9f5; color: #e92c9b; }
        .vybe-category-icon.orange { background: #fff1df; color: #e88b21; }
        .vybe-category-icon.blue { background: #e7f0ff; color: #3875ed; }
        .vybe-category-icon.green { background: #e6f8ee; color: #20a96a; }
        .vybe-events {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 17px;
        }
        .vybe-event {
          min-width: 0; overflow: hidden; border: 1px solid #eee8f6;
          border-radius: 17px; background: white; cursor: pointer;
          transition: transform .2s, box-shadow .2s;
        }
        .vybe-event:hover { transform: translateY(-3px); box-shadow: 0 13px 35px #3d175b14; }
        .vybe-event-image { height: 175px; position: relative; background: #eee6f8; }
        .vybe-event-image img { width: 100%; height: 100%; object-fit: cover; }
        .vybe-event-date {
          position: absolute; top: 11px; left: 11px; display: grid;
          place-items: center; min-width: 43px; padding: 7px 6px;
          border-radius: 10px; background: #ffffffed; color: #8039ed;
          font-size: 10px; font-weight: 900; text-align: center;
        }
        .vybe-heart {
          position: absolute; top: 10px; right: 10px; width: 34px; height: 34px;
          border: 0; border-radius: 50%; background: #ffffffeb; color: #a99ab7;
          cursor: pointer; font-size: 17px;
        }
        .vybe-heart.active { color: #ec2b9c; }
        .vybe-event-body { padding: 13px; }
        .vybe-event-body h3 {
          margin: 0 0 8px; font-size: 14px; font-weight: 900;
          line-height: 1.4; color: #211a34;
        }
        .vybe-event-location { color: #8b8398; font-size: 11px; }
        .vybe-event-bottom {
          display: flex; align-items: center; justify-content: space-between;
          gap: 6px; margin-top: 13px;
        }
        .vybe-event-tag {
          border-radius: 999px; background: #f3eaff; color: #7b3ce9;
          padding: 5px 8px; font-size: 10px; font-weight: 800;
        }
        .vybe-price { color: #302641; font-size: 11px; font-weight: 900; }
        .vybe-empty {
          grid-column: 1/-1; border: 1px dashed #ded0ef; border-radius: 17px;
          padding: 30px; text-align: center; color: #82768f; background: #fff;
        }
        .vybe-bottom-cta {
          display: flex; align-items: center; justify-content: space-between;
          gap: 20px; margin: 12px 0 45px; padding: 30px;
          border: 1px solid #e8d9ff; border-radius: 24px;
          background: linear-gradient(110deg, #f4edff, #fff0f8);
        }
        .vybe-bottom-cta h2 { margin: 0 0 7px; font-size: 23px; font-weight: 950; }
        .vybe-bottom-cta p { margin: 0; color: #7d718e; font-size: 13px; }
        .vybe-footer {
          border-top: 1px solid #eee6f6; padding: 24px 0 32px;
          color: #91879f; font-size: 12px;
        }
        @media (max-width: 1050px) {
          .vybe-header { gap: 13px; }
          .vybe-nav { gap: 12px; }
          .vybe-header-search { max-width: 180px; }
          .vybe-hero { gap: 24px; }
          .vybe-categories { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .vybe-events { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 760px) {
          .vybe-wrap { width: calc(100% - 28px); }
          .vybe-header {
            min-height: 65px; padding: 12px 14px; gap: 10px;
          }
          .vybe-logo { font-size: 25px; }
          .vybe-nav, .vybe-header-search, .vybe-header-right .vybe-icon-btn,
          .vybe-header-right .vybe-create, .vybe-desktop-only { display: none; }
          .vybe-mobile-menu { display: block; margin-left: auto; }
          .vybe-header-right { margin-left: 0; }
          .vybe-hero { grid-template-columns: 1fr; gap: 23px; padding-top: 26px; }
          .vybe-eyebrow { font-size: 9px; letter-spacing: 1.5px; }
          .vybe-hero h1 {
            margin: 17px 0 12px; font-size: clamp(42px, 11vw, 61px);
            letter-spacing: -2.4px; line-height: 1.02;
          }
          .vybe-hero-copy { font-size: 14px; line-height: 1.65; margin-bottom: 17px; }
          .vybe-search-card {
            grid-template-columns: 1fr; gap: 0; padding: 9px;
            border-radius: 17px;
          }
          .vybe-search-field { border-bottom: 1px solid #f0e9f7; padding: 13px 8px; }
          .vybe-search-button { min-height: 46px; margin-top: 9px; }
          .vybe-popular { gap: 6px; margin-top: 12px; }
          .vybe-chip { padding: 7px 9px; }
          .vybe-main-photo { height: 245px; border-radius: 19px; }
          .vybe-floating { right: 8px; top: 10px; }
          .vybe-photo-caption { left: 18px; bottom: 19px; font-size: 30px; }
          .vybe-art-badges { gap: 7px; }
          .vybe-art-badge { padding: 7px 6px; gap: 5px; font-size: 9px; }
          .vybe-art-badge img { width: 27px; height: 27px; }
          .vybe-section { padding: 20px 0 24px; }
          .vybe-section-head { margin-bottom: 14px; }
          .vybe-section-head h2 { font-size: 21px; }
          .vybe-section-head p { font-size: 11px; line-height: 1.5; }
          .vybe-categories { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
          .vybe-category { gap: 7px; padding: 11px 3px; border-radius: 13px; font-size: 10px; }
          .vybe-category-icon { width: 37px; height: 37px; border-radius: 12px; font-size: 20px; }
          .vybe-events { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .vybe-event { border-radius: 13px; }
          .vybe-event-image { height: 135px; }
          .vybe-event-date { top: 7px; left: 7px; min-width: 36px; padding: 5px; font-size: 9px; }
          .vybe-heart { top: 7px; right: 7px; width: 29px; height: 29px; }
          .vybe-event-body { padding: 10px; }
          .vybe-event-body h3 { font-size: 12px; }
          .vybe-event-location { font-size: 10px; }
          .vybe-event-tag { font-size: 9px; padding: 4px 6px; }
          .vybe-price { font-size: 10px; }
          .vybe-bottom-cta { flex-direction: column; align-items: flex-start; padding: 21px; margin-bottom: 25px; }
          .vybe-bottom-cta h2 { font-size: 20px; }
        }
      `}</style>

      <header className="vybe-header">
        <button
          type="button"
          className="vybe-logo"
          onClick={() => router.push("/")}
          aria-label="VYBE home"
        >
          VYBE<span>.</span>
        </button>

        <div className="vybe-header-search">
          <span>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, locations..."
            aria-label="Search events"
          />
        </div>

        <nav className="vybe-nav">
          <Link href="/">Home</Link>
          <Link href="/events">Explore Events</Link>
          <a href="#categories">Categories⌄</a>
        </nav>

        <div className="vybe-header-right">
          <Link href="/organize" className="vybe-gradient vybe-create">
            + Create Event
          </Link>
          <button
            type="button"
            className="vybe-icon-btn"
            aria-label="Notifications"
            title="Notifications"
          >
            ♧
          </button>
          {session ? (
            <button
              type="button"
              className="vybe-avatar"
              onClick={logOut}
              title="Log out"
              aria-label="Log out"
            >
              {session.user?.email?.[0]?.toUpperCase() || "V"}
            </button>
          ) : (
            <Link href="/auth" className="vybe-avatar" aria-label="Sign in">
              ↗
            </Link>
          )}
        </div>

        <button
          type="button"
          className="vybe-icon-btn vybe-mobile-menu"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: "60px",
              right: "12px",
              zIndex: 50,
              display: "grid",
              gap: "14px",
              padding: "18px",
              border: "1px solid #eee7f6",
              borderRadius: "16px",
              background: "white",
              boxShadow: "0 15px 40px #24123a1c",
            }}
          >
            <Link href="/" style={{ color: "#3a2d4e", textDecoration: "none" }}>Home</Link>
            <Link href="/events" style={{ color: "#3a2d4e", textDecoration: "none" }}>Explore Events</Link>
            <Link href="/organize" style={{ color: "#7938ed", textDecoration: "none" }}>Create Event</Link>
            {session ? (
              <button
                type="button"
                onClick={logOut}
                style={{ border: 0, background: "transparent", textAlign: "left", color: "#3a2d4e" }}
              >
                Log out
              </button>
            ) : (
              <Link href="/auth" style={{ color: "#3a2d4e", textDecoration: "none" }}>Sign in</Link>
            )}
          </div>
        )}
      </header>

      <div className="vybe-wrap">
        <section className="vybe-hero">
          <div>
            <div className="vybe-eyebrow">Discover · Attend · Create</div>
            <h1>
              Find Your Next
              <span>Great Experience</span>
            </h1>
            <p className="vybe-hero-copy">
              Explore the best events, parties, concerts, festivals, and more
              happening around the world.
            </p>

            <form
              className="vybe-search-card"
              onSubmit={(e) => {
                e.preventDefault();
                document.getElementById("trending")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              <label className="vybe-search-field">
                <span>⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events, artists, or venues..."
                  aria-label="Search events, artists, or venues"
                />
              </label>
              <label className="vybe-search-field">
                <span>⌖</span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City or location"
                  aria-label="City or location"
                />
              </label>
              <button className="vybe-gradient vybe-search-button" type="submit">
                Search ↗
              </button>
            </form>

            <div className="vybe-popular">
              <strong>Popular:</strong>
              {["All", "Music", "Nightlife", "Workshops"].map((item) => (
                <button
                  type="button"
                  className="vybe-chip"
                  key={item}
                  onClick={() => setCategory(item)}
                >
                  {item === "All" ? "All Events" : item}
                </button>
              ))}
              <button
                type="button"
                className="vybe-chip"
                onClick={() => setCategory("All")}
              >
                Free Events
              </button>
            </div>
          </div>

          <div className="vybe-art">
            <div className="vybe-floating">
              <strong>✦</strong>
              Find your people
            </div>
            <div className="vybe-main-photo">
              <img src={HERO_IMAGE} alt="Crowd enjoying a live music event" />
              <div className="vybe-photo-caption">
                Events Bring
                <br />
                People <span>Together.</span>
              </div>
            </div>
            <div className="vybe-art-badges">
              <div className="vybe-art-badge">
                <img
                  src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=120&q=80"
                  alt=""
                />
                Music
              </div>
              <div className="vybe-art-badge">
                <img
                  src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=120&q=80"
                  alt=""
                />
                Nightlife
              </div>
              <div className="vybe-art-badge">
                <img
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=120&q=80"
                  alt=""
                />
                Festivals
              </div>
            </div>
          </div>
        </section>

        <section className="vybe-section" id="categories">
          <div className="vybe-section-head">
            <div>
              <h2>Explore Categories</h2>
              <p>Find the experience that matches your vibe.</p>
            </div>
            <button
              type="button"
              className="vybe-view-all"
              onClick={() => setCategory("All")}
              style={{ border: 0, background: "transparent", cursor: "pointer" }}
            >
              View all →
            </button>
          </div>

          <div className="vybe-categories">
            {CATEGORIES.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() =>
                  setCategory(item.name === "More" ? "All" : item.name)
                }
                className={`vybe-category ${
                  category === item.name ? "active" : ""
                }`}
              >
                <span className={`vybe-category-icon ${item.color}`}>
                  {item.icon}
                </span>
                {item.name}
              </button>
            ))}
          </div>
        </section>

        <section className="vybe-section" id="trending">
          <div className="vybe-section-head">
            <div>
              <h2>Trending Events</h2>
              <p>
                {loading
                  ? "Loading published events..."
                  : "Discover something unforgettable."}
              </p>
            </div>
            <Link href="/events" className="vybe-view-all">
              View all events →
            </Link>
          </div>

          <div className="vybe-events">
            {visibleEvents.length === 0 ? (
              <div className="vybe-empty">
                <div style={{ fontSize: 30, marginBottom: 8 }}>⌕</div>
                <strong>No matching events found</strong>
                <p>Try another search or choose a different category.</p>
                <button
                  type="button"
                  className="vybe-gradient"
                  style={{ padding: "11px 18px", marginTop: 8 }}
                  onClick={() => {
                    setSearch("");
                    setCity("");
                    setCategory("All");
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              visibleEvents.map((event, index) => (
                <article
                  key={event.id || event.slug || event.title}
                  className="vybe-event"
                  onClick={() => openEvent(event)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openEvent(event);
                  }}
                  role="link"
                  tabIndex={0}
                >
                  <div className="vybe-event-image">
                    <img
                      src={event.image}
                      alt={event.title}
                      loading={index > 1 ? "lazy" : "eager"}
                    />
                    <div className="vybe-event-date">
                      {event.starts_at
                        ? new Date(event.starts_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "2-digit" }
                          )
                        : "VYBE"}
                    </div>
                    <button
                      type="button"
                      className={`vybe-heart ${
                        favorites.includes(event.id || event.title) ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const id = event.id || event.title;
                        setFavorites((current) =>
                          current.includes(id)
                            ? current.filter((item) => item !== id)
                            : [...current, id]
                        );
                      }}
                      aria-label="Add to favorites"
                    >
                      {favorites.includes(event.id || event.title) ? "♥" : "♡"}
                    </button>
                  </div>
                  <div className="vybe-event-body">
                    <h3>{event.title}</h3>
                    <div className="vybe-event-location">
                      ⌖ {event.city || "Location to be announced"}
                    </div>
                    <div className="vybe-event-bottom">
                      <span className="vybe-event-tag">{event.category}</span>
                      <span className="vybe-price">{event.price}</span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="vybe-bottom-cta">
          <div>
            <h2>Have an event to share?</h2>
            <p>Create your event and invite your people to the experience.</p>
          </div>
          <Link href="/organize" className="vybe-gradient vybe-create">
            + Create Your Event
          </Link>
        </section>

        <footer className="vybe-footer">
          <strong style={{ color: "#7838ed", fontSize: 18 }}>VYBE.</strong>
          <p>Discover events. Meet your people. Make every moment count.</p>
        </footer>
      </div>
    </main>
  );
}
