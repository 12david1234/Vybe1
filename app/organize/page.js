
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

const inputClass =
  "w-full min-w-0 rounded-xl border border-violet-100 bg-white p-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

export default function OrganizePage() {
  const router = useRouter();
  const fileInput = useRef(null);
  const objectUrlRef = useRef("");

  const [step, setStep] = useState(1);
  const [flyer, setFlyer] = useState(null);
  const [preview, setPreview] = useState("");
  const [template, setTemplate] = useState("");

  const [flyerTemplates, setFlyerTemplates] = useState(FLYERS);
  const [flyerSearch, setFlyerSearch] = useState("");
  const [flyerCategory, setFlyerCategory] = useState("All");
  const [templatesLoading, setTemplatesLoading] = useState(true);

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

  // Load all available flyer templates from Supabase Storage.
  useEffect(() => {
    let active = true;

    async function loadFlyerTemplates() {
      setTemplatesLoading(true);

      const all = [...FLYERS];
      const pageSize = 100;
      let offset = 0;

      try {
        while (true) {
          const { data, error: listError } = await supabase.storage
            .from(BUCKET)
            .list("templates", {
              limit: pageSize,
              offset,
              sortBy: { column: "name", order: "asc" },
            });

          if (listError || !data?.length) break;

          for (const item of data) {
            if (!item.name || item.name.startsWith(".")) continue;

            const ext = item.name.split(".").pop()?.toLowerCase();

            if (!["jpg", "jpeg", "png", "webp", "avif"].includes(ext)) {
              continue;
            }

            const path = `templates/${item.name}`;

            const { data: publicData } = supabase.storage
              .from(BUCKET)
              .getPublicUrl(path);

            if (
              !publicData?.publicUrl ||
              all.some((item) => item.image === publicData.publicUrl)
            ) {
              continue;
            }

            const name = item.name
              .replace(/\.[^.]+$/, "")
              .replace(/[-_]+/g, " ")
              .trim();

            const normalized = name.toLowerCase();

            const matchedCategory =
              CATEGORIES.find((itemCategory) =>
                normalized.includes(
                  itemCategory.toLowerCase().replace(/ & /g, " ")
                )
              ) || "Other";

            all.push({
              name: name || item.name,
              category: matchedCategory,
              image: publicData.publicUrl,
            });
          }

          if (data.length < pageSize) break;

          offset += pageSize;
        }
      } catch {
        // Built-in templates remain available if storage listing fails.
      }

      if (active) {
        setFlyerTemplates(all);
        setTemplatesLoading(false);
      }
    }

    loadFlyerTemplates();

    return () => {
      active = false;
    };
  }, []);

  // Load the signed-in user's organization.
  useEffect(() => {
    let active = true;

    async function loadOrganization() {
      try {
        const { data: sessionData } =
          await supabase.auth.getSession();

        const user = sessionData?.session?.user;

        if (!user || !active) return;

        const { data, error: orgError } = await supabase
          .from("organizations")
          .select("id, name, slug")
          .eq("owner_id", user.id)
          .limit(1)
          .maybeSingle();

        if (!orgError && data && active) {
          setOrganization(data);
          setOrganizationName(data.name);
        }
      } catch {
        // Organization name can be entered manually.
      }
    }

    loadOrganization();

    return () => {
      active = false;
    };
  }, []);

  // Worldwide address autocomplete.
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

  // Clean up temporary uploaded-image previews.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function setLocalPreview(file) {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    if (file) {
      objectUrlRef.current = URL.createObjectURL(file);
      setPreview(objectUrlRef.current);
    } else {
      setPreview("");
    }
  }

  function selectTemplate(item) {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

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
      setError("Please choose an image file.");
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
    setLocalPreview(file);
    setError("");
  }

  function removeFlyer() {
    setFlyer(null);
    setTemplate("");
    setLocalPreview(null);

    if (fileInput.current) {
      fileInput.current.value = "";
    }
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
      .filter((value, index, array) => array.indexOf(value) === index)
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
      setError("Choose a flyer or upload a photo.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Enter event title and description.");
      return;
    }

    if (!selectedPlace) {
      setError("Search for a location and select a suggestion.");
      return;
    }

    if (!startsAt || new Date(startsAt) <= new Date()) {
      setError("Choose a future start date and time.");
      return;
    }

    if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setError("End time must be after start time.");
      return;
    }

    if (
      ticketMode === "sell" &&
      (!ticketName.trim() ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0 ||
        !Number.isInteger(Number(quantity)) ||
        Number(quantity) < 1)
    ) {
      setError("Check ticket name, price, and quantity.");
      return;
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
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
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
        title
          .trim()
          .toLowerCase()
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
  }

  const stepNames = ["Tickets", "Flyer", "Event details"];

  const visibleFlyers = flyerTemplates
    .filter((item) =>
      item.name.toLowerCase().includes(flyerSearch.trim().toLowerCase())
    )
    .filter(
      (item) =>
        flyerCategory === "All" || item.category === flyerCategory
    );

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-pink-50 px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 rounded-3xl border border-violet-100 bg-white/95 p-5 shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-600">
            VYBE · EVENT CREATOR
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Create an event
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Bring people together. Create, customize and publish your event.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {stepNames.map((name, index) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setError("");
                  setStep(index + 1);
                }}
                className={`rounded-xl border px-2 py-3 text-xs font-bold transition sm:text-sm ${
                  step === index + 1
                    ? "border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-200"
                    : step > index + 1
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-violet-100 bg-white text-slate-500 hover:border-violet-300"
                }`}
              >
                {step > index + 1 ? "✓ " : `${index + 1}. `}
                {name}
              </button>
            ))}
          </div>
        </header>

        <form onSubmit={publishEvent} className="space-y-5">
          {step === 1 && (
            <section className="space-y-4 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
              <div>
                <h2 className="text-xl font-bold">Choose ticket type</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select free registration or set up ticket details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTicketMode("rsvp")}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  ticketMode === "rsvp"
                    ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                    : "border-slate-200 bg-white hover:border-violet-200"
                }`}
              >
                <b className="block text-slate-900">Free RSVP</b>
                <span className="mt-1 block text-sm text-slate-500">
                  Guests can reserve a place for free.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTicketMode("sell")}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  ticketMode === "sell"
                    ? "border-pink-500 bg-pink-50 ring-2 ring-pink-100"
                    : "border-slate-200 bg-white hover:border-pink-200"
                }`}
              >
                <b className="block text-slate-900">Sell Tickets</b>
                <span className="mt-1 block text-sm text-slate-500">
                  Define ticket price and quantity.
                </span>
              </button>

              {ticketMode === "sell" && (
                <div className="space-y-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
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
                    placeholder="Price (INR)"
                    className={inputClass}
                  />

                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Quantity"
                    className={inputClass}
                  />

                  <p className="text-xs text-slate-500">
                    Online payments require a payment provider integration.
                  </p>
                </div>
              )}

              <label className="block text-sm font-semibold text-slate-700">
                Organization name

                {organization ? (
                  <div className="mt-2 rounded-xl border border-violet-100 bg-violet-50 p-3 font-medium">
                    {organization.name}
                  </div>
                ) : (
                  <input
                    required
                    value={organizationName}
                    onChange={(e) =>
                      setOrganizationName(e.target.value)
                    }
                    placeholder="Your organization name"
                    className={`${inputClass} mt-2 font-normal`}
                  />
                )}
              </label>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(2);
                }}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 p-4 font-bold text-white shadow-lg shadow-violet-100 transition hover:brightness-105"
              >
                Continue to flyer →
              </button>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-5 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
              <div>
                <h2 className="text-xl font-bold">Choose your event flyer</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Browse the gallery or upload your own. Add more templates
                  in Supabase Storage.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="search"
                  value={flyerSearch}
                  onChange={(e) => setFlyerSearch(e.target.value)}
                  placeholder="Search all flyers..."
                  aria-label="Search flyer templates"
                  className={inputClass}
                />

                <select
                  value={flyerCategory}
                  onChange={(e) => setFlyerCategory(e.target.value)}
                  aria-label="Filter flyer category"
                  className={inputClass}
                >
                  {["All", ...CATEGORIES].map((name) => (
                    <option key={name} value={name}>
                      {name === "All" ? "All flyer categories" : name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {visibleFlyers.map((item) => (
                  <button
                    key={item.image}
                    type="button"
                    onClick={() => selectTemplate(item)}
                    className={`overflow-hidden rounded-2xl border bg-white text-left transition ${
                      template === item.name
                        ? "border-violet-500 ring-2 ring-violet-200"
                        : "border-slate-200 hover:border-violet-300"
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="h-28 w-full object-cover sm:h-32"
                    />

                    <span className="block truncate p-2 text-sm font-semibold text-slate-700">
                      {item.name}
                    </span>

                    <span className="block px-2 pb-2 text-xs text-slate-400">
                      {item.category}
                    </span>
                  </button>
                ))}
              </div>

              {templatesLoading && (
                <p className="text-sm text-slate-500">
                  Loading flyer gallery…
                </p>
              )}

              {!templatesLoading && visibleFlyers.length === 0 && (
                <p className="rounded-xl bg-violet-50 p-4 text-center text-sm text-slate-600">
                  No flyers match your search. Try another category or
                  upload your own.
                </p>
              )}

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-5 text-center transition hover:border-violet-400 hover:bg-violet-50"
              >
                <span className="block text-lg font-bold text-violet-700">
                  ＋ Upload your flyer
                </span>

                <span className="mt-1 block text-sm text-slate-500">
                  JPG, PNG, WEBP or AVIF · max 5 MB
                </span>
              </button>

              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFlyer}
                className="hidden"
              />

              {preview && (
                <div className="rounded-2xl border border-violet-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <b className="text-slate-800">Flyer preview</b>

                    <button
                      type="button"
                      onClick={removeFlyer}
                      className="text-sm font-semibold text-rose-600"
                    >
                      Remove
                    </button>
                  </div>

                  <img
                    src={preview}
                    alt="Selected event flyer preview"
                    className="mx-auto max-h-64 max-w-full rounded-xl object-contain sm:max-h-80"
                  />

                  <p className="mt-2 break-words text-center text-xs text-slate-500">
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
                  className="w-1/3 rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 hover:bg-slate-50"
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
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 p-4 font-bold text-white"
                >
                  Continue to details →
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <>
              <section className="space-y-4 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-bold">
                  Event details & description
                </h2>

                {preview && (
                  <div className="flex items-center gap-3 rounded-xl bg-violet-50 p-3">
                    <img
                      src={preview}
                      alt="Flyer thumbnail"
                      className="h-16 w-12 rounded-lg object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-sm font-semibold text-violet-700"
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
                  {CATEGORIES.map((itemCategory) => (
                    <option key={itemCategory} value={itemCategory}>
                      {itemCategory}
                    </option>
                  ))}
                </select>
              </section>

              <section className="space-y-4 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-bold">
                  Location — worldwide
                </h2>

                <input
                  required
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setSelectedPlace(null);
                  }}
                  placeholder="Search city, country or address *"
                  autoComplete="off"
                  className={inputClass}
                />

                {places.map((place, index) => (
                  <button
                    key={
                      place.properties?.osm_id ||
                      `${place.properties?.name || "place"}-${index}`
                    }
                    type="button"
                    onClick={() => choosePlace(place)}
                    className="block w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-violet-300 hover:bg-violet-50"
                  >
                    <span className="block font-semibold text-slate-800">
                      {place.properties?.name ||
                        place.properties?.street ||
                        "Location"}
                    </span>

                    <span className="mt-1 block text-sm text-slate-500">
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
                  <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
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

              <section className="space-y-4 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-bold">Date and time</h2>

                <label className="block text-sm font-semibold text-slate-700">
                  Starts *
                  <input
                    required
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className={`${inputClass} mt-2 font-normal`}
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Ends
                  <input
                    type="datetime-local"
                    min={startsAt || undefined}
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className={`${inputClass} mt-2 font-normal`}
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
                  className="w-1/3 rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 p-4 font-bold text-white shadow-lg shadow-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Publishing..." : "Publish event"}
                </button>
              </div>
            </>
          )}

          {error && (
            <p
              role="alert"
              className="break-words rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            >
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
