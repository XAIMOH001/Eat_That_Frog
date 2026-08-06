import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

const title = "Focus Journal — Personal Focus & Time Audit";
const description =
  "A daily time-blocking journal: audit every hour, score your discipline, and track focus consistency streaks.";

export const metadata: Metadata = {
  title,
  description,
  authors: [{ name: "Focus Journal" }],
  icons: { icon: "/favicon.ico" },
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e0e5ec",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="bg-[#e0e5ec] text-foreground antialiased">{children}</body>
    </html>
  );
}
