import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

const title = "Eat That Frog — Personal Focus & Time Audit";
const description =
  "A daily execution journal: name your frog, audit every hour, and hold your streak.";

export const metadata: Metadata = {
  title,
  description,
  authors: [{ name: "Eat That Frog" }],
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
      <body className="bg-surface text-foreground antialiased">{children}</body>
    </html>
  );
}
