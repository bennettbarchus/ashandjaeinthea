import { getRsvpSettings } from "@/lib/rsvp-config";
import { RsvpShell } from "@/components/rsvp/RsvpShell";

// Settings (rsvp_open, deadline, registry link, meal/steak options) must
// always be read fresh from the Sheet, never prerendered/cached at build
// time — this route can't be static.
export const dynamic = "force-dynamic";

export default async function RsvpPage() {
  const settings = await getRsvpSettings();
  return <RsvpShell initialSettings={settings} />;
}
