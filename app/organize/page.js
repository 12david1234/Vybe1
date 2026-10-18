"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "../../lib/supabase";

const BUCKET = "event-flyers";
const CATEGORIES = ["Music", "Nightlife", "Sports", "Business", "Education", "Food & Drink", "Arts & Culture", "Community", "Other"];

const DEFAULT_FLYERS = [
  { name: "Party", category: "Nightlife", image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=85" },
  { name: "Music", category: "Music", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85" },
  { name: "Sports", category: "Sports", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=85" },
];

const inputClass = "mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

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
            if (!["jpg", "jpeg", "png", "webp", "avif"].includes(ext)) continue;

            const { data: publicData } = supabase.storage
              .from(BUCKET)
              .getPublicUrl(`templates/${item.name}`);

            if (!publicData?.publicUrl || all.some((x) => x.image === publicData.publicUrl)) continue;

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
      } catch {}

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
      } catch {}
    }

    loadOrg();
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
          "https://photon.komoot.io/api/?limit=6&q=" + encodeURIComponent(address),
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

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    []
  );

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

    if (fileInput.current) fileInput.current.value = "";
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
          name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
          "organization";

        const { data, error: orgError } = await supabase
          .from("organizations")
          .insert({
            owner_id: user.id,
            name,
            slug: baseOrg + "-" + Date.now().toString(36),
          })
          .select("id, name, slug")
          .single();

        if (orgError) throw new Error("Organization: " + orgError.message);

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

        imageUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }
