
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

        if (active) {
          setSession(authData?.session || null);
        }

        let result = await supabase
          .from("events")
          .select("*")
          .eq("status", "published")
          .order("starts_at", { ascending: true })
          .limit(24);

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
      } catch (err) {
        console.error("Party Event home load error:", err);
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
    const all = events.length
      ? events.map((event) => ({
          ...event,
          title: event.title || "Untitled event",
          category: event.category || "Events",
          city: event.city || event.location_address || "",
          image: event.image_url || SAMPLE_EVENTS[0].image,
          price:
            event.ticket_mode === "sell"
              ? `${event.currency || "₹"} ${event.price ?? 0}`
              : "Free RSVP",
        }))
      : SAMPLE_EVENTS;

    return all.filter((event) => {
      const haystack =
        `${event.title} ${event.category} ${event.city || ""}`.toLowerCase();

      return (
        haystack.includes(search.trim().toLowerCase()) &&
        (!city.trim() ||
          String(event.city || "")
            .toLowerCase()
            .includes(city.trim().toLowerCase())) &&
        (category === "All" ||
          event.category?.toLowerCase() === category.toLowerCase())
      );
    });
  }, [events, search, city, category]);

  async function logOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Party Event sign out error:", error);
      return;
    }

    setSession(null);
    setMenuOpen(false);
    router.replace("/auth");
  }

  function openProfile() {
    setMenuOpen(false);
    router.push("/profile");
  }

  function openEvent(event) {
    if (event.slug) {
      router.push(`/events/${event.slug}`);
    } else {
      router.push("/events");
    }
  }

  function clearFilters() {
    setSearch("");
    setCity("");
    setCategory("All");
  }

  return (
    <main className="vybe-home">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: #fff;
          color: #17152b;
        }

        .vybe-home {
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 5% 0%, #f0e6ff, transparent 34%),
            radial-gradient(ellipse at 100% 25%, #ffe7f4, transparent 30%),
            #fff;
          color: #17152b;
        }

        .wrap {
          width: min(1320px, calc(100% - 40px));
          margin: auto;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 30;
          display: flex;
          align-items: center;
          gap: 22px;
          min-height: 70px;
          padding: 12px max(20px, calc((100vw - 1320px) / 2));
          background: #ffffffed;
          border-bottom: 1px solid #eee7f6;
          backdrop-filter: blur(18px);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 5px;
          border: 0;
          padding: 0;
          background: none;
          color: #7434ec;
          font-size: 23px;
          font-weight: 950;
          letter-spacing: -1px;
          white-space: nowrap;
          cursor: pointer;
        }

        .logo span {
          color: #ef2c9b;
        }

        .headsearch {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 140px;
          max-width: 240px;
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #e9e3f1;
          border-radius: 999px;
          background: #faf9fd;
        }

        .headsearch input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 12px;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .nav a {
          color: #4d4860;
          text-decoration: none;
          font-size: 13px;
          font-weight: 750;
          white-space: nowrap;
        }

        .right {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
        }

        .gradient {
          border: 0;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          font-weight: 800;
          text-decoration: none;
          background: linear-gradient(110deg, #7138f5, #ed269d);
          box-shadow: 0 8px 22px #a45bf12b;
        }

        .create {
          padding: 12px 16px;
          font-size: 12px;
          white-space: nowrap;
        }

        .avatar {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 50%;
          background: #f0e6ff;
          color: #7434ec;
          font-weight: 900;
          text-decoration: none;
          border: 0;
          cursor: pointer;
        }

        .mobilemenu {
          display: none;
        }

        .mobile-dropdown {
          position: absolute;
          top: 58px;
          right: 12px;
          z-index: 50;
          min-width: 190px;
          display: grid;
          gap: 4px;
          padding: 12px;
          border: 1px solid #eee7f6;
          border-radius: 16px;
          background: white;
          box-shadow: 0 15px 40px #24123a1c;
        }

        .mobile-dropdown a,
        .mobile-dropdown button {
          display: block;
          width: 100%;
          padding: 11px;
          border: 0;
          border-radius: 9px;
          background: white;
          color: #4d4860;
          text-align: left;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .mobile-dropdown a:hover,
        .mobile-dropdown button:hover {
          background: #f7f1ff;
          color: #7434ec;
        }

        .menu-email {
          padding: 9px 11px;
          overflow-wrap: anywhere;
          color: #8a8397;
          font-size: 11px;
          border-bottom: 1px solid #eee7f6;
        }

        .menu-divider {
          height: 1px;
          margin: 4px 0;
          background: #eee7f6;
        }

        .hero {
          padding: 26px 0 25px;
        }

        .heroimage {
          height: 350px;
          position: relative;
          overflow: hidden;
          border-radius: 22px;
          background: #19082b;
          box-shadow: 0 20px 50px #4b1d751b;
        }

        .heroimage img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .heroimage:after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              #170526d9 0%,
              #1705269c 43%,
              #17052612 100%
            ),
            linear-gradient(0deg, #19082b70, transparent 60%);
        }

        .herocopy {
          position: absolute;
          z-index: 1;
          left: clamp(20px, 4vw, 52px);
          top: 50%;
          transform: translateY(-50%);
          max-width: 540px;
          color: #fff;
        }

        .eyebrow {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 99px;
          background: #ffffff24;
          border: 1px solid #ffffff40;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.6px;
        }

        .herocopy h1 {
          font-size: clamp(30px, 4vw, 52px);
          line-height: 1.02;
          letter-spacing: -1.7px;
          margin: 13px 0 10px;
          font-weight: 950;
        }

        .herocopy p {
          max-width: 420px;
          font-size: 14px;
          line-height: 1.55;
          color: #f0e8fa;
          margin: 0 0 17px;
        }

        .heroform {
          display: flex;
          align-items: center;
          max-width: 510px;
          gap: 8px;
          padding: 6px;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 8px 25px #10051d45;
        }

        .heroform input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          padding: 11px 9px;
          color: #241c35;
          font-size: 13px;
        }

        .heroform button {
          flex-shrink: 0;
          padding: 11px 16px;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(110deg, #7138f5, #ed269d);
          color: white;
          font-weight: 800;
          cursor: pointer;
        }

        .section {
          padding: 18px 0 22px;
        }

        .sectionhead {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
        }

        .sectionhead h2 {
          margin: 0;
          font-size: 23px;
          font-weight: 950;
          letter-spacing: -0.7px;
        }

        .sectionhead p {
          margin: 5px 0 0;
          color: #8a8397;
          font-size: 12px;
        }

        .viewall {
          color: #8039ed;
          text-decoration: none;
          font-size: 12px;
          font-weight: 850;
        }

        .categories {
          display: grid;
          grid-template-columns: repeat(8, minmax(0, 1fr));
          gap: 12px;
        }

        .cat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px 4px;
          border: 1px solid #f0eaf7;
          border-radius: 15px;
          background: #fff;
          cursor: pointer;
          color: #484054;
          font-size: 11px;
          font-weight: 800;
        }

        .cat.active,
        .cat:hover {
          border-color: #d5b6ff;
          background: #fcf9ff;
          color: #7434ec;
        }

        .caticon {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 13px;
          font-size: 22px;
          background: #f1e9ff;
          color: #7838ee;
        }

        .caticon.pink {
          background: #ffe9f5;
          color: #e92c9b;
        }

        .caticon.orange {
          background: #fff1df;
          color: #e88b21;
        }

        .caticon.blue {
          background: #e7f0ff;
          color: #3875ed;
        }

        .caticon.green {
          background: #e6f8ee;
          color: #20a96a;
        }

        .events {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .event {
          min-width: 0;
          overflow: hidden;
          border: 1px solid #eee8f6;
          border-radius: 16px;
          background: #fff;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .event:hover {
          transform: translateY(-3px);
          box-shadow: 0 13px 35px #3d175b14;
        }

        .eventimage {
          height: 165px;
          position: relative;
          background: #eee6f8;
        }

        .eventimage img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .date {
          position: absolute;
          top: 9px;
          left: 9px;
          display: grid;
          place-items: center;
          min-width: 42px;
          padding: 6px;
          border-radius: 9px;
          background: #ffffffed;
          color: #8039ed;
          font-size: 10px;
          font-weight: 900;
          text-align: center;
        }

        .heart {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 50%;
          background: #ffffffed;
          color: #ec2b9c;
          cursor: pointer;
          font-size: 17px;
        }

        .eventbody {
          padding: 12px;
        }

        .eventbody h3 {
          margin: 0 0 7px;
          font-size: 13px;
          font-weight: 900;
          line-height: 1.4;
        }

        .loc {
          color: #8b8398;
          font-size: 10px;
        }

        .eventbottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-top: 11px;
        }

        .tag {
          border-radius: 999px;
          background: #f3eaff;
          color: #7b3ce9;
          padding: 5px 7px;
          font-size: 9px;
          font-weight: 800;
        }

        .price {
          color: #302641;
          font-size: 10px;
          font-weight: 900;
        }

        .empty {
          grid-column: 1 / -1;
          border: 1px dashed #ded0ef;
          border-radius: 17px;
          padding: 28px;
          text-align: center;
          color: #82768f;
          background: #fff;
        }

        .cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin: 12px 0 35px;
          padding: 26px;
          border: 1px solid #e8d9ff;
          border-radius: 22px;
          background: linear-gradient(110deg, #f4edff, #fff0f8);
        }

        .cta h2 {
          margin: 0 0 7px;
          font-size: 22px;
          font-weight: 950;
        }

        .cta p {
          margin: 0;
          color: #7d718e;
          font-size: 13px;
        }

        .footer {
          border-top: 1px solid #eee6f6;
          padding: 22px 0 30px;
          color: #91879f;
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .header {
            gap: 12px;
          }

          .nav {
            gap: 12px;
          }

          .headsearch {
            max-width: 180px;
          }

          .categories {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .events {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .wrap {
            width: calc(100% - 28px);
          }

          .header {
            min-height: 62px;
            padding: 10px 14px;
            gap: 9px;
          }

          .logo {
            font-size: 21px;
          }

          .nav,
          .headsearch,
          .desktop,
          .right .create {
            display: none;
          }

          .mobilemenu {
            display: grid;
            margin-left: auto;
          }

          .hero {
            padding-top: 17px;
          }

          .heroimage {
            height: 310px;
            border-radius: 18px;
          }

          .heroimage img {
            object-position: center;
          }

          .heroimage:after {
            background:
              linear-gradient(90deg, #170526dc, #17052680 75%, #17052620),
              linear-gradient(0deg, #19082b50, transparent);
          }

          .herocopy {
            left: 18px;
            right: 16px;
            max-width: 100%;
          }

          .herocopy h1 {
            font-size: clamp(31px, 8.5vw, 43px);
            letter-spacing: -1.3px;
          }

          .herocopy p {
            font-size: 12px;
            max-width: 330px;
          }

          .heroform {
            gap: 2px;
          }

          .heroform input {
            font-size: 11px;
            padding: 10px 5px;
          }

          .heroform button {
            padding: 10px 11px;
            font-size: 11px;
          }

          .section {
            padding: 16px 0 20px;
          }

          .sectionhead h2 {
            font-size: 20px;
          }

          .categories {
            gap: 7px;
          }

          .cat {
            padding: 10px 2px;
            font-size: 10px;
            border-radius: 12px;
          }

          .caticon {
            width: 36px;
            height: 36px;
            font-size: 19px;
            border-radius: 11px;
          }

          .events {
            gap: 9px;
          }

          .eventimage {
            height: 125px;
          }

          .eventbody {
            padding: 9px;
          }

          .eventbody h3 {
            font-size: 12px;
          }

          .loc {
            font-size: 9px;
          }

          .tag {
            font-size: 8px;
            padding: 4px 5px;
          }

          .price {
            font-size: 9px;
          }

          .cta {
            align-items: flex-start;
            flex-direction: column;
            padding: 20px;
            margin-bottom: 22px;
          }

          .cta h2 {
            font-size: 20px;
          }
        }
      `}</style>

      <header className="header">
        <button
          className="logo"
          onClick={() => router.push("/")}
          aria-label="Party Event home"
          type="button"
        >
          Party <span>Event</span>
        </button>

        <div className="headsearch">
          <span>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, locations..."
            aria-label="Search events"
          />
        </div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/events">Explore Events</Link>
          <a href="#categories">Categories⌄</a>
        </nav>

        <div className="right">
          <Link href="/organize" className="gradient create">
            + Create Event
          </Link>

          {session ? (
            <button
              className="avatar"
              onClick={openProfile}
              title="My Profile"
              aria-label="My Profile"
              type="button"
            >
              {session.user?.email?.[0]?.toUpperCase() || "U"}
            </button>
          ) : (
            <Link href="/auth" className="avatar" aria-label="Sign in">
              ↗
            </Link>
          )}
        </div>

        <button
          className="avatar mobilemenu"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          type="button"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {menuOpen && (
          <div className="mobile-dropdown">
            <Link href="/" onClick={() => setMenuOpen(false)}>
              Home
            </Link>

            <Link href="/events" onClick={() => setMenuOpen(false)}>
              Explore Events
            </Link>

            <Link href="/organize" onClick={() => setMenuOpen(false)}>
              Create Event
            </Link>

            {session ? (
              <>
                <div className="menu-divider" />

                <div className="menu-email">
                  Signed in as
                  <br />
                  <strong>{session.user?.email || "Your account"}</strong>
                </div>

                <button type="button" onClick={openProfile}>
                  My Profile
                </button>

                <button type="button" onClick={logOut}>
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth" onClick={() => setMenuOpen(false)}>
                Sign In / Create Account
              </Link>
            )}
          </div>
        )}
      </header>

      <div className="wrap">
        <section className="hero">
          <div className="heroimage">
            <img
              src={HERO_IMAGE}
              alt="Crowd enjoying a live concert"
            />

            <div className="herocopy">
              <span className="eyebrow">
                ✦ Find Your Next Experience
              </span>

              <h1>
                Events Bring
                <br />
                People Together
              </h1>

              <p>
                Discover parties, concerts, workshops, festivals and more,
                around you or anywhere in the world.
              </p>

              <form
                className="heroform"
                onSubmit={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("trending")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span style={{ paddingLeft: 9, color: "#7838ee" }}>
                  ⌕
                </span>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events, locations, or categories..."
                  aria-label="Search events, locations, or categories"
                />

                <button type="submit">⌕ Search</button>
              </form>
            </div>
          </div>
        </section>

        <section className="section" id="categories">
          <div className="categories">
            {CATEGORIES.map((item) => (
              <button
                key={item.name}
                className={`cat ${
                  category === item.name ? "active" : ""
                }`}
                onClick={() =>
                  setCategory(item.name === "More" ? "All" : item.name)
                }
                type="button"
              >
                <span className={`caticon ${item.color}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section" id="trending">
          <div className="sectionhead">
            <div>
              <h2>Trending Events</h2>
              <p>
                {loading
                  ? "Loading published events..."
                  : "Discover something unforgettable."}
              </p>
            </div>

            <Link className="viewall" href="/events">
              View All →
            </Link>
          </div>

          <div className="events">
            {visibleEvents.length === 0 ? (
              <div className="empty">
                <strong>No matching events found</strong>
                <p>Try another search or choose a different category.</p>
                <button
                  className="gradient"
                  style={{ padding: "10px 16px" }}
                  onClick={clearFilters}
                  type="button"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              visibleEvents.map((event, index) => (
                <article
                  key={event.id || event.slug || event.title}
                  className="event"
                  onClick={() => openEvent(event)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openEvent(event);
                  }}
                  role="link"
                  tabIndex={0}
                >
                  <div className="eventimage">
                    <img
                      src={event.image}
                      alt={event.title}
                      loading={index > 1 ? "lazy" : "eager"}
                    />

                    <div className="date">
                      {event.starts_at
                        ? new Date(event.starts_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "2-digit" }
                          )
                        : "Event"}
                    </div>

                    <button
                      type="button"
                      className="heart"
                      aria-label="Add to favorites"
                      onClick={(e) => {
                        e.stopPropagation();
                        const id = event.id || event.title;

                        setFavorites((old) =>
                          old.includes(id)
                            ? old.filter((item) => item !== id)
                            : [...old, id]
                        );
                      }}
                    >
                      {favorites.includes(event.id || event.title)
                        ? "♥"
                        : "♡"}
                    </button>
                  </div>

                  <div className="eventbody">
                    <h3>{event.title}</h3>

                    <div className="loc">
                      ⌖ {event.city || "Location to be announced"}
                    </div>

                    <div className="eventbottom">
                      <span className="tag">{event.category}</span>
                      <span className="price">{event.price}</span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="cta">
          <div>
            <h2>Have an event to share?</h2>
            <p>
              Create your event and invite your people to the experience.
            </p>
          </div>

          <Link href="/organize" className="gradient create">
            + Create Your Event
          </Link>
        </section>

        <footer className="footer">
          <strong style={{ color: "#7838ed", fontSize: 18 }}>
            Party <span style={{ color: "#ef2c9b" }}>Event</span>
          </strong>
          <p>
            Discover events. Meet your people. Make every moment count.
          </p>
        </footer>
      </div>
    </main>
  );
}
