import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse/pdfjs-dist depende de resolver rutas de worker relativas a su
  // propia ubicación en node_modules; si Next.js los empaqueta para el
  // servidor, esas rutas se rompen (ver lib/extraction/parsePdf.ts).
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
};

export default nextConfig;
