/**
 * Run build or dev with SKIP_ENV_VALIDATION to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: false,

    remotePatterns: [
      {
        protocol: "https",
        hostname: "uploads*.wikiart.org",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default config;
