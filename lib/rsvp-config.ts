import { getSettings } from "./google-sheets";
import { STEAK_ENTREE_LABEL, type RsvpSettings } from "@/types/rsvp";

/**
 * The deployed Apps Script dashboard url. Defined in ./dashboard-url so that
 * next.config.ts can import it without pulling googleapis into config
 * evaluation; re-exported here as the settings-shaped place to look for it.
 */
export { DASHBOARD_URL } from "./dashboard-url";

/**
 * Deadline resolution/enforcement lives in ./deadline so that client
 * components can import the formatter without pulling googleapis in through
 * this module's getSettings import. Re-exported here as the settings-shaped
 * place to look for it.
 */
export {
  deadlinePassedMessage,
  displayDeadline,
  formatDeadline,
  isDeadlinePassed,
  resolveDeadline,
} from "./deadline";

const CACHE_TTL_MS = 60_000;
let cache: { value: RsvpSettings; expiresAt: number } | null = null;

/**
 * Centralized settings accessor (registry URL, deadline, meal/steak options, etc.)
 * backed by the "Settings" tab, so nothing is hard-coded per-component.
 * Cached briefly per server instance to avoid a sheet read on every request.
 */
export async function getRsvpSettings(): Promise<RsvpSettings> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.value;
  }
  const value = await getSettings();
  cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

export function isSteakChoice(mealChoice: string): boolean {
  return mealChoice.trim().toLowerCase() === STEAK_ENTREE_LABEL.toLowerCase();
}
