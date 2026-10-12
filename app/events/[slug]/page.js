"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "../../../lib/supabase";

export default function EventPage() {
  const params = useParams();
  const slug = params?.slug;
  const router = useRouter();

  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;

    async function loadEvent() {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setError("Event not found.");
        } else {
          setEvent(data);
        }
      } catch (err) {
        setError(err?.message || "Could not load event.");
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [slug]);

  async function copyEventLink() {
    const link = window.location.href;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      window.prompt("Copy your event link:", link);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        Loading event...
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        <h1 className="text-2xl font-bold">Event unavailable</h1>
        <p className="mt-3 break-words text-gray-300">
          {error || "Event not found."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold"
        >
          Back to home
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <article className="mx-auto max-w-lg">
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title || "Event flyer"}
            className="mb-5 max-h-64 w-full rounded-2xl object-contain"
          />
        )}

        <p className="text-sm text-blue-400">
          {event.category || "Event"}
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          {event.title}
        </h1>

        <p className="mt-4 whitespace-pre-wrap text-gray-300">
          {event.description}
        </p>

        <div className="mt-6 space-y-3 rounded-2xl border border-gray-800 p-4">
          <p>
            <strong>Venue:</strong>{" "}
            {event.venue || event.location_address || "Not specified"}
          </p>

          <p>
            <strong>Location:</strong>{" "}
            {[event.city, event.country].filter(Boolean).join(", ") ||
              event.location_address ||
              "Not specified"}
          </p>

          <p>
            <strong>Starts:</strong>{" "}
            {event.starts_at
              ? new Date(event.starts_at).toLocaleString()
              : event.start_at
                ? new Date(event.start_at).toLocaleString()
                : "Not specified"}
          </p>

          <p>
            <strong>Ends:</strong>{" "}
            {event.ends_at
              ? new Date(event.ends_at).toLocaleString()
              : "Not specified"}
          </p>

          <p>
            <strong>Registration:</strong>{" "}
            {event.ticket_mode === "sell"
              ? `Paid ticket · ₹${event.price}`
              : "Free RSVP"}
          </p>
        </div>

        <button
          type="button"
          onClick={copyEventLink}
          className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-4 font-semibold"
        >
          {copied ? "Link copied!" : "Copy event link"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/organize")}
          className="mt-3 w-full rounded-xl border border-gray-700 px-5 py-4 font-semibold"
        >
          Create another event
        </button>

        <button
          type="button"
          onClick={() => router.push("/discover")}
          className="mt-3 w-full rounded-xl border border-gray-700 px-5 py-4"
        >
          Discover events
        </button>
      </article>
    </main>
  );
}
