
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://vybe1-r4pb.vercel.app";

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || !slug) {
      return {
        title: "Discover Events | Party Event",
        description: "Discover parties, concerts and events on Party Event.",
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: event, error } = await supabase
      .from("events")
      .select("title, description, city, country, slug, image_url")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !event) {
      return {
        title: "Event | Party Event",
        description: "Discover events on Party Event.",
      };
    }

    const title = `${event.title || "Event"} | Party Event`;

    const description = [
      event.description,
      event.city,
      event.country,
    ]
      .filter(Boolean)
      .join(" — ")
      .replace(/\s+/g, " ")
      .slice(0, 160) ||
      `Discover ${event.title || "this event"} on Party Event.`;

    const url = `${SITE_URL}/events/${encodeURIComponent(event.slug || slug)}`;

    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title,
        description,
        url,
        siteName: "Party Event",
        type: "website",
        ...(event.image_url ? { images: [event.image_url] } : {}),
      },
      twitter: {
        card: event.image_url ? "summary_large_image" : "summary",
        title,
        description,
        ...(event.image_url ? { images: [event.image_url] } : {}),
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    console.error("Event metadata error:", error);

    return {
      title: "Discover Events | Party Event",
      description: "Discover parties, concerts and events on Party Event.",
    };
  }
}

export default function EventLayout({ children }) {
  return children;
}
