const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline", // fallback for document (/) route
    image: "/icons/icon-512x512.png", // fallback for image requests
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // your existing next config here
};

module.exports = withPWA(nextConfig);
