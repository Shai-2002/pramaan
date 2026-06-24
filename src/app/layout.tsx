import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3211"),
  title: "Pramaan — proof-of-work for skills",
  description:
    "Stop scoring what a candidate wrote. Pramaan scores the evidence their profile points at — per-skill Evidence Cards (verified / unverified / contradicted) with citations.",
  openGraph: {
    title: "Pramaan — proof-of-work for skills",
    description:
      "A claim is only as real as the artifact behind it. Pramaan verifies each claimed skill against authored commits, live deployments, and published work — then cites the receipt.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pramaan — proof-of-work for skills",
    description:
      "Score the evidence, not the self-description. Per-skill Evidence Cards with citations.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
