
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "../../lib/supabase";

export default function OrganizePage() {
  const router = useRouter();

  const [flyer, setFlyer] = useState(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [category, setCategory] = useState("Music");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [price, setPrice] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFlyer(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Flyer must be smaller than 5 MB.");
      return;
    }

    setFlyer(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  async function createEvent(event) {
    event.preventDefault();
    setError("");

    if (!flyer) {
      setError("Please upload your event flyer first.");
      return;
    }

    if (!startsAt) {
      setError("Please select the event start date and time.");
      return;
    }

    if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setError("End time must be after start time.");
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!sessionData.session) {
        router.push("/auth");
        return;
      }

      const slug =
        title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") +
        "-" +
        Math.random().toString(36).slice(2, 8);

      const safeFileName = flyer.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "-"
      );

      const filePath =
        sessionData.session.user.id +
        "/" +
        Date.now() +
        "-" +
        safeFileName;

      const { error: uploadError } = await supabase.storage
        .from("event flyer")
        .upload(filePath, flyer, {
          cacheControl: "3600",
          upsert: false,
          contentType: flyer.type,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("event flyer")
        .getPublicUrl(filePath);

      const eventData = {
        title: title.trim(),
        description: description.trim(),
        venue: venue.trim(),
        category: category,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt
          ? new Date(endsAt).toISOString()
          : null,
        price: Number(price),
        currency: "INR",
        image_url: publicData.publicUrl,
        slug: slug,
        status: "published",
      };

      const { error: insertError } = await supabase
        .from("events")
        .insert(eventData);

      if (insertError) throw insertError;

      router.push("/events/" + slug);
    } catch (err) {
      setError(
        err.message || "Could not publish event."
      );
    } finally {
      setLoading(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    fontSize: "16px",
    background: "#ffffff",
    color: "#171717",
  };

  return (
    <main
      style={{
        maxWidth: "760px",
        margin: "0 auto",
        padding: "24px",
        color: "#171717",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <a
        href="/"
        style={{
          color: "#555555",
          textDecoration: "none",
        }}
      >
        Back to VYBE
      </a>

      <h1
        style={{
          fontSize: "34px",
          fontWeight: 800,
          marginTop: "24px",
        }}
      >
        Create your event
      </h1>

      <p style={{ color: "#666666", marginBottom: "28px" }}>
        Upload your flyer and share your event.
      </p>

      <form
        onSubmit={createEvent}
        style={{ display: "grid", gap: "22px" }}
      >
        <section>
          <h2 style={{ fontSize: "21px", fontWeight: 700 }}>
            1. Upload event flyer *
          </h2>

          <p style={{ color: "#666666", fontSize: "14px" }}>
            JPG, PNG or WEBP. Maximum 5 MB.
          </p>

          <label
            style={{
              display: "block",
              padding: "20px",
              border: "2px dashed #aaaaaa",
              borderRadius: "14px",
              textAlign: "center",
              cursor: "pointer",
              background: "#fafafa",
            }}
          >
            {preview ? (
              <img
                src={preview}
                alt="Event flyer preview"
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "360px",
                  objectFit: "contain",
                  margin: "0 auto",
                  borderRadius: "10px",
                }}
              />
            ) : (
              <>
                <div style={{ fontSize: "42px" }}>+</div>
                <strong>Choose event flyer</strong>
                <p style={{ color: "#666666" }}>
                  Tap to select an image
                </p>
              </>
            )}

            <input
              type="file"
              accept="image/*"
              required
              onChange={handleFlyer}
              style={{
                display: "block",
                margin: "15px auto 0",
                maxWidth: "100%",
              }}
            />
          </label>
        </section>

        <label style={{ display: "grid", gap: "8px" }}>
          <strong>2. Event name *</strong>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter event name"
            style={fieldStyle}
          />
        </label>

        <label style={{ display: "grid", gap: "8px" }}>
          <strong>Event description *</strong>
          <textarea
            required
            rows={7}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your event..."
            style={fieldStyle}
          />
        </label>

        <label style={{ display: "grid", gap: "8px" }}>
          <strong>Venue / location *</strong>
          <input
            required
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Venue name and address"
            style={fieldStyle}
          />
        </label>

        <label style={{ display: "grid", gap: "8px" }}>
          <strong>Category *</strong>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={fieldStyle}
          >
            <option>Music</option>
            <option>Nightlife</option>
            <option>Business</option>
            <option>Arts</option>
            <option>Food & Drink</option>
            <option>Community</option>
            <option>Education</option>
            <option>Sports</option>
            <option>Other</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: "8px" }}>
          <strong>Start date and time *</strong>
          <input
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            style={fieldStyle}
          />
        </label>

        <label style={{ display: "grid", gap: "8px" }}>
          <strong>End date and time</strong>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            style={fieldStyle}
          />
        </label>

        <label style={{ display: "grid", gap: "8px" }}>
          <strong>Ticket price (INR) *</strong>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={fieldStyle}
          />
          <span style={{ color: "#666666", fontSize: "13px" }}>
            Enter 0 for a free event.
          </span>
        </label>

        {error && (
          <div
            role="alert"
            style={{
              color: "#b91c1c",
              background: "#fef2f2",
              padding: "12px",
              borderRadius: "8px",
              overflowWrap: "anywhere",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#111111",
            color: "#ffffff",
            border: 0,
            borderRadius: "10px",
            padding: "16px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Publishing..." : "Publish event"}
        </button>
      </form>
    </main>
  );
}

