'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '../lib/supabase';

const categories = [
  'All Events',
  'Music',
  'Nightlife',
  'Business',
  'Technology',
  'Food',
  'Arts',
  'Sports'
];

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('All Events');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEvents() {
      try {
        const supabase = supabaseBrowser();

        const { data, error } = await supabase
          .from('events')
          .select(
            'id,title,description,starts_at,city,country,venue,category,price,currency,image_url,slug,status'
          )
          .eq('status', 'published')
          .order('starts_at', { ascending: true })
          .limit(24);

        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        setError(err.message || 'Events could not be loaded.');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const text = `${event.title || ''} ${event.description || ''} ${event.city || ''} ${event.category || ''}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase().trim());
      const matchesCity = (event.city || '')
        .toLowerCase()
        .includes(city.toLowerCase().trim());
      const matchesCategory =
        category === 'All Events' ||
        (event.category || '').toLowerCase() === category.toLowerCase();

      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [events, search, city, category]);

  function formatDate(value) {
    if (!value) return 'Date to be announced';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date to be announced';

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function eventLink(event) {
    return event.slug ? `/events/${event.slug}` : '#events';
  }

  return (
    <main className="vybe">
      <style jsx global>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; background: #08090d; color: #f8fafc; }
        a { color: inherit; text-decoration: none; }
        button, input { font: inherit; }
        .vybe { min-height: 100vh; background: #08090d; color: #f8fafc; font-family: Arial, Helvetica, sans-serif; }
        .topbar { max-width: 1240px; margin: auto; padding: 22px 24px; display: flex; align-items: center; justify-content: space-between; gap: 18px; }
        .logo { font-size: 29px; font-weight: 900; letter-spacing: -1.5px; }
        .logo span { color: #a78bfa; }
        .nav { display: flex; align-items: center; gap: 22px; color: #c4c7d0; font-size: 14px; }
        .nav a:hover { color: #fff; }
        .navbtn { border: 1px solid #343642; border-radius: 999px; padding: 11px 17px; background: #15161e; color: white; }
        .primary { border: 0; border-radius: 999px; background: #8b5cf6; color: white; padding: 13px 19px; font-weight: 700; display: inline-block; cursor: pointer; }
        .hero { max-width: 1240px; margin: auto; padding: 55px 24px 45px; }
        .eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #383044; border-radius: 999px; color: #d8c8ff; background: #171120; font-size: 12px; }
        .hero h1 { max-width: 850px; margin: 24px 0 16px; font-size: clamp(42px, 7vw, 76px); line-height: 1.02; letter-spacing: -3px; }
        .hero h1 span { color: #a78bfa; }
        .subhead { color: #a5a8b5; max-width: 600px; font-size: 17px; line-height: 1.7; }
        .searchbox { margin-top: 32px; display: grid; grid-template-columns: 1.5fr 1fr auto; gap: 10px; max-width: 850px; padding: 10px; background: #14151c; border: 1px solid #2a2b36; border-radius: 18px; }
        .searchbox input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: white; padding: 12px; }
        .searchbox input::placeholder { color: #858896; }
        .section { max-width: 1240px; margin: auto; padding: 25px 24px 60px; }
        .sectionhead { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin-bottom: 22px; }
        .section h2 { font-size: 27px; margin: 0; letter-spacing: -.7px; }
        .muted { color: #9699a8; font-size: 14px; }
        .chips { display: flex; gap: 9px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 27px; }
        .chip { white-space: nowrap; border: 1px solid #30313d; color: #c5c7d1; background: #12131a; padding: 10px 15px; border-radius: 999px; cursor: pointer; }
        .chip.active { background: #8b5cf6; color: white; border-color: #8b5cf6; }
        .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
        .eventcard { overflow: hidden; border: 1px solid #292a35; background: #12131a; border-radius: 18px; transition: transform .2s, border-color .2s; }
        .eventcard:hover { transform: translateY(-3px); border-color: #7954c7; }
        .eventimage { height: 190px; background: radial-gradient(circle at 75% 25%, #6542a5, transparent 36%), linear-gradient(135deg, #26203b, #11131b 70%); display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .eventimage img { width: 100%; height: 100%; object-fit: cover; }
        .imageplaceholder { font-size: 42px; opacity: .85; }
        .eventbody { padding: 17px; }
        .tag { display: inline-block; font-size: 11px; color: #d6c6ff; background: #28203a; border-radius: 999px; padding: 6px 9px; }
        .eventbody h3 { font-size: 19px; margin: 13px 0 10px; line-height: 1.35; }
        .eventmeta { color: #a4a6b2; font-size: 13px; line-height: 1.8; }
        .eventbottom { border-top: 1px solid #292a35; margin-top: 15px; padding-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .price { font-weight: 800; font-size: 14px; }
        .details { color: #cbb8ff; font-size: 13px; font-weight: 700; }
        .empty { padding: 38px 18px; border: 1px dashed #343542; border-radius: 16px; text-align: center; color: #a4a6b2; grid-column: 1 / -1; }
        .cta { max-width: 1192px; margin: 0 auto 60px; padding: 35px; border-radius: 22px; border: 1px solid #33284b; background: radial-gradient(circle at 90% 0%, #39275b, transparent 35%), #14111c; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .cta h2 { margin: 0 0 10px; font-size: 27px; }
        .cta p { margin: 0; color: #aaa5ba; line-height: 1.6; }
        .footer { border-top: 1px solid #242530; padding: 25px 24px; text-align: center; color: #858896; font-size: 13px; }
        @media (max-width: 760px) {
          .topbar { padding: 18px 17px; }
          .logo { font-size: 25px; }
          .nav { gap: 10px; }
          .nav .hide-mobile { display: none; }
          .navbtn { padding: 10px 12px; }
          .hero { padding: 45px 18px 32px; }
          .hero h1 { letter-spacing: -1.8px; }
          .subhead { font-size: 15px; }
          .searchbox { grid-template-columns: 1fr; gap: 2px; padding: 10px; }
          .searchbox input { padding: 14px 10px; }
          .searchbox .primary { width: 100%; }
          .section { padding: 20px 18px 42px; }
          .section h2 { font-size: 23px; }
          .grid { grid-template-columns: 1fr; gap: 15px; }
          .eventimage { height: 200px; }
          .cta { margin: 0 18px 40px; padding: 25px; flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <header className="topbar">
        <Link href="/" className="logo">VYBE<span>.</span></Link>
        <nav className="nav">
          <a className="hide-mobile" href="#events">Explore</a>
          <a className="hide-mobile" href="#categories">Categories</a>
          <Link className="navbtn" href="/auth">Log in</Link>
          <Link className="primary" href="/organize">Create event</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="eyebrow">✦ YOUR CITY. YOUR PEOPLE. YOUR VYBE.</div>
        <h1>Find your people.<br /><span>Feel the moment.</span></h1>
        <p className="subhead">
          Discover events, meet new people, and find something worth going out for.
          Your next experience starts here.
        </p>

        <div className="searchbox">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, music, meetups..."
            aria-label="Search events"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city"
            aria-label="Search by city"
          />
          <button
            className="primary"
            onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore events
          </button>
        </div>
      </section>

      <section className="section" id="events">
        <div className="sectionhead">
          <div>
            <h2>Explore events</h2>
            <p className="muted">Find something happening near you.</p>
          </div>
          <span className="muted">{filteredEvents.length} events</span>
        </div>

        <div className="chips" id="categories">
          {categories.map((item) => (
            <button
              key={item}
              className={`chip ${category === item ? 'active' : ''}`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid">
          {loading ? (
            <div className="empty">Loading events...</div>
          ) : error ? (
            <div className="empty">
              Events could not be loaded. Please check your Supabase connection and events table.
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="empty">
              <h3>No events found yet</h3>
              <p>Try another search or city. New published events will appear here.</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <article className="eventcard" key={event.id || event.slug || event.title}>
                <div className="eventimage">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title || 'Event'} />
                  ) : (
                    <div className="imageplaceholder">✦</div>
                  )}
                </div>
                <div className="eventbody">
                  <span className="tag">{event.category || 'Event'}</span>
                  <h3>{event.title}</h3>
                  <div className="eventmeta">
                    <div>◷ {formatDate(event.starts_at)}</div>
                    <div>⌖ {[event.city, event.country].filter(Boolean).join(', ') || 'Location to be announced'}</div>
                    {event.venue ? <div>⌂ {event.venue}</div> : null}
                  </div>
                  <div className="eventbottom">
                    <span className="price">
                      {Number(event.price || 0) <= 0
                        ? 'Free'
                        : `${event.currency || 'USD'} ${event.price}`}
                    </span>
                    <a className="details" href={eventLink(event)}>Event details ↗</a>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="cta">
        <div>
          <h2>Have an event in mind?</h2>
          <p>Create an event and bring your people together on VYBE.</p>
        </div>
        <Link className="primary" href="/organize">Create your event ↗</Link>
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} VYBE · Discover experiences. Make memories.
      </footer>
    </main>
  );
}
