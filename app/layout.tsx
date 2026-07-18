import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const display = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const plot = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plot",
});

export const metadata: Metadata = {
  title: "Jawahar Naidu — MINDWORLD OS",
  description:
    "Not a portfolio — a working system you can walk through. It boots on live data, travels one continuous route from Bengaluru to Paris, and everything in it is real. ESSEC MIM, seeking a 12–24 month AI transformation apprenticeship in France.",
  metadataBase: new URL("https://jawaharnaidu.com"),
  alternates: { canonical: "https://jawaharnaidu.com" },
  keywords: [
    "Jawahar Naidu",
    "AI adoption strategist",
    "AI transformation",
    "AI adoption",
    "digital transformation apprenticeship",
    "alternance transformation digitale",
    "portfolio",
    "ESSEC MIM",
    "apprenticeship France",
    "alternance",
    "GenAI",
    "React Three Fiber",
    "Adopt",
  ],
  robots: { index: true, follow: true },
  verification: { google: "Zm1PrT69rL-AL0AVEGMW4w55jzhVbyOdFXtN5t5dkes" },
  openGraph: {
    title: "Jawahar Naidu — MINDWORLD OS",
    description: "Not a portfolio — a working system you can walk through. It boots, it runs, and everything in it is real. Seeking a 12–24 month apprenticeship in France.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "MINDWORLD OS — Jawahar Naidu's personal operating system" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jawahar Naidu — MINDWORLD OS",
    description: "Not a portfolio — a working system you can walk through. It boots, it runs, and everything in it is real.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${plot.variable}`}>
      <body className="font-display antialiased">
        {children}
        <Analytics />
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
        <Script id="jsonld-person" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Jawahar Naidu",
            url: "https://jawaharnaidu.com",
            email: "mailto:jawaharnaidu07@gmail.com",
            jobTitle: "Business strategist for AI adoption · Master in Management student at ESSEC Business School",
            alumniOf: [
              { "@type": "CollegeOrUniversity", name: "REVA University" },
              { "@type": "CollegeOrUniversity", name: "ESSEC Business School" },
            ],
            sameAs: ["https://github.com/Jawahars07"],
            knowsAbout: ["Generative AI", "React", "Next.js", "Three.js", "Claude API", "Digital workplace"],
          })}
        </Script>
      </body>
    </html>
  );
}
