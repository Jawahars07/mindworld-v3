import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

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
  title: "Jawahar Naidu — Blueprint City",
  description:
    "A 3D city that compiles as you scroll. Jawahar Naidu builds AI tools people actually use — Bengaluru to Paris, ESSEC MIM, looking for a GenAI / digital-workplace apprenticeship in France.",
  metadataBase: new URL("https://jawaharnaidu.com"),
  openGraph: {
    title: "Jawahar Naidu — Blueprint City",
    description: "A 3D city that compiles as you scroll. AI tools, shipped and working.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${plot.variable}`}>
      <body className="font-display antialiased">{children}</body>
    </html>
  );
}
