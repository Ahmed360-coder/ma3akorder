import type { MetadataRoute } from "next";

// Makes the site installable on phones ("Add to Home screen").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "M3akOrder معاك أوردر",
    short_name: "M3akOrder",
    start_url: "/",
    display: "standalone",
    background_color: "#0c100f",
    theme_color: "#0c100f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
