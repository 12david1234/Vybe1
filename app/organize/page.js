"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "../../lib/supabase";

const BUCKET = "event-flyers";

const FLYERS = [
  {
    name: "Party",
    category: "Nightlife",
    image:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Music",
    category: "Music",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Sports",
    category: "Sports",
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=85",
  },
];

const CATEGORIES = [
  "Music",
  "Nightlife",
  "Sports",
  "Business",
  "Education",
  "Food & Drink",
  "Arts & Culture",
  "Community",
  "Other",
];

export default function OrganizePage() {
  const router = useRouter();
  const fileInput = useRef(null);

  const [step, setStep] = useState(1);
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
  const [ticketName, setTicketName] =
    useState("General Admission");
  const [price, setPrice] = useState("0");
  const [quantity, setQuantity] = useState("100");

  const [organizationName, setOrganizationName] = useState("");
  const [organization, setOrganization] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrganization() {
      const { data: sessionData } =
        await supabase.auth.getSession();

      const user = sessionData?.session?.user;

      if (!user || !active) return;

      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!error && data && active) {
        setOrganization(data);
        setOrganizationName(data.name);
      }
    }

    loadOrganization();

    return () => {
      active = false;
    };
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
        if (err.name !== "AbortError") {
          setPlaces([]);
        }
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
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      event.target.value = "";
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

    const city =
      p.city || p.town || p.village || p.county || "";

    const label = [
      p.name,
      p.street,
      p.housenumber,
      city,
      p.state,
      p.country,
    ]
      .filter(Boolean)
      .filter((value, index, arr) =>
        arr.indexOf(value) === index
      )
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

    if (!preview) {
      setStep(2);
      return setError("Choose a flyer or upload a photo.");
    }

    if (!title.trim() || !description.trim()) {
      return setError("Enter event title and description.");
    }

    if (!selectedPlace) {
      return setError("Search for a location and select a suggestion.");
    }

    if (!startsAt || new Date(startsAt) <= new Date()) {
      return setError("Choose a future start date and time.");
    }

    if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
      return setError("End time must be after start time.");
    }

    if (
      ticketMode === "sell" &&
      (!ticketName.trim() ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0 ||
        !Number.isInteger(Number(quantity)) ||
        Number(quantity) < 1)
    ) {
      return setError("Check ticket name, price, and quantity.");
    }

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

      let org = organization;

      if (!org) {
        const name = organizationName.trim();

        if (!name) {
          setStep(1);
          throw new Error("Enter your organization name first.");
        }

        const base =
          name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "organization";

        const { data, error: orgError } = await supabase
          .from("organizations")
          .insert({
            owner_id: user.id,
            name,
            slug: base + "-" + Date.now().toString(36),
          })
          .select("id, name, slug")
          .single();

        if (orgError) {
          throw new Error("Organization: " + orgError.message);
        }

        org = data;
        setOrganization(data);
      }

      let imageUrl = preview;

      if (flyer) {
        const safe = flyer.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${user.id}/${Date.now()}-${safe}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, flyer, {
            cacheControl: "3600",
            upsert: false,
            contentType: flyer.type,
          });

        if (uploadError) {
          throw new Error("Flyer upload: " + uploadError.message);
        }

        imageUrl = supabase.storage
          .from(BUCKET)
          .getPublicUrl(path).data.publicUrl;
      }

      const base =
        title.trim().toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 55) || "event";

      const slug = base + "-" + Date.now().toString(36);

      const { data: savedEvent, error: saveError } = await supabase
        .from("events")
        .insert({
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
          image_url: imageUrl,
          slug,
          status: "published",
          organizer_id: user.id,
          organization_id: org.id,
        })
        .select("id")
        .single();

      if (saveError) {
        throw new Error("Event save: " + saveError.message);
      }

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
              ticketError.message +
              ". Avoid publishing again until this is fixed."
          );
        }
      }

      router.push("/events/" + slug);
    } catch (err) {
      setError(err?.message || "Could not publish the event.");
    } finally {
      setLoading(false);
    }
    const input =
    "w-full min-w-0 rounded-xl border border-gray-700 bg-neutral-900 p-3 text-white focus:border-blue-500 focus:outline-none";

  const stepNames = ["Tickets", "Flyer", "Event details"];

  return (
    <main className="min-h-screen bg-black px-4 py-5 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
          VYBE · EVENT CREATOR
        </p>

        <h1 className="mt-2 text-3xl font-bold">Create an event</h1>
        <p className="mb-6 mt-1 text-sm text-gray-400">
          Create, customize and publish your event.
        </p>

        <div className="mb-6 grid grid-cols-3 gap-2">
          {stepNames.map((name, i) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setError("");
                setStep(i + 1);
              }}
              className={`rounded-xl border px-2 py-3 text-sm font-semibold ${
                step === i + 1
                  ? "border-blue-500 bg-blue-950 text-white"
                  : step > i + 1
                    ? "border-green-700 bg-green-950/40 text-green-300"
                    : "border-gray-800 bg-neutral-950 text-gray-400"
              }`}
            >
              {step > i + 1 ? "✓" : `${i + 1}.`} {name}
            </button>
          ))}
        </div>

        <form onSubmit={publishEvent} className="space-y-5">
          {step === 1 && (
            <section className="space-y-4 rounded-2xl border border-gray-800 bg-neutral-950 p-4">
              <h2 className="text-lg font-semibold">Choose ticket type</h2>

              <button
                type="button"
                onClick={() => setTicketMode("rsvp")}
                className={`w-full rounded-2xl border p-4 text-left ${
                  ticketMode === "rsvp"
                    ? "border-blue-500 bg-blue-950/50"
                    : "border-gray-800 bg-neutral-900"
                }`}
              >
                <b className="block">Free RSVP</b>
                <span className="text-sm text-gray-400">
                  Guests reserve a place for free.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTicketMode("sell")}
                className={`w-full rounded-2xl border p-4 text-left ${
                  ticketMode === "sell"
                    ? "border-blue-500 bg-blue-950/50"
                    : "border-gray-800 bg-neutral-900"
                }`}
              >
                <b className="block">Sell Tickets</b>
                <span className="text-sm text-gray-400">
                  Set ticket price and quantity.
                </span>
              </button>

              {ticketMode === "sell" && (
                <div className="space-y-3 rounded-xl border border-gray-800 p-3">
                  <input
                    required
                    value={ticketName}
                    onChange={(e) => setTicketName(e.target.value)}
                    placeholder="Ticket name"
                    className={input}
                  />
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Price (INR)"
                    className={input}
                  />
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Quantity"
                    className={input}
                  />
                  <p className="text-xs text-gray-400">
                    Online payments need a payment provider integration.
                  </p>
                </div>
              )}

              <label className="block text-sm">
                Organization name
                {organization ? (
                  <div className="mt-1 rounded-xl bg-neutral-900 p-3">
                    {organization.name}
                  </div>
                ) : (
                  <input
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Your organization name"
                    className={`${input} mt-1`}
                  />
                )}
              </label>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(2);
                }}
                className="w-full rounded-xl bg-blue-600 p-4 font-bold"
              >
                Continue to flyer →
              </button>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4 rounded-2xl border border-gray-800 bg-neutral-950 p-4">
              <h2 className="text-lg font-semibold">
                Choose your event flyer
              </h2>
              <p className="text-sm text-gray-400">
                Select a sample or upload your own. Preview appears immediately.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {FLYERS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => selectTemplate(item)}
                    className={`overflow-hidden rounded-xl border text-left ${
                      template === item.name
                        ? "border-blue-500 ring-2 ring-blue-500/30"
                        : "border-gray-700"
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-28 w-full object-cover"
                    />
                    <span className="block p-2 text-sm">{item.name}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="w-full rounded-xl border border-dashed border-gray-600 p-5 text-center"
              >
                <span className="block text-lg">＋ Upload your flyer</span>
                <span className="text-sm text-gray-400">
                  JPG, PNG, WEBP · max 5 MB
                </span>
              </button>

              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                onChange={handleFlyer}
                className="hidden"
              />

              {preview && (
                <div className="rounded-xl border border-gray-800 bg-neutral-900 p-3">
                  <div className="mb-3 flex justify-between">
                    <b>Flyer preview</b>
                    <button
                      type="button"
                      onClick={() => {
                        setPreview("");
                        setFlyer(null);
                        setTemplate("");
                        if (fileInput.current) fileInput.current.value = "";
                      }}
                      className="text-sm text-red-300"
                    >
                      Remove
                    </button>
                  </div>

                  <img
                    src={preview}
                    alt="Flyer preview"
                    className="mx-auto max-h-[360px] max-w-full rounded-lg object-contain"
                  />

                  <p className="mt-2 text-center text-xs text-gray-400">
                    {flyer ? flyer.name : `${template} sample flyer`}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep(1);
                  }}
                  className="w-1/3 rounded-xl border border-gray-700 p-4"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!preview) {
                      setError("Choose a flyer or upload your own image.");
                      return;
                    }
                    setError("");
                    setStep(3);
                  }}
                  className="flex-1 rounded-xl bg-blue-600 p-4 font-bold"
                >
                  Continue to details →
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <>
              <section className="space-y-3 rounded-2xl border border-gray-800 bg-neutral-950 p-4">
                <h2 className="text-lg font-semibold">
                  Event details & description
                </h2>

                {preview && (
                  <div className="flex items-center gap-3 rounded-xl bg-neutral-900 p-3">
                    <img
                      src={preview}
                      alt="Flyer thumbnail"
                      className="h-16 w-12 rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-sm text-blue-400"
                    >
                      Change flyer
                    </button>
                  </div>
                )}

                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event name *"
                  className={input}
                />

                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event description *"
                  className={input}
                />

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={input}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </section>

              <section className="space-y-3 rounded-2xl border border-gray-800 bg-neutral-950 p-4">
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
                  className={input}
                />

                {places.map((place, i) => (
                  <button
                    key={place.properties?.osm_id || i}
                    type="button"
                    onClick={() => choosePlace(place)}
                    className="block w-full rounded-lg border border-gray-800 p-3 text-left"
                  >
                    <span className="block">
                      {place.properties?.name ||
                        place.properties?.street ||
                        "Location"}
                    </span>
                    <span className="text-sm text-gray-400">
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

                {selectedPlace && (
                  <p className="text-sm text-green-400">
                    Selected: {selectedPlace.label}
                  </p>
                )}

                <input
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Venue name (optional)"
                  className={input}
                />
              </section>

              <section className="space-y-3 rounded-2xl border border-gray-800 bg-neutral-950 p-4">
                <h2 className="font-semibold">Date and time</h2>

                <label className="block text-sm">
                  Starts *
                  <input
                    required
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className={`${input} mt-1`}
                  />
                </label>

                <label className="block text-sm">
                  Ends
                  <input
                    type="datetime-local"
                    min={startsAt || undefined}
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className={`${input} mt-1`}
                  />
                </label>
              </section>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep(2);
                  }}
                  className="w-1/3 rounded-xl border border-gray-700 p-4"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-blue-600 p-4 font-bold disabled:opacity-50"
                >
                  {loading ? "Publishing..." : "Publish event"}
                </button>
              </div>
            </>
          )}

          {error && (
            <p className="break-words rounded-xl bg-red-950 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
  
