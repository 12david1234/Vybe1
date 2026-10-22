
import "./globals.css";

export const metadata = {
  title: "VYBE — Discover Events Worldwide",
  description:
    "Discover concerts, parties, festivals, nightlife and experiences around the world.",
  verification: {
  google: "W_oY8uGmgZZLUh8KB5uPwD1YZtsS5LGFJEvsSEJKFYk",
},
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://vybe-events.vercel.app"
  ),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
