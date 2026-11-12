import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page in nhOS is behind auth and reads the session per request,
  // so caching is handled explicitly in the service layer (fetch revalidate
  // + TanStack Query) instead of Cache Components.
  cacheComponents: false,
  // Lets a second, isolated build live next to the default one (e.g. local test runs).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Dev logs print Server Function arguments by default, which would include
  // sign-in emails and one-time codes. Keep them out of the terminal.
  logging: { serverFunctions: false },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
