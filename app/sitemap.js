
const SITE_URL = "https://vybe1-r4pb.vercel.app";

export default function sitemap() {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/events/arts-in-the-dark-halloween-parade-2026-chicago-usa-mvl2206i`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
