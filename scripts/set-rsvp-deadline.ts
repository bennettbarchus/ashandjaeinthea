/**
 * Sets the RSVP deadline pair on the "Settings" tab.
 *
 * Two keys, deliberately holding different dates:
 *
 * - `rsvp_deadline` — the technical cutoff, stored as a full ISO timestamp
 *   with an explicit offset ("2026-09-17T23:59:00-04:00"). This is what
 *   actually rejects a submission. A bare date is still honoured by
 *   lib/deadline.ts (it resolves to the end of that day Eastern), but storing
 *   the exact instant leaves nothing implicit about when the RSVP closes.
 * - `rsvp_deadline_display` — the published deadline, free text written for
 *   guests ("September 15, 2026"). Shown as-is, never parsed, never enforced.
 *
 * Publishing the earlier date gives the couple a quiet buffer in which late
 * RSVPs still land.
 *
 * Idempotent: values already in place are reported and left alone, and the
 * display row is created if the tab doesn't have one yet.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/set-rsvp-deadline.ts \
 *     2026-09-17T23:59:00-04:00 --display "September 15, 2026"
 */
import { appendRows, getSettingsTab, writeCell } from "@/lib/google-sheets";
import { formatDeadline, resolveDeadline } from "@/lib/deadline";

const DEADLINE_KEY = "rsvp_deadline";
const DISPLAY_KEY = "rsvp_deadline_display";
const VALUE_COLUMN = "B"; // Settings is a two-column key/value tab.

const USAGE =
  'Usage: npx tsx --env-file=.env.local scripts/set-rsvp-deadline.ts <deadline> [--display "<text>"]';

async function main() {
  const args = process.argv.slice(2);
  const displayFlag = args.indexOf("--display");
  const display =
    displayFlag === -1 ? undefined : args[displayFlag + 1]?.trim();
  if (displayFlag !== -1 && !display) {
    throw new Error(`--display needs a value.\n${USAGE}`);
  }
  const deadline = (displayFlag === -1 ? args[0] : args.slice(0, displayFlag)[0])?.trim();
  if (!deadline) {
    throw new Error(USAGE);
  }
  if (!resolveDeadline(deadline)) {
    throw new Error(`Not a usable deadline: ${deadline}`);
  }

  const { headers, rows } = await getSettingsTab();
  if (headers[0] !== "key" || headers[1] !== "value") {
    throw new Error(
      `Unexpected Settings layout: expected key/value headers, found ${headers.join(", ")}`
    );
  }

  const setExisting = async (key: string, value: string) => {
    const row = rows.find((r) => r.data.key === key);
    if (!row) return false;
    if (row.data.value === value) {
      console.log(`${key} is already ${JSON.stringify(value)} — nothing to do.`);
      return true;
    }
    const range = `Settings!${VALUE_COLUMN}${row.rowNumber}`;
    await writeCell(range, value);
    console.log(
      `${key}: ${row.data.value || "(empty)"} -> ${JSON.stringify(value)}  [${range}]`
    );
    return true;
  };

  if (!(await setExisting(DEADLINE_KEY, deadline))) {
    throw new Error(`No "${DEADLINE_KEY}" row found on the Settings tab.`);
  }

  if (display !== undefined && !(await setExisting(DISPLAY_KEY, display))) {
    await appendRows("Settings", [[DISPLAY_KEY, display]]);
    console.log(`${DISPLAY_KEY}: (new row) -> ${JSON.stringify(display)}`);
  }

  console.log("");
  console.log(`Submissions close at: ${resolveDeadline(deadline)?.toISOString()}`);
  console.log(`                      (${formatDeadline(deadline)})`);
  console.log(`Guests are told:      ${display ?? "(display value unchanged)"}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
