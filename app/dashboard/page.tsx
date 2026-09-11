import { redirect } from "next/navigation";
import { DASHBOARD_URL } from "@/lib/rsvp-config";

// The redirect is issued on the server, so a direct hit never renders any
// markup — the browser receives the redirect response itself and there is no
// flash of content. force-dynamic keeps it out of the build's static pass so
// the destination is read per request rather than baked in at build time.
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  // redirect() serves a 307. Deliberately NOT permanentRedirect()/308: a
  // permanent redirect is cached hard by browsers, so if the Apps Script
  // deployment is ever re-published under a new URL — the exact case
  // DASHBOARD_URL exists to make easy — anyone who had visited this route
  // before would keep being sent to the dead one, with no way to recover
  // short of clearing site data. 307 keeps the indirection reversible.
  redirect(DASHBOARD_URL);
}
