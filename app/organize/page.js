
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "../../lib/supabase";

const BUCKET = "event-flyers";

const FLYERS = [
  {
    name: "Party",
    category: "Nightlife",
    image:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Music",
    category: "Music",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Sports",
    category: "Sports",
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=700&q=80",
  },
];

export default function OrganizePage() {
  const router = useRouter();

  const [flyer, setFlyer] = useState(null);
  const [preview, setPreview] = useState("");
  const [template, setTemplate] = useState("");
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
  const [organizationName, setOrganizationName] = useState("");
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadOrganization() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) return;

      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setOrganization(data);
        setOrganizationName(data.name);
      }
    }

    loadOrganization();
  }, []);

  useEffect(() => {
    if (address.trim().length < 3 || selectedPlace) {
      setPlaces([]);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          "https://photon.komoot.io/api/?limit=6&q=" +
            encodeURIComponent(address),
          { signal: controller.signal }
        );

        if (!response.ok) return;

        const result = await response.json();
        setPlaces(result.features || []);
      } catch (err) {
        if (err.name !== "AbortError") setPlaces([]);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [address, selectedPlace]);

  function selectTemplate(item) {
    setTemplate(item.name);
    setCategory(item.category);
    setFlyer(null);
    setPreview(item.image);
    setError("");
  }

  function handleFlyer(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    setFlyer(file);
    setTemplate("");
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  function choosePlace(place) {
    const p = place.properties || {};
    const coords = place.geometry?.coordinates || [];
    const city = p.city || p.town || p.village || p.county || "";

    const label = [
      p.name,
      p.street,
      p.housenumber,
      city,
      p.state,
      p.country,
    ]
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(", ");

    setSelectedPlace({
      label,
      city,
      country: p.country || "",
      latitude: coords[1] ?? null,
      longitude: coords[0] ?? null,
    });

    setAddress(label);
    setPlaces([]);
  }

  async function publishEvent(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!preview) return setError("Select a flyer or upload a photo.");
    if (!title.trim() || !description.trim())
      return setError("Enter the event title and description.");
    if (!selectedPlace)
      return setError("Search for a location and select a suggestion.");
    if (!startsAt || new Date(startsAt) <= new Date())
      return setError("Choose a future start date and time.");
    if (endsAt && new Date(endsAt) <= new Date(startsAt))
      return setError("End time must be after start time.");

    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const user = sessionData?.session?.user;

      if (!user) {
        router.push("/auth");
        return;
      }

      // Reuse the existing organization, or create one once.
      let org = organization;

      if (!org) {
        const name = organizationName.trim();

        if (!name) {
          throw new Error("Enter your organization name first.");
        }

        const orgSlug =
          name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") +
          "-" +
          Date.now().toString(36);

        const { data: createdOrg, error: orgError } = await supabase
          .from("organizations")
          .insert({
            owner_id: user.id,
            name,
            slug: orgSlug,
          })
          .select("id, name, slug")
          .single();

        if (orgError) throw new Error("Organization: " + orgError.message);

        org = createdOrg;
        setOrganization(createdOrg);
      }

      let imageUrl = preview;

      if (flyer) {
        const safeName = flyer.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${user.id}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, flyer, {
            cacheControl: "3600",
            upsert: false,
            contentType: flyer.type,
          });

        if (uploadError) throw new Error("Flyer upload: " + uploadError.message);

        imageUrl = supabase.storage.from(BUCKET).getPublicUrl(path)
          .data.publicUrl;
      }

      const slug =
        title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "").slice(0, 55) +
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
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        ticket_mode: ticketMode,
        price: ticketMode === "sell" ? Number(price) : 0,
        currency: "INR",
        image_url: imageUrl,
        slug,
        status: "published",
        organizer_id: user.id,
        organization_id: org.id,
      };

      const { data: savedEvent, error: saveError } = await supabase
        .from("events")
        .insert(eventData)
        .select("id")
        .single();

      if (saveError) throw new Error("Event save: " + saveError.message);

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
          throw new Error("Ticket setup: " + ticketError.message);
        }
      }

      router.push("/events/" + slug);
    } catch (err) {
      setError(err?.message || "Could not publish the event.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full min-w-0 rounded-xl border border-gray-700 bg-neutral-900 p-3 text-white";

  return (
    <main className="min-h-screen bg-black px-4 py-5 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Create an event</h1>
        <p className="mb-5 mt-1 text-sm text-gray-400">
          Create once. Publish more events with your organization.
        </p>

        <form onSubmit={publishEvent} className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-gray-800 p-4">
            <h2 className="font-semibold">Organization</h2>

            {organization ? (
              <p className="rounded-xl bg-neutral-900 p-3">
                Using: <strong>{organization.name}</strong>
              </p>
            ) : (
              <label className="block">
                <span className="mb-2 block text-sm">
                  Organization name *
                </span>
                <input
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Your organization name"
                  className={inputClass}
                />
              </label>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-gray-800 p-4">
            <h2 className="font-semibold">Choose a flyer</h2>

            <div className="grid grid-cols-3 gap-2">
              {FLYERS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => selectTemplate(item)}
                  className={`overflow-hidden rounded-xl border p-1 ${
                    template === item.name
                      ? "border-blue-500"
                      : "border-gray-700"
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-24 w-full rounded-lg object-cover"
                  />
                  <span className="block py-2 text-sm">{item.name}</span>
                </button>
              ))}
            </div>

            <label className="block cursor-pointer rounded-xl border border-dashed border-gray-600 p-3 text-center">
              <span className="text-sm">Or upload your own photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFlyer}
                className="mt-2 block w-full text-sm"
              />
            </label>

            {preview && (
              <div className="flex items-center gap-3 rounded-xl bg-neutral-900 p-3">
                <img
                  src={preview}
                  alt="Selected flyer"
                  className="h-20 w-16 rounded-lg object-cover"
                />
                <div className="text-sm text-gray-300">
                  Flyer selected
                  <button
                    type="button"
                    className="ml-2 text-blue-400"
                    onClick={() => {
                      setPreview("");
                      setFlyer(null);
                      setTemplate("");
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-gray-800 p-4">
            <h2 className="font-semibold">Event details</h2>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event name *"
              className={inputClass}
            />
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description *"
              className={inputClass}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {["Music", "Nightlife", "Sports", "Business", "Education",
                "Food & Drink", "Arts & Culture", "Community", "Other"]
                .map((item) => <option key={item}>{item}</option>)}
            </select>
          </section>

          <section className="space-y-3 rounded-2xl border border-gray-800 p-4">
            <h2 className="font-semibold">Location — worldwide</h2>
            <input
              required
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setSelectedPlace(null);
              }}
              placeholder="Search city, country, address *"
              autoComplete="off"
              className={inputClass}
            />

            {places.map((place, index) => (
              <button
                key={place.properties?.osm_id || index}
                type="button"
                onClick={() => choosePlace(place)}
                className="block w-full rounded-lg border border-gray-800 p-3 text-left"
              >
                <span className="block">
                  {place.properties?.name || place.properties?.street || "Location"}
                </span>
                <span className="text-sm text-gray-400">
                  {[
                    place.properties?.city || place.properties?.town ||
                      place.properties?.village,
                    place.properties?.state,
                    place.properties?.country,
                  ].filter(Boolean).join(", ")}
                </span>
              </button>
            ))}

            {selectedPlace && (
              <p className="text-sm text-green-400">
                Selected: {selectedPlace.label}
              </p>
            )}

            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Venue name (optional)"
              className={inputClass}
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-gray-800 p-4">
            <h2 className="font-semibold">Date and time</h2>
            <label className="block text-sm">
              Starts *
              <input
                required
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              Ends
              <input
                type="datetime-local"
                min={startsAt || undefined}
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className={inputClass}
              />
            </label>
          </section>

          <section className="space-y-3 rounded-2xl border border-gray-800 p-4">
            <h2 className="font-semibold">Tickets</h2>
            <select
              value={ticketMode}
              onChange={(e) => setTicketMode(e.target.value)}
              className={inputClass}
            >
              <option value="rsvp">Free RSVP</option>
              <option value="sell">Sell Tickets</option>
            </select>

            {ticketMode === "sell" && (
              <>
                <input
                  required
                  value={ticketName}
                  onChange={(e) => setTicketName(e.target.value)}
                  placeholder="Ticket name"
                  className={inputClass}
                />
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ticket price (INR)"
                  className={inputClass}
                />
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ticket quantity"
                  className={inputClass}
                />
                <p className="text-xs text-gray-400">
                  Online payments require a payment provider integration.
                </p>
              </>
            )}
          </section>

          {error && (
            <p className="break-words rounded-xl bg-red-950 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 p-4 font-bold disabled:opacity-50"
          >
            {loading ? "Publishing..." : "Publish event"}
          </button>
        </form>
      </div>
    </main>
  );
}

