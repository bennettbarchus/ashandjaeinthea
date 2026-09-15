/**
 * RSVP deadline resolution, formatting and enforcement.
 *
 * There are two deadlines, deliberately, and they are not the same date:
 *
 * - `rsvpDeadline` is the technical cutoff. It decides when a submission is
 *   rejected, and is never shown to a guest.
 * - `rsvpDeadlineDisplay` is the published deadline. It is what guests read,
 *   and it is never enforced.
 *
 * The published date is the earlier of the two, so the couple have a quiet
 * buffer in which late RSVPs still land. Keep the two uses separate: format
 * the technical value for a guest and the buffer stops being quiet.
 *
 * Deliberately dependency-free — it is imported by client components
 * (the confirmation screens) as well as by server routes, so it must not
 * pull in lib/google-sheets.ts and googleapis with it. The enforcement
 * helpers are re-exported from lib/rsvp-config.ts for callers that expect
 * them there, the same way lib/dashboard-url.ts is.
 */
import type { RsvpSettings } from "@/types/rsvp";

/** Every deadline in the Settings tab is expressed in the wedding's local time. */
const EASTERN_TIME_ZONE = "America/New_York";

/** A bare calendar date with no time component, e.g. "2026-09-15". */
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The Eastern wall-clock reading of a UTC instant. */
function easternParts(instant: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    // Some ICU versions render midnight as hour 24 under hour12: false.
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

/** Eastern's UTC offset, in ms, at a given instant (EDT: -4h, EST: -5h). */
function easternOffsetMs(instant: number): number {
  // Measured on a whole second, since the formatted parts carry no
  // milliseconds — comparing them against an instant that has some would
  // fold that remainder into the offset.
  const whole = Math.floor(instant / 1000) * 1000;
  const p = easternParts(whole);
  return (
    Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - whole
  );
}

/** The instant at which the given Eastern wall-clock reading occurs. */
function instantFromEasternWallClock(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number
): number {
  const target = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  // Two passes: the offset depends on the instant we're solving for, so the
  // first guess is refined once to land correctly across a DST transition.
  let instant = target - easternOffsetMs(target);
  instant = target - easternOffsetMs(instant);
  return instant;
}

/**
 * Resolves the configured deadline to the exact instant it expires.
 *
 * The Settings tab is hand-edited, so the value arrives in one of two shapes:
 *
 * - A full timestamp carrying an offset ("2026-09-15T23:59:00-04:00"). That
 *   names an unambiguous instant and is used exactly as written.
 * - A bare date ("2026-09-15"). `new Date("2026-09-15")` reads that as UTC
 *   midnight, which is 8pm on the 14th in Eastern Time — so a date-only
 *   deadline would close the RSVP a whole evening early. A guest told "the
 *   deadline is September 15" means the end of September 15, so a bare date
 *   resolves to 23:59:59.999 Eastern on that date rather than its midnight.
 */
export function resolveDeadline(rsvpDeadline: string | null): Date | null {
  const raw = rsvpDeadline?.trim();
  if (!raw) return null;

  const dateOnly = DATE_ONLY_PATTERN.exec(raw);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(
      instantFromEasternWallClock(
        Number(year),
        Number(month),
        Number(day),
        23,
        59,
        59,
        999
      )
    );
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** True once the deadline has expired. An unset or unparseable value never closes the RSVP. */
export function isDeadlinePassed(
  settings: Pick<RsvpSettings, "rsvpDeadline">
): boolean {
  const deadline = resolveDeadline(settings.rsvpDeadline);
  if (!deadline) return false;
  return Date.now() > deadline.getTime();
}

/**
 * The deadline as guests should read it, e.g. "September 15, 2026 at 11:59 PM ET".
 *
 * Always rendered in Eastern Time rather than the viewer's locale zone, so the
 * server and the browser agree (no hydration mismatch) and every guest sees the
 * one deadline that actually applies. A value we can't parse is passed through
 * unchanged rather than dropped, so nothing configured goes unshown.
 */
export function formatDeadline(rsvpDeadline: string | null): string | null {
  const raw = rsvpDeadline?.trim();
  if (!raw) return null;

  const deadline = resolveDeadline(raw);
  if (!deadline) return raw;

  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(deadline);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(deadline);

  return `${date} at ${time} ET`;
}

/**
 * The deadline as guests should read it.
 *
 * Prefers the published `rsvp_deadline_display` value verbatim — it is written
 * for guests ("September 15, 2026"), so it is shown as written. With no
 * published value configured the technical deadline is formatted instead, so a
 * sheet that sets only `rsvp_deadline` still displays something sensible.
 */
export function displayDeadline(
  settings: Pick<RsvpSettings, "rsvpDeadline" | "rsvpDeadlineDisplay">
): string | null {
  const published = settings.rsvpDeadlineDisplay?.trim();
  if (published) return published;
  return formatDeadline(settings.rsvpDeadline);
}

/**
 * The rejection shown to a guest who submits too late. Names the deadline they
 * missed (and who to ask) rather than just asserting that one passed.
 */
export function deadlinePassedMessage(
  settings: Pick<
    RsvpSettings,
    "rsvpDeadline" | "rsvpDeadlineDisplay" | "supportEmail"
  >
): string {
  // The published deadline, not the technical one — this is copy a guest
  // reads, and it should match the date the site showed them all along.
  const deadline = displayDeadline(settings);
  const email = settings.supportEmail.trim();

  return [
    deadline
      ? `The RSVP deadline (${deadline}) has passed.`
      : "The RSVP deadline has passed.",
    email
      ? `Please email ${email} and we'll do our best to accommodate you.`
      : "Please reach out to us directly and we'll do our best to accommodate you.",
  ].join(" ");
}
