"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "../../lib/supabase";

const BUCKET = "event-flyers";

const CATEGORIES = [
  "Music", "Nightlife", "Sports", "Business", "Education",
  "Food & Drink", "Arts & Culture", "Community", "Other",
];

const DEFAULT_FLYERS = [
  {
    name: "Party",
    category: "Nightlife",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Music",
    category: "Music",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Sports",
    category: "Sports",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=85",
  },
];

const inputClass =
  "mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

const cardClass =
  "min-w-0 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-6";

function formatDate(value) {
  if (!value) return "Date and time not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date and time not set"
    : date.toLocaleString();
}

export default function OrganizePage() {
  const router = useRouter();
  const fileInput = useRef(null);
  const objectUrlRef = useRef("");

  const [flyer, setFlyer] = useState(null);
  const [preview, setPreview] = useState("");
  const [template, setTemplate] = useState("");
  const [flyers, setFlyers] = useState(DEFAULT_FLYERS);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [flyerSearch, setFlyerSearch] = useState("");
  const [flyerCategory, setFlyerCategory] = useState("All");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Music");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const [address, setAddress] = useState("");
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [venue, setVenue] = useState("");

  const [ticketMode, setTicketMode] = useState("rsvp");
  const [ticketName, setTicketName] = useState("General Admission");
  const [price, setPrice] = useState("0");
  const [quantity, setQuantity] = useState("100");

  const [organizationName, setOrganizationName] = useState("");
  const [organization, setOrganization] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [section, setSection] = useState("details");
  const [recurring, setRecurring] = useState(false);
  const [limitRsvp, setLimitRsvp] = useState(false);
  const [rsvpLimit, setRsvpLimit] = useState("100");

  useEffect(() => {
    let active = true;

    async function loadTemplates() {
      const all = [...DEFAULT_FLYERS];
      let offset = 0;

      try {
        while (true) {
          const { data, error } = await supabase.storage
            .from(BUCKET)
            .list("templates", {
              limit: 100,
              offset,
              sortBy: { column: "name", order: "asc" },
            });

          if (error || !data?.length) break;

          for (const item of data) {
            if (!item.name || item.name.startsWith(".")) continue;

            const ext = item.name.split(".").pop()?.toLowerCase();

            if (!["jpg", "jpeg", "png", "webp", "avif"].includes(ext)) {
              continue;
            }

            const { data: publicData } = supabase.storage
              .from(BUCKET)
              .getPublicUrl(`templates/${item.name}`);

            if (!publicData?.publicUrl) continue;

            all.push({
              name: item.name
                .replace(/\.[^.]+$/, "")
                .replace(/[-_]+/g, " "),
              category: "Other",
              image: publicData.publicUrl,
            });
          }

          if (data.length < 100) break;
          offset += 100;
        }
      } catch {
        // Default flyers remain available if Storage cannot be reached.
      }

      if (active) setFlyers(all);
    }

    loadTemplates();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadOrg() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (!user) {
          router.replace("/auth");
          return;
        }

        const { data } = await supabase
          .from("organizations")
          .select("id,name,slug")
          .eq("owner_id", user.id)
          .limit(1)
          .maybeSingle();

        if (active && data) {
          setOrganization(data);
          setOrganizationName(data.name);
        }
      } catch {
        // Organization can be loaded or created when saving.
      }
    }

    loadOrg();

    return () => {
      active = false;
    };
  }, [router]);

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

        if (response.ok) {
          const data = await response.json();
          setPlaces(data.features || []);
        }
      } catch (err) {
        if (err.name !== "AbortError") setPlaces([]);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [address, selectedPlace]);

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
    }

    objectUrlRef.current = file ? URL.createObjectURL(file) : "";
    setPreview(objectUrlRef.current);
  }

  function selectTemplate(item) {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    objectUrlRef.current = "";
    setTemplate(item.name);
    setCategory(item.category === "Other" ? category : item.category);
    setFlyer(null);
    setPreview(item.image);
    setGalleryOpen(false);
    setError("");

    if (fileInput.current) fileInput.current.value = "";
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

    if (fileInput.current) fileInput.current.value = "";
  }

  function choosePlace(place) {
    const properties = place.properties || {};
    const coordinates = place.geometry?.coordinates || [];

    const city =
      properties.city ||
      properties.town ||
      properties.village ||
      properties.county ||
      "";

    const label = [
      properties.name,
      properties.street,
      properties.housenumber,
      city,
      properties.state,
      properties.country,
    ]
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index)
      .join(", ");

    setSelectedPlace({
      label,
      city,
      country: properties.country || "",
      latitude: coordinates[1] ?? null,
      longitude: coordinates[0] ?? null,
    });

    setAddress(label);
    setPlaces([]);
  }

  async function saveEvent(event, status = "published") {
    event?.preventDefault?.();

    setError("");
    setNotice("");

    const isDraft = status === "draft";

    if (!title.trim()) {
      setError("Enter an event title.");
      setSection("details");
      return;
    }

    if (!isDraft && !description.trim()) {
      setError("Enter an event description.");
      setSection("details");
      return;
    }

    if (!isDraft && !preview) {
      setError("Choose a flyer or upload a photo.");
      setSection("flyer");
      return;
    }

    if (!isDraft && !selectedPlace) {
      setError("Search for a location and select a suggestion.");
      setSection("location");
      return;
    }

    if (
      !isDraft &&
      (!startsAt || new Date(startsAt) <= new Date())
    ) {
      setError("Choose a future start date and time.");
      setSection("details");
      return;
    }

    if (
      endsAt &&
      startsAt &&
      new Date(endsAt) <= new Date(startsAt)
    ) {
      setError("End time must be after start time.");
      setSection("details");
      return;
    }

    if (
      !isDraft &&
      ticketMode === "sell" &&
      (!ticketName.trim() ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0 ||
        !Number.isInteger(Number(quantity)) ||
        Number(quantity) < 1)
    ) {
      setError("Check ticket name, price, and quantity.");
      setSection("tickets");
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const user = sessionData?.session?.user;

      if (!user) {
        router.replace("/auth");
        return;
      }

      let org = organization;

      if (!org) {
        const name = organizationName.trim();

        if (!name) {
          setSection("additional");
          throw new Error("Enter your organization name.");
        }

        const slugBase =
          name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "organization";

        const { data, error } = await supabase
          .from("organizations")
          .insert({
            owner_id: user.id,
            name,
            slug: slugBase + "-" + Date.now().toString(36),
          })
          .select("id,name,slug")
          .single();

        if (error) {
          throw new Error("Organization: " + error.message);
        }

        org = data;
        setOrganization(data);
      }

      let imageUrl = preview || null;

      if (flyer) {
        const safeName = flyer.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "-"
        );

        const path = `${user.id}/${Date.now()}-${safeName}`;

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, flyer, {
            cacheControl: "3600",
            upsert: false,
            contentType: flyer.type,
          });

        if (error) {
          throw new Error("Flyer upload: " + error.message);
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
          description: description.trim() || "",
          venue: venue.trim() || selectedPlace?.label || null,
          city: selectedPlace?.city || null,
          country: selectedPlace?.country || null,
          location_address: selectedPlace?.label || null,
          latitude: selectedPlace?.latitude ?? null,
          longitude: selectedPlace?.longitude ?? null,
          category,
          starts_at: startsAt
            ? new Date(startsAt).toISOString()
            : null,
          ends_at: endsAt
            ? new Date(endsAt).toISOString()
            : null,
          ticket_mode: ticketMode,
          price: ticketMode === "sell" ? Number(price) : 0,
          currency: "INR",
          image_url: imageUrl,
          slug,
          status,
          organizer_id: user.id,
          organization_id: org.id,
        })
        .select("id")
        .single();

      if (saveError) {
        throw new Error("Event save: " + saveError.message);
      }

      if (!isDraft && ticketMode === "sell") {
        const { error } = await supabase
          .from("event_ticket_types")
          .insert({
            event_id: savedEvent.id,
            name: ticketName.trim(),
            price: Number(price),
            quantity: Number(quantity),
            currency: "INR",
          });

        if (error) {
          await supabase
            .from("events")
            .update({ status: "draft" })
            .eq("id", savedEvent.id)
            .eq("organizer_id", user.id);

          throw new Error(
            "Ticket setup failed; event returned to draft if permitted: " +
              error.message
          );
        }
      }

      if (isDraft) {
        setNotice("Draft saved successfully.");
      } else {
        router.push("/events/" + slug);
      }
    } catch (err) {
      setError(err?.message || "Could not save the event.");
    } finally {
      setLoading(false);
    }
  }

  const visibleFlyers = flyers
    .filter((item) =>
      item.name.toLowerCase().includes(flyerSearch.trim().toLowerCase())
    )
    .filter(
      (item) =>
        flyerCategory === "All" || item.category === flyerCategory
    );

  const sections = [
    { id: "details", label: "Details", icon: "✦" },
    { id: "location", label: "Location", icon: "⌖" },
    { id: "tickets", label: "Tickets", icon: "♧" },
    { id: "flyer", label: "Flyer", icon: "▧" },
    { id: "additional", label: "Organizer", icon: "◎" },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-violet-50 via-white to-pink-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-violet-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-3 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="shrink-0 text-2xl font-black tracking-tight text-violet-700 sm:text-3xl"
          >
            VYBE<span className="text-pink-500">.</span>
          </button>

          <span className="hidden rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700 sm:inline-flex">
            Create Event
          </span>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => router.push("/my-events")}
            className="rounded-xl px-2 py-2 text-xs font-bold text-slate-600 hover:bg-violet-50 sm:px-3 sm:text-sm"
          >
            My Events
          </button>

          <button
            type="button"
            onClick={() => saveEvent(null, "draft")}
            disabled={loading}
            className="rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-xs font-bold text-violet-700 transition hover:bg-violet-50 disabled:opacity-50 sm:px-4 sm:text-sm"
          >
            Save Draft
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-3 py-5 pb-8 sm:px-6 sm:py-8">
        <div className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-pink-500" />
            YOUR NEXT BIG EVENT STARTS HERE
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Create your{" "}
            <span className="bg-gradient-to-r from-violet-700 to-pink-500 bg-clip-text text-transparent">
              event
            </span>
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Add your details, choose a flyer and publish your event on VYBE.
          </p>
        </div>

        <nav className="mb-5 grid grid-cols-5 gap-1 rounded-2xl border border-violet-100 bg-white p-1.5 shadow-sm sm:gap-2 sm:p-2">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`min-w-0 rounded-xl px-1 py-3 text-center transition sm:px-2 ${
                section === item.id
                  ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow-md"
                  : "text-slate-500 hover:bg-violet-50 hover:text-violet-700"
              }`}
            >
              <span className="block text-lg leading-5">{item.icon}</span>
              <span className="mt-1 block truncate text-[10px] font-bold sm:text-xs">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <form
          onSubmit={(event) => saveEvent(event, "published")}
          className="min-w-0 space-y-5"
        >
          {(section === "details") && (
            <section className={cardClass}>
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
                  STEP 01
                </p>
                <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">
                  Event details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tell everyone what your event is about.
                </p>
              </div>

              <label className="block text-sm font-bold">
                Event title <span className="text-pink-500">*</span>
                <input
                  required
                  maxLength={160}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Friday Night Live"
                  className={inputClass}
                />
              </label>

              <label className="mt-4 block text-sm font-bold">
                Description <span className="text-pink-500">*</span>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What should people know about your event?"
                  className={`${inputClass} resize-y`}
                />
              </label>

              <label className="mt-4 block text-sm font-bold">
                Event category
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={inputClass}
                >
                  {CATEGORIES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                <label className="block min-w-0 text-sm font-bold">
                  Start date and time
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(event) => setStartsAt(event.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block min-w-0 text-sm font-bold">
                  End date and time
                  <input
                    type="datetime-local"
                    min={startsAt || undefined}
                    value={endsAt}
                    onChange={(event) => setEndsAt(event.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="mt-5 flex items-start gap-3 rounded-xl bg-violet-50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(event) => setRecurring(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-violet-600"
                />
                <span>
                  <strong className="block">Recurring event</strong>
                  <span className="text-xs text-slate-500">
                    This setting is not saved to the database yet.
                  </span>
                </span>
              </label>

              <button
                type="button"
                onClick={() => setSection("location")}
                className="mt-5 w-full rounded-xl bg-violet-50 px-4 py-3 font-bold text-violet-700 transition hover:bg-violet-100"
              >
                Continue to location →
              </button>
            </section>
          )}

          {section === "location" && (
            <section className={cardClass}>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
                STEP 02
              </p>
              <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">
                Where is it happening?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search for an address and select a matching suggestion.
              </p>

              <label className="mt-5 block text-sm font-bold">
                Search location <span className="text-pink-500">*</span>
                <input
                  value={address}
                  onChange={(event) => {
                    setAddress(event.target.value);
                    setSelectedPlace(null);
                  }}
                  placeholder="Search city, venue or address worldwide"
                  autoComplete="off"
                  className={inputClass}
                />
              </label>

              {places.length > 0 && (
                <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-violet-100 bg-white shadow-lg">
                  {places.map((place, index) => (
                    <button
                      key={place.properties?.osm_id || index}
                      type="button"
                      onClick={() => choosePlace(place)}
                      className="block w-full border-b border-slate-100 p-3 text-left last:border-0 hover:bg-violet-50"
                    >
                      <strong className="block text-sm">
                        {place.properties?.name ||
                          place.properties?.street ||
                          "Location"}
                      </strong>
                      <span className="mt-1 block text-xs text-slate-500">
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
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs font-bold text-emerald-700">
                    LOCATION SELECTED
                  </p>
                  <p className="mt-1 break-words text-sm text-emerald-900">
                    {selectedPlace.label}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlace(null);
                      setAddress("");
                    }}
                    className="mt-2 text-xs font-bold text-emerald-800 underline"
                  >
                    Change location
                  </button>
                </div>
              )}

              <label className="mt-4 block text-sm font-bold">
                Venue name
                <input
                  value={venue}
                  onChange={(event) => setVenue(event.target.value)}
                  placeholder="Venue, club or building name"
                  className={inputClass}
                />
              </label>

              <button
                type="button"
                onClick={() => setSection("tickets")}
                className="mt-5 w-full rounded-xl bg-violet-50 px-4 py-3 font-bold text-violet-700 hover:bg-violet-100"
              >
                Continue to tickets →
              </button>
            </section>
          )}

          {section === "tickets" && (
            <section className={cardClass}>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
                STEP 03
              </p>
              <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">
                Tickets and RSVP
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose how people can attend your event.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setTicketMode("rsvp")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    ticketMode === "rsvp"
                      ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                      : "border-slate-200 hover:border-violet-200"
                  }`}
                >
                  <span className="text-2xl">🎟️</span>
                  <strong className="mt-2 block">Free RSVP</strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    Let people register for free.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTicketMode("sell")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    ticketMode === "sell"
                      ? "border-pink-500 bg-pink-50 ring-2 ring-pink-100"
                      : "border-slate-200 hover:border-pink-200"
                  }`}
                >
                  <span className="text-2xl">💳</span>
                  <strong className="mt-2 block">Sell Tickets</strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    Set a price and ticket quantity.
                  </span>
                </button>
              </div>

              {ticketMode === "sell" && (
                <div className="mt-5 space-y-4 rounded-xl bg-pink-50/70 p-3 sm:p-4">
                  <label className="block text-sm font-bold">
                    Ticket name
                    <input
                      required
                      value={ticketName}
                      onChange={(event) => setTicketName(event.target.value)}
                      className={inputClass}
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-bold">
                      Price (INR)
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        className={inputClass}
                      />
                    </label>

                    <label className="block text-sm font-bold">
                      Quantity
                      <input
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>
                </div>
              )}

              {ticketMode === "rsvp" && (
                <div className="mt-5 rounded-xl bg-violet-50 p-4">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={limitRsvp}
                      onChange={(event) => setLimitRsvp(event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-violet-600"
                    />
                    <span>
                      <strong className="block">Limit RSVPs</strong>
                      <span className="text-xs text-slate-500">
                        Set a maximum number of attendees.
                      </span>
                    </span>
                  </label>

                  {limitRsvp && (
                    <input
                      type="number"
                      min="1"
                      value={rsvpLimit}
                      onChange={(event) => setRsvpLimit(event.target.value)}
                      placeholder="Maximum RSVPs"
                      className={inputClass}
                    />
                  )}

                  <p className="mt-2 text-xs text-slate-500">
                    RSVP limits are not saved to the database yet.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSection("flyer")}
                className="mt-5 w-full rounded-xl bg-violet-50 px-4 py-3 font-bold text-violet-700 hover:bg-violet-100"
              >
                Continue to flyer →
              </button>
            </section>
          )}

          {section === "flyer" && (
            <section className={cardClass}>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
                STEP 04
              </p>
              <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">
                Choose your flyer
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a gallery design or upload your own image.
              </p>

              {preview && (
                <div className="mt-5 overflow-hidden rounded-2xl border border-violet-100 bg-slate-50">
                  <img
                    src={preview}
                    alt="Selected event flyer"
                    className="mx-auto max-h-64 w-full object-contain sm:max-h-80"
                  />
                  <div className="flex items-center gap-3 border-t border-violet-100 bg-white p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {flyer?.name || template || "Selected flyer"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Flyer selected
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeFlyer}
                      className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setGalleryOpen((value) => !value)}
                className="mt-4 w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 font-bold text-violet-700 hover:bg-violet-100"
              >
                {galleryOpen ? "Close flyer gallery ↑" : "Browse flyer gallery ↓"}
              </button>

              {galleryOpen && (
                <div className="mt-4 space-y-3">
                  <input
                    value={flyerSearch}
                    onChange={(event) => setFlyerSearch(event.target.value)}
                    placeholder="Search flyers..."
                    className={inputClass}
                  />

                  <select
                    value={flyerCategory}
                    onChange={(event) => setFlyerCategory(event.target.value)}
                    className={inputClass}
                  >
                    {["All", ...CATEGORIES].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {visibleFlyers.map((item) => (
                      <button
                        key={item.image}
                        type="button"
                        onClick={() => selectTemplate(item)}
                        className="min-w-0 overflow-hidden rounded-xl border border-slate-200 text-left transition hover:border-violet-400 hover:shadow-md"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="h-28 w-full object-cover sm:h-36"
                        />
                        <span className="block truncate p-2 text-xs font-bold sm:text-sm">
                          {item.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  {visibleFlyers.length === 0 && (
                    <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                      No flyers found. Try another search.
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="mt-4 w-full rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/60 p-5 text-sm font-bold text-violet-700 transition hover:bg-violet-100"
              >
                <span className="mb-1 block text-2xl">＋</span>
                Upload your own flyer
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  JPG, PNG or WebP · Maximum 5 MB
                </span>
              </button>

              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                onChange={handleFlyer}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => setSection("additional")}
                className="mt-5 w-full rounded-xl bg-violet-50 px-4 py-3 font-bold text-violet-700 hover:bg-violet-100"
              >
                Continue to organizer →
              </button>
            </section>
          )}

          {section === "additional" && (
            <section className={cardClass}>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
                STEP 05
              </p>
              <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">
                Organizer information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add the organization responsible for this event.
              </p>

              <label className="mt-5 block text-sm font-bold">
                Organization name <span className="text-pink-500">*</span>
                {organization ? (
                  <div className="mt-2 rounded-xl border border-violet-100 bg-violet-50 p-4">
                    <p className="font-bold text-violet-800">
                      {organization.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Linked to your existing organization.
                    </p>
                  </div>
                ) : (
                  <input
                    value={organizationName}
                    onChange={(event) =>
                      setOrganizationName(event.target.value)
                    }
                    placeholder="Your organization name"
                    className={inputClass}
                  />
                )}
              </label>

              <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/70 p-4">
                <p className="text-sm font-bold text-violet-800">
                  Almost ready to publish!
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Check your event details, location, ticket settings and flyer
                  before publishing. Required fields will be validated when
                  you publish.
                </p>
              </div>
            </section>
          )}

          {error && (
            <div
              role="alert"
              className="break-words rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800"
            >
              {error}
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"
            >
              {notice}
            </div>
          )}

          <div className="rounded-2xl border border-violet-100 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={loading}
                onClick={() => saveEvent(null, "draft")}
                className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3.5 text-sm font-bold text-violet-700 transition hover:bg-violet-50 disabled:opacity-50 sm:flex-1"
              >
                {loading ? "Saving..." : "Save Draft"}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-violet-200 transition hover:opacity-95 disabled:opacity-50 sm:flex-[1.4]"
              >
                {loading ? "Please wait..." : "Publish Event →"}
              </button>
            </div>

            <p className="mt-3 text-center text-xs text-slate-400">
              VYBE · Make your next event happen
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
