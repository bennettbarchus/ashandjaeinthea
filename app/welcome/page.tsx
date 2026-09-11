import { getRsvpSettings } from "@/lib/rsvp-config";
import { WelcomeShell } from "@/components/welcome/WelcomeShell";

// Settings (rsvp_open, registry link, support email) must always be read
// fresh from the Sheet, never prerendered/cached at build time — this
// route can't be static.
export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const settings = await getRsvpSettings();
  return <WelcomeShell initialSettings={settings} />;
}
