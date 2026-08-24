import type { MetadataRoute } from "next";

import { ROUTES } from "@/lib/routes";

// Only the crawlable surface. The journal, the auth pages and /api are disallowed in
// `public/robots.txt`, so listing them here would contradict it.
const PUBLIC_ROUTES = [ROUTES.home, ROUTES.privacy, ROUTES.terms] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = (process.env["BETTER_AUTH_URL"] ?? "http://localhost:3000").replace(/\/$/, "");

  return PUBLIC_ROUTES.map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === ROUTES.home ? 1 : 0.5,
  }));
}
