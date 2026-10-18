
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
  "mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

function formatDate(value) {
  if (!value) return "Date and time not set";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Date and time not set";

  return d.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
  const [templatesLoading, setTemplatesLoading] = useState(true);

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
  const [previewMode, setPreviewMode] = useState("desktop");
  const [recurring, setRecurring] = useState(false);
  const [limitRsvp, setLimitRsvp] = useState(false);
  const [rsvpLimit, setRsvpLimit] = useState("100");

  // Load flyer templates from Supabase Storage.
  useEffect(() => {
    let active = true;

    async function loadTemplates() {
      const all = [...DEFAULT_FLYERS];
      let offset = 0;

      try {
        while (true) {
          const { data, error: listError } = await supabase.storage
            .from(BUCKET)
            .list("templates", {
              limit: 100,
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

            const { data: publicData } = supabase.storage
              .from(BUCKET)
              .getPublicUrl(`templates/${item.name}`);

            if (
              !publicData?.publicUrl ||
              all.some((x) => x.image === publicData.publicUrl)
            ) {
              continue;
            }

            const name = item.name
              .replace(/\.[^.]+$/, "")
              .replace(/[-_]+/g, " ")
              .trim();

            const norm = name.toLowerCase();

            const matched =
              CATEGORIES.find((c) =>
                norm.includes(c.toLowerCase().replace(/ & /g, " "))
              ) || "Other";

            all.push({
              name: name || item.name,
              category: matched,
              image: publicData.publicUrl,
            });
          }

          if (data.length < 100) break;
          offset += 100;
        }
      } catch {
        // Built-in flyer templates remain available.
      }

      if (active) {
        setFlyers(all);
        setTemplatesLoading(false);
      }
    }

    loadTemplates();

    return () => {
      active = false;
    };
  }, []);

  // Load signed-in user's organization.
  useEffect(() => {
    let active = true;

    async function loadOrg() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
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
        // Organization can be entered manually.
      }
    }

    loadOrg();

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
    setGalleryOpen(false);
    setError("");
  }

  function handleFlyer(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      e.target.value = "";
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

  async function saveEvent(e, status = "published") {
    if (e?.preventDefault) e.preventDefault();

    setError("");
    setNotice("");

    if (!title.trim() || !description.trim()) {
      setError("Enter event title and description.");
      setSection("details");
      return;
    }

    if (status === "published" && !preview) {
      setError("Choose a flyer or upload a photo.");
      setSection("details");
      return;
    }

    if (!selectedPlace) {
      setError("Search for a location and select a suggestion.");
      setSection("location");
      return;
    }

    if (
      status === "published" &&
      (!startsAt || new Date(startsAt) <= new Date())
    ) {
      setError("Choose a future start date and time.");
      setSection("details");
      return;
    }

    if (endsAt && startsAt && new Date(endsAt) <= new Date(startsAt)) {
      setError("End time must be after start time.");
      setSection("details");
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
        router.push("/auth");
        return;
      }

      let org = organization;

      if (!org) {
        const name = organizationName.trim();

        if (!name) {
          setSection("additional");
          throw new Error("Enter your organization name.");
        }

        const baseOrg =
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "organization";

        const { data, error: orgError } = await supabase
          .from("organizations")
          .insert({
            owner_id: user.id,
            name,
            slug: baseOrg + "-" + Date.now().toString(36),
          })
          .select("id, name, slug")
          .single();

        if (orgError) {
          throw new Error("Organization: " + orgError.message);
        }

        org = data;
        setOrganization(data);
      }

      let imageUrl = preview || null;

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
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
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

      if (status === "published" && ticketMode === "sell") {
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

      if (status === "published") {
        router.push("/events/" + slug);
      } else {
        setNotice("Draft saved successfully.");
      }
    } catch (err) {
      setError(err?.message || "Could not save the event.");
    } finally {
      setLoading(false);
    }
  }

  const visibleFlyers = flyers
    .filter((f) =>
      f.name.toLowerCase().includes(flyerSearch.trim().toLowerCase())
    )
    .filter((f) => flyerCategory === "All" || f.category === flyerCategory);

  const nav = [
    { id: "details", label: "Event Details", icon: "▦" },
    { id: "tickets", label: "Ticket Settings", icon: "♧" },
    { id: "location", label: "Location", icon: "⌖" },
    { id: "additional", label: "Additional Info", icon: "ⓘ" },
    { id: "preview", label: "Preview", icon: "◉" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 lg:px-7">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mr-3 text-3xl font-black tracking-tight text-violet-600"
          >
            VYBE
          </button>

          <button
            type="button"
            onClick={() => router.push("/events")}
            className="hidden text-sm font-semibold text-slate-600 hover:text-violet-700 sm:block"
          >
            ⌂ Explore Events
          </button>

          <span className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-2 text-sm font-bold text-white">
            ＋ Create Event
          </span>

          <button
            type="button"
            onClick={() => router.push("/my-events")}
            className="hidden text-sm font-semibold text-slate-600 hover:text-violet-700 sm:block"
          >
            ▣ My Events
          </button>

          <span className="ml-auto hidden rounded-xl border border-slate-200 px-3 py-2 text-sm md:block">
            📍 Worldwide
          </span>

          <button
            type="button"
            onClick={() => saveEvent(null, "draft")}
            disabled={loading}
            className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={(e) => saveEvent(e, "published")}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
          >
            {loading ? "Saving…" : "Publish Event"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-3 py-5 sm:px-5 lg:px-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
              VYBE · EVENT CREATOR
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              Create Event
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Fill in the details below to create and publish your event.
            </p>
          </div>
          <span className="rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
            Live preview
          </span>
        </div>

        <form
          onSubmit={(e) => saveEvent(e, "published")}
          className="grid items-start gap-4 xl:grid-cols-[175px_minmax(0,1fr)_minmax(350px,0.96fr)]"
        >
          <aside className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm xl:sticky xl:top-24 xl:block xl:space-y-2 xl:overflow-visible">
            {nav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition xl:w-full ${
                  section === item.id
                    ? "bg-violet-100 text-violet-800"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </aside>

          <div className="min-w-0 space-y-4">
            {(section === "details" || section === "additional") && (
              <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-xl text-violet-700">
                    ▦
                  </span>
                  <div>
                    <h2 className="text-xl font-extrabold">Event Details</h2>
                    <p className="text-sm text-slate-500">
                      Basic information about your event
                    </p>
                  </div>
                </div>

                <label className="mb-4 block text-sm font-semibold">
                  Event Title <span className="text-rose-500">*</span>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Neon Nights Music Festival"
                    className={inputClass}
                  />
                </label>

                <label className="mb-4 block text-sm font-semibold">
                  Category
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="mb-4 block text-sm font-semibold">
                  Description <span className="text-rose-500">*</span>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell people what makes your event special…"
                    className={inputClass}
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">
                    Start Date & Time <span className="text-rose-500">*</span>
                    <input
                      required
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className={`${inputClass} font-normal`}
                    />
                  </label>

                  <label className="block text-sm font-semibold">
                    End Date & Time
                    <input
                      type="datetime-local"
                      min={startsAt || undefined}
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      className={`${inputClass} font-normal`}
                    />
                  </label>
                </div>

                <label className="mt-4 flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={recurring}
                    onChange={(e) => setRecurring(e.target.checked)}
                    className="h-4 w-4 accent-violet-600"
                  />
                  This is a recurring event
                  <span className="text-xs text-slate-400">
                    (visual option; recurrence is not saved yet)
                  </span>
                </label>

                {section === "additional" && (
                  <div className="mt-5">
                    <label className="block text-sm font-semibold">
                      Organization name
                      {organization && (
                        <span className="ml-2 font-normal text-slate-500">
                          ({organization.name})
                        </span>
                      )}
                      {!organization && (
                        <input
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          placeholder="Your organization name"
                          className={inputClass}
                        />
                      )}
                    </label>
                    <p className="mt-2 text-xs text-slate-500">
                      Organizer details shown on the event page.
                    </p>
                  </div>
                )}
              </section>
            )}

            {(section === "location" || section === "details") && (
              <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-xl text-violet-700">
                    ⌖
                  </span>
                  <div>
                    <h2 className="text-xl font-extrabold">Location</h2>
                    <p className="text-sm text-slate-500">
                      Add the venue location for your event (Worldwide)
                    </p>
                  </div>
                </div>

                <label className="block text-sm font-semibold">
                  Search for a location, city, or address{" "}
                  <span className="text-rose-500">*</span>
                  <input
                    required
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setSelectedPlace(null);
                    }}
                    placeholder="Search for a location, city, or address…"
                    autoComplete="off"
                    className={inputClass}
                  />
                </label>

                {places.length > 0 && (
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200">
                    {places.map((place, i) => (
                      <button
                        key={place.properties?.osm_id || i}
                        type="button"
                        onClick={() => choosePlace(place)}
                        className="block w-full border-b border-slate-100 p-3 text-left last:border-0 hover:bg-violet-50"
                      >
                        <span className="block text-sm font-bold">
                          {place.properties?.name ||
                            place.properties?.street ||
                            "Location"}
                        </span>
                        <span className="text-xs text-slate-500">
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
                  <div className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                    <span>✓ {selectedPlace.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlace(null);
                        setAddress("");
                      }}
                      className="font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}

                <label className="mt-4 block text-sm font-semibold">
                  Venue name (optional)
                  <input
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Venue or building name"
                    className={inputClass}
                  />
                </label>
              </section>
            )}

            {(section === "tickets" || section === "details") && (
              <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-xl text-violet-700">
                    ♧
                  </span>
                  <div>
                    <h2 className="text-xl font-extrabold">Ticket Settings</h2>
                    <p className="text-sm text-slate-500">
                      Choose how attendees can join your event
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setTicketMode("rsvp")}
                    className={`rounded-xl border p-4 text-left ${
                      ticketMode === "rsvp"
                        ? "border-violet-500 bg-violet-50 ring-1 ring-violet-200"
                        : "border-slate-200 hover:border-violet-200"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-bold">
                      {ticketMode === "rsvp" ? "🔘" : "◯"} Free RSVP
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Let people RSVP for free
                    </span>
                    <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                      Free
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTicketMode("sell")}
                    className={`rounded-xl border p-4 text-left ${
                      ticketMode === "sell"
                        ? "border-pink-500 bg-pink-50 ring-1 ring-pink-200"
                        : "border-slate-200 hover:border-pink-200"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-bold">
                      {ticketMode === "sell" ? "🔘" : "◯"} Sell Tickets
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Set ticket types and prices
                    </span>
                  </button>
                </div>

                {ticketMode === "sell" && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <label className="text-sm font-semibold">
                      Ticket name
                      <input
                        required
                        value={ticketName}
                        onChange={(e) => setTicketName(e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="text-sm font-semibold">
                      Price (INR)
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="text-sm font-semibold">
                      Quantity
                      <input
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <p className="text-xs text-slate-500 sm:col-span-3">
                      Online payments require a payment provider integration.
                    </p>
                  </div>
                )}

                {ticketMode === "rsvp" && (
                  <div className="mt-4">
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={limitRsvp}
                        onChange={(e) => setLimitRsvp(e.target.checked)}
                        className="h-4 w-4 accent-violet-600"
                      />
                      Limit total number of RSVPs (optional)
                    </label>

                    {limitRsvp && (
                      <input
                        type="number"
                        min="1"
                        value={rsvpLimit}
                        onChange={(e) => setRsvpLimit(e.target.value)}
                        className={inputClass}
                        placeholder="Maximum RSVPs"
                      />
                    )}

                    <p className="mt-2 text-xs text-slate-400">
                      RSVP limit is a visual option only until a matching database column and enforcement are added.
                    </p>
                  </div>
                )}
              </section>
            )}

            {section === "preview" && (
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-extrabold">Event Preview</h2>
                <p className="mt-1 text-sm text-slate-500">
                  The live preview is shown on the right. Use Desktop / Mobile to switch layout.
                </p>
                <button
                  type="button"
                  onClick={() => setSection("details")}
                  className="mt-4 rounded-xl bg-violet-600 px-4 py-3 font-bold text-white"
                >
                  Edit event details
                </button>
              </section>
            )}

            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold">Event Flyer</h2>
                  <p className="text-sm text-slate-500">
                    Browse your gallery or upload your own flyer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGalleryOpen((v) => !v)}
                  className="rounded-xl border border-violet-200 px-3 py-2 text-sm font-bold text-violet-700"
                >
                  {galleryOpen ? "Close gallery" : "Browse flyers"}
                </button>
              </div>

              {preview && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <img
                    src={preview}
                    alt="Selected flyer"
                    className="h-16 w-20 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {flyer?.name || template || "Selected flyer"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Preview updates automatically
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFlyer}
                    className="text-sm font-bold text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              )}

              {galleryOpen && (
                <div className="mt-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="search"
                      value={flyerSearch}
                      onChange={(e) => setFlyerSearch(e.target.value)}
                      placeholder="Search flyers…"
                      className={inputClass}
                    />
                    <select
                      value={flyerCategory}
                      onChange={(e) => setFlyerCategory(e.target.value)}
                      className={inputClass}
                    >
                      {["All", ...CATEGORIES].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {visibleFlyers.map((item) => (
                      <button
                        key={item.image}
                        type="button"
                        onClick={() => selectTemplate(item)}
                        className={`overflow-hidden rounded-xl border text-left ${
                          template === item.name
                            ? "border-violet-500 ring-2 ring-violet-100"
                            : "border-slate-200"
                        }`}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-28 w-full object-cover"
                        />
                        <span className="block truncate p-2 text-xs font-bold">
                          {item.name}
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
                    <p className="text-sm text-slate-500">
                      No matching flyers found.
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="mt-4 w-full rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/60 p-4 text-sm font-bold text-violet-700 hover:bg-violet-50"
              >
                ＋ Upload your flyer · JPG, PNG, WEBP or AVIF · max 5 MB
              </button>

              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFlyer}
                className="hidden"
              />
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
              <label className="block text-sm font-semibold">
                Organizer / Organization name
                {organization && (
                  <span className="ml-2 font-normal text-slate-500">
                    ({organization.name})
                  </span>
                )}
                {!organization && (
                  <input
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Your organization name"
                    className={inputClass}
                  />
                )}
              </label>
            </section>
          </div>

          <aside
            className={`min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5 xl:sticky xl:top-24 ${
              previewMode === "mobile"
                ? "mx-auto w-full max-w-[390px]"
                : ""
            }`}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">Event Preview</h2>
                <p className="text-xs text-slate-500">
                  How your event will appear to attendees
                </p>
              </div>
              <span className="text-xl text-violet-600">◉</span>
            </div>

            <div className="mb-4 flex justify-end rounded-xl bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setPreviewMode("desktop")}
                className={`rounded-lg px-3 py-2 text-xs font-bold ${
                  previewMode === "desktop"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                ▣ Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("mobile")}
                className={`rounded-lg px-3 py-2 text-xs font-bold ${
                  previewMode === "mobile"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                ▯ Mobile
              </button>
            </div>

            <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="relative bg-gradient-to-br from-violet-200 to-pink-200">
                {preview ? (
                  <img
                    src={preview}
                    alt="Event flyer preview"
                    className={`w-full object-cover ${
                      previewMode === "mobile" ? "max-h-56" : "max-h-72"
                    }`}
                  />
                ) : (
                  <div className="grid min-h-48 place-items-center p-6 text-center">
                    <span>
                      <span className="block text-4xl">✦</span>
                      <span className="mt-2 block font-bold text-violet-800">
                        Your event flyer appears here
                      </span>
                      <span className="mt-1 block text-xs text-violet-700">
                        Choose a template or upload an image
                      </span>
                    </span>
                  </div>
                )}

                <span className="absolute left-3 top-3 rounded-xl bg-white px-3 py-2 text-center text-xs font-black text-slate-900">
                  {startsAt
                    ? new Date(startsAt)
                        .toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })
                        .toUpperCase()
                    : "DATE"}
                </span>

                <button
                  type="button"
                  aria-label="Favorite preview"
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/20 text-xl text-white"
                >
                  ♡
                </button>
              </div>

              <div className="p-4">
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                    ♫ {category}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                    {ticketMode === "rsvp" ? "Free RSVP" : "Tickets"}
                  </span>
                </div>

                <h3 className="break-words text-xl font-black leading-tight">
                  {title || "Your Event Title"}
                </h3>

                <p className="mt-3 text-sm text-slate-500">
                  ▦ {formatDate(startsAt)}
                  {endsAt ? " – " + formatDate(endsAt) : ""}
                </p>

                <p className="mt-2 break-words text-sm text-slate-500">
                  ⌖ {selectedPlace?.label || "Your event location"}
                </p>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold text-slate-500">ORGANIZER</p>
                  <p className="mt-1 font-bold">
                    {organization?.name ||
                      organizationName ||
                      "Your Organization"}
                  </p>
                </div>

                <h4 className="mt-5 font-extrabold">About This Event</h4>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                  {description ||
                    "Your event description will appear here. Add details to help attendees know what to expect."}
                </p>

                <div className="mt-5 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-500">LOCATION</p>
                  <p className="mt-1 break-words text-sm font-semibold">
                    {venue || selectedPlace?.label || "Your event venue"}
                  </p>
                  <p className="mt-1 break-words text-xs text-slate-500">
                    {selectedPlace?.label ||
                      "Select a location to show it here"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSection("tickets")}
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 p-3 font-bold text-white"
                >
                  {ticketMode === "rsvp"
                    ? "RSVP for Free"
                    : `Tickets · ₹${price || "0"}`}
                </button>
              </div>
            </article>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Preview only. Final appearance depends on your public event page.
            </p>
          </aside>
        </form>

        {(error || notice) && (
          <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2">
            <p
              role="alert"
              className={`rounded-xl border p-4 text-sm font-semibold shadow-xl ${
                error
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {error || notice}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
