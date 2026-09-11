import type { NextConfig } from "next";
import path from "path";
import { DASHBOARD_URL } from "./lib/dashboard-url";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.127"],
  // A package-lock.json in a parent directory (outside this project) was
  // causing Turbopack to infer the wrong workspace root, which in turn
  // broke Tailwind v4's automatic content scanning (no utility classes
  // were being generated at all). Pinning the root here fixes both.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  async redirects() {
    return [
      // /dashboard -> the Apps Script RSVP dashboard.
      //
      // Handled here rather than by app/dashboard/page.tsx's redirect(),
      // because redirect() to an EXTERNAL url inside a streaming Server
      // Component doesn't emit an HTTP status at all — it renders the page
      // and injects <meta http-equiv="refresh" content="1;url=..."/>, i.e. a
      // full body plus a one-second pause before the browser moves. A rule
      // here runs at the routing layer, before any rendering, so the browser
      // gets a bodiless 307 and there is nothing to flash.
      //
      // permanent:false (307, not 308) on purpose: a permanent redirect is
      // cached hard by browsers, so re-publishing the Apps Script under a new
      // /macros/s/<id>/exec url would strand anyone who had already visited
      // this route. 307 keeps it changeable.
      {
        source: "/dashboard",
        destination: DASHBOARD_URL,
        permanent: false,
      },
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "rsvp.ashandjaeinthea.com",
          },
        ],
        destination: "/rsvp",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
