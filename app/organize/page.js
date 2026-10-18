"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase";

const BUCKET = "event-flyers";
const CATEGORIES = ["Music", "Nightlife", "Sports", "Business", "Education", "Food & Drink", "Arts & Culture", "Community", "Other"];
const DEFAULT_FLYERS = [
  { name: "Party", category: "Nightlife", image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=85" },
  { name: "Music", category: "Music", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85" },
  { name: "Sports", category: "Sports", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=85" },
];
const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-violet-500";

function formatDate(value) {
  if (!value) return "Date and time not set";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "Date and time not set" : d.toLocaleString();
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
  const [previewMode, setPreviewMode] = useState("desktop");
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
          const { data, error } = await supabase.storage.from(BUCKET).list("templates", {
            limit: 100, offset, sortBy: { column: "name", order: "asc" },
          });
          if (error || !data?.length) break;
          for (const item of data) {
            if (!item.name || item.name.startsWith(".")) continue;
            const ext = item.name.split(".").pop()?.toLowerCase();
            if (!["jpg", "jpeg", "png", "webp", "avif"].includes(ext)) continue;
            const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(`templates/${item.name}`);
            if (!pub?.publicUrl) continue;
            all.push({
              name: item.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
              category: "Other",
              image: pub.publicUrl,
            });
          }
          if (data.length < 100) break;
          offset += 100;
        }
      } catch {}
      if (active) setFlyers(all);
    }
    loadTemplates();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadOrg() {
      try {
        const { data: session } = await supabase.auth.getSession();
        const user = session?.session?.user;
        if (!user) return;
        const { data } = await supabase.from("organizations").select("id,name,slug")
          .eq("owner_id", user.id).limit(1).maybeSingle();
        if (active && data) {
          setOrganization(data);
          setOrganizationName(data.name);
        }
      } catch {}
    }
    loadOrg();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (address.trim().length < 3 || selectedPlace) {
      setPlaces([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("https://photon.komoot.io/api/?limit=6&q=" + encodeURIComponent(address), {
          signal: controller.signal,
        });
        if (res.ok) setPlaces((await res.json()).features || []);
      } catch (err) {
        if (err.name !== "AbortError") setPlaces([]);
      }
    }, 450);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [address, selectedPlace]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  function setLocalPreview(file) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = file ? URL.createObjectURL(file) : "";
    setPreview(objectUrlRef.current);
  }

  function selectTemplate(item) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = "";
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
    if (fileInput.current) fileInput.current.value = "";
  }

  function choosePlace(place) {
    const p = place.properties || {};
    const coords = place.geometry?.coordinates || [];
    const city = p.city || p.town || p.village || p.county || "";
    const label = [p.name, p.street, p.housenumber, city, p.state, p.country]
      .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ");
    setSelectedPlace({
      label, city, country: p.country || "",
      latitude: coords[1] ?? null, longitude: coords[0] ?? null,
    });
    setAddress(label);
    setPlaces([]);
  }

  async function saveEvent(e, status = "published") {
    e?.preventDefault?.();
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
      setSection("details");
      return;
    }
    if (!isDraft && !selectedPlace) {
      setError("Search for a location and select a suggestion.");
      setSection("location");
      return;
    }
    if (!isDraft && (!startsAt || new Date(startsAt) <= new Date())) {
      setError("Choose a future start date and time.");
      setSection("details");
      return;
    }
    if (endsAt && startsAt && new Date(endsAt) <= new Date(startsAt)) {
      setError("End time must be after start time.");
      return;
    }
    if (!isDraft && ticketMode === "sell" &&
      (!ticketName.trim() || !Number.isFinite(Number(price)) ||
      Number(price) < 0 || !Number.isInteger(Number(quantity)) || Number(quantity) < 1)) {
      setError("Check ticket name, price, and quantity.");
      setSection("tickets");
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
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
        const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "organization";
        const { data, error } = await supabase.from("organizations").insert({
          owner_id: user.id,
          name,
          slug: slugBase + "-" + Date.now().toString(36),
        }).select("id,name,slug").single();
        if (error) throw new Error("Organization: " + error.message);
        org = data;
        setOrganization(data);
      }

      let imageUrl = preview || null;
      if (flyer) {
        const safeName = flyer.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, flyer, {
          cacheControl: "3600", upsert: false, contentType: flyer.type,
        });
        if (error) throw new Error("Flyer upload: " + error.message);
        imageUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }

      const base = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 55) || "event";
      const slug = base + "-" + Date.now().toString(36);
      const { data: savedEvent, error: saveError } = await supabase.from("events").insert({
        title: title.trim(),
        description: description.trim() || "",
        venue: venue.trim() || selectedPlace?.label || null,
        city: selectedPlace?.city || null,
        country: selectedPlace?.country || null,
        location_address: selectedPlace?.label || null,
        latitude: selectedPlace?.latitude ?? null,
        longitude: selectedPlace?.longitude ?? null,
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
      }).select("id").single();

      if (saveError) throw new Error("Event save: " + saveError.message);

      if (!isDraft && ticketMode === "sell") {
        const { error } = await supabase.from("event_ticket_types").insert({
          event_id: savedEvent.id,
          name: ticketName.trim(),
          price: Number(price),
          quantity: Number(quantity),
          currency: "INR",
        });
        if (error) {
          await supabase.from("events").update({ status: "draft" })
            .eq("id", savedEvent.id).eq("organizer_id", user.id);
          throw new Error("Ticket setup failed; event returned to draft if permitted: " + error.message);
        }
      }

      if (isDraft) setNotice("Draft saved successfully.");
      else router.push("/events/" + slug);
    } catch (err) {
      setError(err?.message || "Could not save the event.");
    } finally {
      setLoading(false);
    }
  }

  const visibleFlyers = flyers
    .filter((f) => f.name.toLowerCase().includes(flyerSearch.trim().toLowerCase()))
    .filter((f) => flyerCategory === "All" || f.category === flyerCategory);

  const nav = [
    { id: "details", label: "Event Details" },
    { id: "tickets", label: "Ticket Settings" },
    { id: "location", label: "Location" },
    { id: "additional", label: "Additional Info" },
    { id: "preview", label: "Preview" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <button type="button" onClick={() => router.push("/")} className="mr-3 text-3xl font-black text-violet-600">VYBE</button>
          <span className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white">＋ Create Event</span>
          <button type="button" onClick={() => router.push("/my-events")} className="text-sm font-semibold">My Events</button>
          <span className="ml-auto hidden text-sm text-slate-500 sm:block">Worldwide</span>
          <button type="button" onClick={() => saveEvent(null, "draft")} disabled={loading} className="rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-bold text-violet-700 disabled:opacity-50">Save Draft</button>
          <button type="button" onClick={(e) => saveEvent(e, "published")} disabled={loading} className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading ? "Saving..." : "Publish Event"}</button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600">VYBE · EVENT CREATOR</p>
          <h1 className="mt-1 text-3xl font-black">Create Event</h1>
          <p className="mt-1 text-sm text-slate-500">Create your event, select a flyer and preview before publishing.</p>
        </div>

        <form onSubmit={(e) => saveEvent(e, "published")} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,410px)]">
          <div className="min-w-0 space-y-4">
            <nav className="grid grid-cols-2 gap-2 rounded-2xl border bg-white p-2 sm:grid-cols-3 lg:grid-cols-5">
              {nav.map((item) => (
                <button key={item.id} type="button" onClick={() => setSection(item.id)} className={`rounded-xl px-2 py-3 text-xs font-bold sm:text-sm ${section === item.id ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-violet-50"}`}>
                  {item.label}
                </button>
              ))}
            </nav>

            {(section === "details" || section === "additional") && (
              <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-xl font-extrabold">Event Details</h2>
                <label className="mt-4 block text-sm font-semibold">Event Title *
                  <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your event title" className={inputClass} />
                </label>
                <label className="mt-4 block text-sm font-semibold">Description
                  <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell people about your event..." className={inputClass} />
                </label>
                <label className="mt-4 block text-sm font-semibold">Category
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">Start date and time
                    <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
                  </label>
                  <label className="block text-sm font-semibold">End date and time
                    <input type="datetime-local" min={startsAt || undefined} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
                  </label>
                </div>
                <label className="mt-4 flex items-center gap-3 text-sm">
                  <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="h-4 w-4 accent-violet-600" />
                  Recurring event <span className="text-xs text-slate-400">(display option only)</span>
                </label>
                {section === "additional" && (
                  <label className="mt-4 block text-sm font-semibold">Organization name
                    {organization ? <span className="ml-2 font-normal">{organization.name}</span> : <input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Organization name" className={inputClass} />}
                  </label>
                )}
              </section>
            )}

            {(section === "location" || section === "details") && (
              <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-xl font-extrabold">Event Location</h2>
                <label className="mt-4 block text-sm font-semibold">Search address
                  <input value={address} onChange={(e) => { setAddress(e.target.value); setSelectedPlace(null); }} placeholder="Search city or address worldwide" autoComplete="off" className={inputClass} />
                </label>
                {places.length > 0 && (
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border">
                    {places.map((place, i) => (
                      <button key={place.properties?.osm_id || i} type="button" onClick={() => choosePlace(place)} className="block w-full border-b p-3 text-left text-sm hover:bg-violet-50">
                        <strong className="block">{place.properties?.name || place.properties?.street || "Location"}</strong>
                        <span className="text-xs text-slate-500">{[place.properties?.city || place.properties?.town || place.properties?.village, place.properties?.state, place.properties?.country].filter(Boolean).join(", ")}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedPlace && <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">✓ {selectedPlace.label}
                  <button type="button" onClick={() => { setSelectedPlace(null); setAddress(""); }} className="ml-3 font-bold">Change</button>
                </div>}
                <label className="mt-4 block text-sm font-semibold">Venue name
                  <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue or building name" className={inputClass} />
                </label>
              </section>
            )}

            {(section === "tickets" || section === "details") && (
              <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-xl font-extrabold">Tickets and RSVP</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => setTicketMode("rsvp")} className={`rounded-xl border p-4 text-left ${ticketMode === "rsvp" ? "border-violet-500 bg-violet-50" : "border-slate-200"}`}>
                    <strong>Free RSVP</strong><span className="mt-1 block text-xs text-slate-500">Free registration</span>
                  </button>
                  <button type="button" onClick={() => setTicketMode("sell")} className={`rounded-xl border p-4 text-left ${ticketMode === "sell" ? "border-pink-500 bg-pink-50" : "border-slate-200"}`}>
                    <strong>Sell Tickets</strong><span className="mt-1 block text-xs text-slate-500">Set ticket prices</span>
                  </button>
                </div>
                {ticketMode === "sell" && <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label className="text-sm font-semibold">Ticket name<input required value={ticketName} onChange={(e) => setTicketName(e.target.value)} className={inputClass} /></label>
                  <label className="text-sm font-semibold">Price (INR)<input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} /></label>
                  <label className="text-sm font-semibold">Quantity<input required type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} /></label>
                </div>}
                {ticketMode === "rsvp" && <div className="mt-4">
                  <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={limitRsvp} onChange={(e) => setLimitRsvp(e.target.checked)} className="h-4 w-4 accent-violet-600" />Limit RSVPs</label>
                  {limitRsvp && <input type="number" min="1" value={rsvpLimit} onChange={(e) => setRsvpLimit(e.target.value)} placeholder="Maximum RSVPs" className={inputClass} />}
                  <p className="mt-2 text-xs text-slate-400">RSVP limit is a display option and is not saved to the database yet.</p>
                </div>}
              </section>
            )}

            {section === "preview" && <section className="rounded-2xl border bg-white p-5"><h2 className="text-xl font-extrabold">Live Preview</h2><p className="mt-2 text-sm text-slate-500">Your preview appears on the right.</p><button type="button" onClick={() => setSection("details")} className="mt-4 rounded-xl bg-violet-600 px-4 py-3 font-bold text-white">Edit details</button></section>}

            <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-lg font-extrabold">Flyer Gallery</h2><p className="text-sm text-slate-500">Choose a flyer or upload your own.</p></div>
                <button type="button" onClick={() => setGalleryOpen((v) => !v)} className="rounded-xl border border-violet-200 px-3 py-2 text-sm font-bold text-violet-700">{galleryOpen ? "Close" : "Browse flyers"}</button>
              </div>
              {preview && <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3"><img src={preview} alt="Selected flyer" className="h-16 w-20 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{flyer?.name || template || "Selected flyer"}</p></div><button type="button" onClick={removeFlyer} className="text-sm font-bold text-rose-600">Remove</button></div>}
              {galleryOpen && <div className="mt-4 space-y-3">
                <input value={flyerSearch} onChange={(e) => setFlyerSearch(e.target.value)} placeholder="Search flyers" className={inputClass} />
                <select value={flyerCategory} onChange={(e) => setFlyerCategory(e.target.value)} className={inputClass}>{["All", ...CATEGORIES].map((c) => <option key={c}>{c}</option>)}</select>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {flyers.filter((f) => f.name.toLowerCase().includes(flyerSearch.toLowerCase())).filter((f) => flyerCategory === "All" || f.category === flyerCategory).map((item) => <button key={item.image} type="button" onClick={() => selectTemplate(item)} className="overflow-hidden rounded-xl border text-left"><img src={item.image} alt={item.name} className="h-28 w-full object-cover" /><span className="block p-2 text-xs font-bold">{item.name}</span></button>)}
                </div>
              </div>}
              <button type="button" onClick={() => fileInput.current?.click()} className="mt-4 w-full rounded-xl border-2 border-dashed border-violet-200 bg-violet-50 p-4 text-sm font-bold text-violet-700">+ Upload flyer · Max 5 MB</button>
              <input ref={fileInput} type="file" accept="image/*" onChange={handleFlyer} className="hidden" />
            </section>

            <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
              <label className="block text-sm font-semibold">Organization name
                {organization ? <span className="ml-2 font-normal">{organization.name}</span> : <input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Your organization name" className={inputClass} />}
              </label>
            </section>

            <div className="flex gap-3">
              <button type="button" disabled={loading} onClick={() => saveEvent(null, "draft")} className="flex-1 rounded-xl border border-violet-200 px-4 py-3 font-bold text-violet-700 disabled:opacity-50">{loading ? "Saving..." : "Save Draft"}</button>
              <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-3 font-bold text-white disabled:opacity-50">{loading ? "Publishing..." : "Publish Event"}</button>
            </div>
          </div>

          <aside className={`min-w-0 rounded-2xl border bg-white p-4 shadow-sm xl:sticky xl:top-24 ${previewMode === "mobile" ? "mx-auto w-full max-w-[390px]" : ""}`}>
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-extrabold">Live Preview</h2><p className="text-xs text-slate-500">Attendee view</p></div></div>
            <div className="mb-4 flex justify-end rounded-xl bg-slate-50 p-1">
              <button type="button" onClick={() => setPreviewMode("desktop")} className={`rounded-lg px-3 py-2 text-xs font-bold ${previewMode === "desktop" ? "bg-white text-violet-700 shadow" : "text-slate-500"}`}>Desktop</button>
              <button type="button" onClick={() => setPreviewMode("mobile")} className={`rounded-lg px-3 py-2 text-xs font-bold ${previewMode === "mobile" ? "bg-white text-violet-700 shadow" : "text-slate-500"}`}>Mobile</button>
            </div>
            <article className="overflow-hidden rounded-2xl border">
              <div className="relative bg-gradient-to-br from-violet-200 to-pink-200">
                {preview ? <img src={preview} alt="Flyer preview" className={`w-full object-cover ${previewMode === "mobile" ? "max-h-56" : "max-h-72"}`} /> : <div className="grid min-h-48 place-items-center p-6 text-center"><span><span className="block text-4xl">✦</span><span className="mt-2 block font-bold text-violet-800">Your flyer appears here</span></span></div>}
                <span className="absolute left-3 top-3 rounded-xl bg-white px-3 py-2 text-xs font-black">{startsAt ? new Date(startsAt).toLocaleDateString([], { month: "short", day: "numeric" }).toUpperCase() : "DATE"}</span>
              </div>
              <div className="p-4">
                <div className="mb-2 flex flex-wrap gap-2"><span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">{category}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">{ticketMode === "rsvp" ? "Free RSVP" : "Tickets"}</span></div>
                <h3 className="break-words text-xl font-black">{title || "Your Event Title"}</h3>
                <p className="mt-3 text-sm text-slate-500">{formatDate(startsAt)}</p>
                <p className="mt-2 break-words text-sm text-slate-500">{selectedPlace?.label || "Your event location"}</p>
                <div className="mt-4 border-t pt-4"><p className="text-xs font-bold text-slate-500">ORGANIZER</p><p className="mt-1 break-words font-bold">{organization?.name || organizationName || "Your Organization"}</p></div>
                <h4 className="mt-5 font-extrabold">About This Event</h4>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{description || "Your event description will appear here."}</p>
                <div className="mt-5 rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">LOCATION</p><p className="mt-1 break-words text-sm font-semibold">{venue || selectedPlace?.label || "Your event venue"}</p></div>
                <button type="button" onClick={() => setSection("tickets")} className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 p-3 font-bold text-white">{ticketMode === "rsvp" ? "RSVP for Free" : `Tickets · ₹${price || "0"}`}</button>
              </div>
            </article>
          </aside>
        </form>

        {(error || notice) && <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2"><p role="alert" className={`rounded-xl border p-4 text-sm font-semibold shadow-xl ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || notice}</p></div>}
      </div>
    </main>
  );
}
