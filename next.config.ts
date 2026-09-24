import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` otherwise rewrites the tracked CLAUDE.md with generated agent rules.
  agentRules: false,
};

export default nextConfig;
