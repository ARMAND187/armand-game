import type { NextConfig } from "next";

/**
 * next-pwa wraps the config to inject service worker generation.
 * Note: next-pwa uses webpack under the hood, so we keep the turbopack
 * config empty to silence the Turbopack error, and add a turbopack
 * root hint to resolve the workspace-root warning.
 */
// @ts-expect-error — next-pwa ships no TypeScript declaration file
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig: NextConfig = {
  // Silence Turbopack "no turbopack config" error — empty object is fine
  // root points to this project's directory, resolving the workspace warning
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA(nextConfig);
