
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://vybe1-r4pb.vercel.app";

export default async function sitemap() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: events, error } = await supabase
    .from("events")
    .select("slug")
    .not("slug", "is", null);

  const pages = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  if (error || !events) {
    return pages;
  }

  const eventPages = events.map((event) => ({
    url: `${SITE_URL}/events/${event.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...pages, ...eventPages];
}
