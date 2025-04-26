const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Re-disable in dev mode
  buildExcludes: ["/app-build-manifest.json"], // Exclude problematic files
  fallbacks: {
    document: "/offline/", // Add trailing slash to match Next.js app router
    image: "/icons/icon-512x512.png", // fallback for image requests
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // your existing next config here
};

module.exports = withPWA(nextConfig);
