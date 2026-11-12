import { existsSync } from "node:fs";
import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  env: {
    ICE_CLUB_MODEL_AVAILABLE: existsSync(
      path.join(process.cwd(), "public", "models", "ice-club.glb"),
    )
      ? "true"
      : "false",
  },
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: true,
  },
};

export default nextConfig;
