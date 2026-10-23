
import "./globals.css";

export const metadata = {
  title: "Party Event — Discover Events Worldwide",
  description:
    "Discover parties, concerts, festivals, nightlife and events across the USA with Party Event.",
  metadataBase: new URL("https://vybe1-r4pb.vercel.app"),
  verification: {
    google: "W_oY8uGmgZZLUh8KB5uPwD1YZtsS5LGFJEvsSEJKFYk",
  },
  openGraph: {
    title: "Party Event — Discover Events Worldwide",
    description:
      "Discover parties, concerts, festivals, nightlife and events across the USA with Party Event.",
    url: "https://vybe1-r4pb.vercel.app",
    siteName: "Party Event",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
