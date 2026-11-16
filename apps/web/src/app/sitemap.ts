import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://goatplan.vercel.app/", priority: 1 },
    { url: "https://goatplan.vercel.app/degree", priority: 0.8 },
  ];
}
