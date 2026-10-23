
import "./globals.css";

export const metadata = {
  title: "Party Event — Discover Events Worldwide",
  description:
  "Discover parties, concerts, festivals, nightlife and events across the USA with Party Event.",
  verification: {
  google: "W_oY8uGmgZZLUh8KB5uPwD1YZtsS5LGFJEvsSEJKFYk",
},
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://vybe1-221m-r1vnj88eq-fortdlls-7571.vercel.app"
  ),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
