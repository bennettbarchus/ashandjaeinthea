/**
 * One-off migration: appends a `personal_message` column to the
 * "Households" tab, used by the /welcome flow's personal-message screen.
 *
 * Idempotent — re-running is a no-op once the column exists.
 *
 * The column is APPENDED rather than inserted: scripts/build-dashboard.ts
 * references Households columns by fixed letter (A, C, F, G, L), so
 * inserting anywhere earlier would silently break the Dashboard formulas.
 *
 * Run with: npx tsx --env-file=.env.local scripts/add-personal-message-column.ts
 */
import { getHouseholdsTab, writeCell } from "@/lib/google-sheets";

const COLUMN = "personal_message";

function columnToLetter(index: number): string {
  let letter = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

async function main() {
  const households = await getHouseholdsTab();

  if (households.headers.includes(COLUMN)) {
    console.log(`"${COLUMN}" already exists in Households — nothing to do.`);
    return;
  }

  const letter = columnToLetter(households.headers.length);
  const range = `Households!${letter}1`;
  await writeCell(range, COLUMN);

  console.log(`Added "${COLUMN}" header at ${range}.`);
  console.log(`Households now has ${households.headers.length + 1} columns.`);
  console.log("Fill in per-household messages by hand; blank means the screen is skipped.");
}

main().catch((err) => {
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
