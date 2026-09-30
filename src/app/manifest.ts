import type { MetadataRoute } from "next";
import { BRAND_COLOR } from "@/lib/brand";

// Makes the site installable on phones ("Add to Home screen").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "M3akOrder معاك أوردر",
    short_name: "M3akOrder",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: BRAND_COLOR,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      // Full-bleed version so Android can crop it to any shape without cutting the bag.
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
