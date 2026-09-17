import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Car Accounts",
    short_name: "Car Accounts",
    description: "Keep your Easytrip and Autosweep vehicle accounts together.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f6fb",
    theme_color: "#265cf5",
    categories: ["utilities", "finance", "travel"],
    icons: [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
