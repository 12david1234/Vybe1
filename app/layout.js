
import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "Party Event — Discover Events Worldwide",
  description:
    "Discover parties, concerts, festivals, nightlife and events across the USA with Party Event.",
  metadataBase: new URL("https://vybe1-r4pb.vercel.app"),
  verification: {
    google: <meta name="google-site-verification" content="5XNdQ9NcdgN5Mma5RxPuia11Ie0O74WTHZqgp6VchP8" />
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
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SDF6G0FLZ1"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', 'G-SDF6G0FLZ1');
          `}
        </Script>
      </body>
    </html>
  );
}
