import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ffprobe-static/ffmpeg-static resolve their bundled binary paths relative
  // to their own package directory at require-time -- bundling them would
  // break that path.
  serverExternalPackages: ["ffprobe-static", "ffmpeg-static"],
};

export default nextConfig;
