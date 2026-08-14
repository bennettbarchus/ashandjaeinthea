import { getSettings } from "./google-sheets";
import { STEAK_ENTREE_LABEL, type RsvpSettings } from "@/types/rsvp";

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

export function isDeadlinePassed(settings: RsvpSettings): boolean {
  if (!settings.rsvpDeadline) return false;
  const deadline = new Date(settings.rsvpDeadline);
  if (Number.isNaN(deadline.getTime())) return false;
  return Date.now() > deadline.getTime();
}

export function isSteakChoice(mealChoice: string): boolean {
  return mealChoice.trim().toLowerCase() === STEAK_ENTREE_LABEL.toLowerCase();
}
