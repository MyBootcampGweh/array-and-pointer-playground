import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages serves a project site from /<repo>/. The deploy workflow passes
  // that prefix in at build time; locally it is unset and the site lives at /.
  basePath: process.env.PAGES_BASE_PATH,
  // Emits /modul/1/index.html, so both /modul/1 and /modul/1/ resolve on any
  // static host, including a plain local file server.
  trailingSlash: true,
  typedRoutes: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
