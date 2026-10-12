
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "../../lib/supabase";

export default function OrganizePage() {
  const router = useRouter();

  const [flyer, setFlyer] = useState(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [venue, setVenue] = useState("");
  const [category, setCategory] = useState("Music");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [ticketMode, setTicketMode] = useState("rsvp");
  const [ticketName, setTicketName] = useState("General Admission");
  const [price, setPrice] = useState("0");
  const [quantity, setQuantity] = useState("100");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Address suggestions using OpenStreetMap-based Photon
  useEffect(() => {
    if (address.trim().length < 3 || selectedPlace) {
      setPlaces([]);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const url =
          "https://photon.komoot.io/api/?limit=5&q=" +
          encodeURIComponent(address);

        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const result = await response.json();
        setPlaces(result.features || []);
      } catch (err) {
        if (err.name !== "AbortError") setPlaces([]);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [address, selectedPlace]);

  function handleFlyer(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file for the flyer.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Flyer must be smaller than 5 MB.");
      return;
    }

    setFlyer(file);
    setPreview(URL.createObjectURL(file));
  }

  function choosePlace(place) {
    const p = place.properties || {};
    const coords = place.geometry?.coordinates || [];

    const label = [
      p.name,
      p.street,
      p.housenumber,
      p.city || p.town || p.village,
      p.state,
      p.country,
    ]
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index)
      .join(", ");

    setSelectedPlace({
      label,
      latitude: coords[1] ?? null,
      longitude: coords[0] ?? null,
      city: p.city || p.town || p.village || p.county || "",
      country: p.country || "",
    });

    setAddress(label);
    setPlaces([]);
  }

  async function publishEvent(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!flyer) {
      setError("Please upload your event flyer first.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Please enter the event title and description.");
      return;
    }

    if (!selectedPlace) {
      setError("Please select an address from the suggestions.");
      return;
    }

    if (!startsAt || new Date(startsAt) <= new Date()) {
      setError("Please select a future event start date and time.");
      return;
    }

    if (
      endsAt &&
      new Date(endsAt) <= new Date(startsAt)
    ) {
      setError("End date and time must be after the start.");
      return;
    }

    if (
      ticketMode === "sell" &&
      (!ticketName.trim() ||
        Number(price) < 0 ||
        price === "" ||
        !Number.isInteger(Number(quantity)) ||
        Number(quantity) < 1)
    ) {
      setError("Enter a valid ticket name, price and quantity.");
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!sessionData.session) {
        setError("Please sign in before creating an event.");
        router.push("/auth");
        return;
      }

      const userId = sessionData.session.user.id;

      const safeFileName = flyer.name
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .slice(-100);

      const filePath =
        userId +
        "/" +
        Date.now() +
        "-" +
        safeFileName;

      const { error: uploadError } = await supabase.storage
        .from("event-flyers")
        .upload(filePath, flyer, {
          cacheControl: "3600",
          upsert: false,
          contentType: flyer.type,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("event-flyers")
        .getPublicUrl(filePath);

      const slug =
        title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 65) +
        "-" +
        Date.now().toString(36);

      const eventData = {
        title: title.trim(),
        description: description.trim(),
        venue: venue.trim() || selectedPlace.label,
        city: selectedPlace.city || null,
        country: selectedPlace.country || null,
        location_address: selectedPlace.label,
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
        category,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt
          ? new Date(endsAt).toISOString()
          : null,
        ticket_mode: ticketMode,
        price: ticketMode === "sell" ? Number(price) : 0,
        currency: "INR",
        image_url: publicData.publicUrl,
        slug,
        status: "published",
      };

      const { data: savedEvent, error: eventError } =
        await supabase
          .from("events")
          .insert(eventData)
          .select("id")
          .single();

      if (eventError) throw eventError;

      if (ticketMode === "sell") {
        const { error: ticketError } = await supabase
          .from("event_ticket_types")
          .insert({
            event_id: savedEvent.id,
            name: ticketName.trim(),
            price: Number(price),
            quantity: Number(quantity),
            currency: "INR",
          });

        if (ticketError) {
          throw new Error(
            "Event saved, but ticket setup failed: " +
              ticketError.message
          );
        }
      }

      setMessage("Event published successfully!");
      router.push("/events/" + slug);
    } catch (err) {
      setError(
        err.message || "Could not publish the event."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold">
          Create your event
        </h1>

        <p className="mb-8 text-gray-400">
          Start with your flyer, add event details and publish.
        </p>

        <form onSubmit={publishEvent} className="space-y-6">
          <section className="rounded-2xl border border-gray-800 bg-neutral-950 p-5">
            <h2 className="mb-4 text-xl font-semibold">
              1. Upload event flyer *
            </h2>

            <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-600 p-5 text-center hover:border-blue-500">
              {preview ? (
                <img
                  src={preview}
                  alt="Event flyer preview"
                  className="max-h-72 rounded-lg object-contain"
                />
              ) : (
                <>
                  <span className="text-lg font-semibold">
                    Upload flyer
                  </span>
                  <span className="mt-2 text-sm text-gray-400">
                    Choose an image, up to 5 MB
                  </span>
                </>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleFlyer}
                className="hidden"
              />
            </label>
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-800 bg-neutral-950 p-5">
            <h2 className="text-xl font-semibold">
              2. Event details
            </h2>

            <label className="block">
              <span className="mb-2 block">Event title *</span>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event name"
                className="w-full rounded-xl bg-white p-4 text-black"
              />
            </label>

            <label className="block">
              <span className="mb-2 block">Description *</span>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people about your event"
                className="w-full rounded-xl bg-white p-4 text-black"
              />
            </label>

            <label className="block">
              <span className="mb-2 block">Category *</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-white p-4 text-black"
              >
                <option>Music</option>
                <option>Nightlife</option>
                <option>Business</option>
                <option>Education</option>
                <option>Food & Drink</option>
                <option>Arts & Culture</option>
                <option>Sports</option>
                <option>Community</option>
                <option>Other</option>
              </select>
            </label>
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-800 bg-neutral-950 p-5">
            <h2 className="text-xl font-semibold">
              3. Location
            </h2>

            <label className="block">
              <span className="mb-2 block">
                Search and select address *
              </span>
              <input
                required
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setSelectedPlace(null);
                }}
                placeholder="Type venue, street or city"
                autoComplete="off"
                className="w-full rounded-xl bg-white p-4 text-black"
              />
            </label>

            {places.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-gray-700">
                {places.map((place, index) => (
                  <button
                    type="button"
                    key={
                      place.properties?.osm_id ||
                      place.properties?.name + index
                    }
                    onClick={() => choosePlace(place)}
                    className="block w-full border-b border-gray-800 p-4 text-left hover:bg-gray-800"
                  >
                    <span className="block font-medium">
                      {place.properties?.name ||
                        place.properties?.street ||
                        "Location"}
                    </span>
                    <span className="mt-1 block text-sm text-gray-400">
                      {[
                        place.properties?.city ||
                          place.properties?.town ||
                          place.properties?.village,
                        place.properties?.state,
                        place.properties?.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedPlace && (
              <p className="rounded-xl bg-green-950 p-3 text-sm text-green-300">
                Selected: {selectedPlace.label}
              </p>
            )}

            <label className="block">
              <span className="mb-2 block">
                Venue name (optional)
              </span>
              <input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Hall, club or venue name"
                className="w-full rounded-xl bg-white p-4 text-black"
              />
            </label>
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-800 bg-neutral-950 p-5">
            <h2 className="text-xl font-semibold">
              4. Date and time
            </h2>

            <label className="block">
              <span className="mb-2 block">
                Start date and time *
              </span>
              <input
                required
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-xl bg-white p-4 text-black"
              />
            </label>

            <label className="block">
              <span className="mb-2 block">
                End date and time
              </span>
              <input
                type="datetime-local"
                value={endsAt}
                min={startsAt || undefined}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full rounded-xl bg-white p-4 text-black"
              />
            </label>
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-800 bg-neutral-950 p-5">
            <h2 className="text-xl font-semibold">
              5. Tickets and registration
            </h2>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-700 p-4">
              <input
                type="radio"
                name="ticketMode"
                value="sell"
                checked={ticketMode === "sell"}
                onChange={() => setTicketMode("sell")}
                className="mt-1"
              />
              <span>
                <strong className="block">Sell Tickets</strong>
                <span className="text-sm text-gray-400">
                  Set a ticket price and available quantity.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-700 p-4">
              <input
                type="radio"
                name="ticketMode"
                value="rsvp"
                checked={ticketMode === "rsvp"}
                onChange={() => setTicketMode("rsvp")}
                className="mt-1"
              />
              <span>
                <strong className="block">Free RSVP</strong>
                <span className="text-sm text-gray-400">
                  Let guests register for free.
                </span>
              </span>
            </label>

            {ticketMode === "sell" && (
              <div className="space-y-4 rounded-xl bg-gray-900 p-4">
                <label className="block">
                  <span className="mb-2 block">Ticket name *</span>
                  <input
                    required
                    value={ticketName}
                    onChange={(e) => setTicketName(e.target.value)}
                    placeholder="General Admission"
                    className="w-full rounded-xl bg-white p-3 text-black"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block">
                    Ticket price (INR) *
                  </span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl bg-white p-3 text-black"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block">
                    Number of tickets *
                  </span>
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full rounded-xl bg-white p-3 text-black"
                  />
                </label>

                <p className="text-sm text-gray-400">
                  This saves ticket details. Online payment and
                  attendee ticket checkout need a payment integration.
                </p>
              </div>
            )}

            {ticketMode === "rsvp" && (
              <p className="rounded-xl bg-gray-900 p-4 text-sm text-gray-300">
                This creates a free RSVP event. The attendee
                registration form must be connected separately
                before guests can submit RSVPs.
              </p>
            )}
          </section>

          {error && (
            <p className="break-words rounded-xl bg-red-950 p-4 text-red-300">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-xl bg-green-950 p-4 text-green-300">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 p-5 text-lg font-bold text-white disabled:opacity-50"
          >
            {loading ? "Publishing..." : "Publish event"}
          </button>
        </form>
      </div>
    </main>
  );
}

