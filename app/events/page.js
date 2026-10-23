
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser as supabase } from "../../lib/supabase";

function formatEventDate(value) {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        const { data, error: queryError } = await supabase
          .from("events")
          .select("*")
          .eq("status", "published")
          .order("starts_at", { ascending: true });

        if (queryError) throw queryError;
        if (active) setEvents(data || []);
      } catch (err) {
        if (active) {
          setError("Events could not be loaded. Please try again later.");
          console.error("Events page error:", err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEvents();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-3xl font-black text-violet-700">
            VYBE<span className="text-pink-500">.</span>
          </Link>
          <Link
            href="/organize"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-3 font-bold text-white"
          >
            + Create Event
          </Link>
        </header>

        <h1 className="text-3xl font-black sm:text-4xl">
          Explore Events
        </h1>
        <p className="mt-2 text-slate-600">
          Discover upcoming events, parties, concerts and experiences.
        </p>

        {loading ? (
          <p className="mt-8 rounded-2xl bg-white p-6">Loading events...</p>
        ) : error ? (
          <p className="mt-8 rounded-2xl bg-white p-6 text-red-600">
            {error}
          </p>
        ) : events.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-violet-100 bg-white p-8 text-center">
            <h2 className="text-xl font-bold">No published events yet</h2>
            <p className="mt-2 text-slate-600">
              Check back soon for new events.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id || event.slug}
                href={event.slug ? `/events/${event.slug}` : "/events"}
                className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title || "Event flyer"}
                    className="h-52 w-full bg-violet-50 object-cover"
                  />
                ) : (
                  <div className="grid h-52 place-items-center bg-gradient-to-br from-violet-200 to-pink-200 text-4xl">
                    ✦
                  </div>
                )}

                <div className="p-5">
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                    {event.category || "Event"}
                  </span>
                  <h2 className="mt-3 text-xl font-black">
                    {event.title || "Untitled event"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {[
                      event.city,
                      event.country,
                    ].filter(Boolean).join(", ") || "Location to be announced"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {formatEventDate(event.starts_at || event.start_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <footer className="mt-12 border-t border-violet-100 pt-6">
          <Link href="/" className="font-bold text-violet-700">
            ← Back to Home
          </Link>
        </footer>
      </div>
    </main>
  );
}
