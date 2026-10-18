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
