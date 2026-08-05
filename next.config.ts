import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse/pdfjs-dist relies on resolving worker paths relative to its own
  // location in node_modules; if Next.js bundles them for the server, those
  // paths break (see lib/extraction/parsePdf.ts).
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
};

export default nextConfig;
