import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Type check runs separately (tsc/vitest). Skipping it in the production
  // build keeps `next build` from OOMing on small (~1GB) hosts.
  typescript: { ignoreBuildErrors: true },
};

export default withNextIntl(nextConfig);
