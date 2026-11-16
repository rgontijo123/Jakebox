import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/signup", priority: 0.8, changeFrequency: "monthly" },
  { path: "/login", priority: 0.4, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path, priority, changeFrequency }) => ({
    url: SITE_URL + path,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: {
      languages: { "pt-BR": `${SITE_URL}${path}?lang=pt`, en: `${SITE_URL}${path}?lang=en` },
    },
  }));
}
