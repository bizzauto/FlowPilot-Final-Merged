import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FlowPilot Pro",
    short_name: "FlowPilot",
    description: "SaaS automation platform",
    display: "standalone",
    background_color: "#070b14",
    theme_color: "#070b14",
    start_url: "/dashboard",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}