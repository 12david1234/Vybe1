
import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "Party Event - Discover Parties, Concerts & Events",
  description:
    "Discover parties, concerts, festivals, nightlife and events across the USA with Party Event.",
  metadataBase: new URL("https://vybe1-r4pb.vercel.app"),
  verification: {
    google: "5XNdQ9NcdgN5Mma5RxPuia11Ie0O74WTHZqgp6VchP8",
  },
  openGraph: {
    title: "Party Event - Discover Parties, Concerts & Events",
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
      <head>
        <meta
          name="google-adsense-account"
          content="ca-pub-3487784116450230"
        />
      </head>

      <body>
        {children}

        <Script
          async
          id="google-adsense"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3487784116450230"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

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
