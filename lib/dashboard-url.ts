/**
 * The deployed Google Apps Script RSVP dashboard.
 *
 * Re-publishing the Apps Script mints a new /macros/s/<id>/exec url, so it
 * lives in one place and is imported by both consumers: the redirect rule in
 * next.config.ts and the /dashboard route.
 *
 * Deliberately dependency-free — next.config.ts imports it, and pulling in
 * lib/rsvp-config.ts would drag googleapis into config evaluation. It is
 * re-exported from lib/rsvp-config.ts for callers that expect it there.
 */
export const DASHBOARD_URL =
  "https://script.google.com/macros/s/AKfycby8WChCOs36MG03ne3woWJvLanA6YZ1ai7OSOI0WfOuhWhH4a-RInjVF8W4-lt3TRh3/exec";
