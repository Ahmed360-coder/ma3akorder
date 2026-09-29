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
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
