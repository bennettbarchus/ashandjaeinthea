/**
 * Sets the `rsvp_deadline` value on the "Settings" tab.
 *
 * The deadline is stored as a full ISO timestamp with an explicit offset
 * (e.g. "2026-09-15T23:59:00-04:00") rather than a bare date. A bare date is
 * still honoured by lib/deadline.ts — it resolves to the end of that day in
 * Eastern Time — but storing the exact instant leaves nothing implicit about
 * when the RSVP actually closes.
 *
 * Idempotent: re-running with the same value reports "already set" and writes
 * nothing.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/set-rsvp-deadline.ts 2026-09-15T23:59:00-04:00
 */
import { getSettingsTab, writeCell } from "@/lib/google-sheets";
import { formatDeadline, resolveDeadline } from "@/lib/deadline";

const KEY = "rsvp_deadline";
const VALUE_COLUMN = "B"; // Settings is a two-column key/value tab.

async function main() {
  const value = process.argv[2]?.trim();
  if (!value) {
    throw new Error(
      "Usage: npx tsx --env-file=.env.local scripts/set-rsvp-deadline.ts <deadline>"
    );
  }
  if (!resolveDeadline(value)) {
    throw new Error(`Not a usable deadline: ${value}`);
  }

  const { headers, rows } = await getSettingsTab();
  const keyHeader = headers[0];
  const valueHeader = headers[1];
  if (keyHeader !== "key" || valueHeader !== "value") {
    throw new Error(
      `Unexpected Settings layout: expected key/value headers, found ${headers.join(", ")}`
    );
  }

  const row = rows.find((r) => r.data.key === KEY);
  if (!row) {
    throw new Error(`No "${KEY}" row found on the Settings tab.`);
  }

  const current = row.data.value;
  if (current === value) {
    console.log(`${KEY} is already set to ${value} — nothing to do.`);
    return;
  }

  const range = `Settings!${VALUE_COLUMN}${row.rowNumber}`;
  await writeCell(range, value);

  console.log(`${KEY}: ${current || "(empty)"} -> ${value}  [${range}]`);
  console.log(`Guests will see: ${formatDeadline(value)}`);
  console.log(`Closes at:       ${resolveDeadline(value)?.toISOString()}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
