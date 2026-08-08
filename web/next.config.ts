import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Azure Static Web Apps' managed Next.js SSR hosting doesn't reliably run this app's
  // Next.js version — and this app has no server dependencies (no middleware, no route
  // handlers, every dynamic bit is a client-side call to the external .NET API), so a
  // static export removes that fragile layer entirely.
  output: "export",
};

export default nextConfig;
