import type { Metadata } from "next";
import { Inter, JetBrains_Mono, IBM_Plex_Sans_Condensed } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const plexCondensed = IBM_Plex_Sans_Condensed({
  variable: "--font-plex-condensed",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GridSenti — Intelligent Grid Safety Monitoring",
  description:
    "AI-Assisted Detection & Localization of Invisible High-Impedance Downed Conductors",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetBrainsMono.variable} ${plexCondensed.variable} h-full`}
    >
      <body className="h-full bg-paper text-ink flex flex-col antialiased">
        {/* Top header */}
        <Header />

        {/* Body: sidebar + main content */}
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
