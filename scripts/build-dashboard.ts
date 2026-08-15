// Rebuilds the "Dashboard" tab in the RSVP Google Sheet: a live, formula-driven
// summary (households/guests responded, per-event Yes/No/Pending, meal and
// steak-temperature breakdowns, dietary notes, and a not-yet-responded list).
// Safe to rerun any time — it fully rebuilds the tab from the current
// Events/Households/Guests/Invitations structure. Rerun this after adding or
// removing an event so the "By Event" table picks up the new row count.
//
// Usage: npx tsx scripts/build-dashboard.ts [--dry-run]
import { loadEnvConfig } from "@next/env";

const TAB = "Dashboard";

async function main() {
  loadEnvConfig(process.cwd());
  const {
    ensureTabs,
    clearTab,
    overwriteTab,
    getSheetId,
    batchUpdateSpreadsheet,
    getEventsTab,
  } = await import("../lib/google-sheets");

  const events = await getEventsTab();
  const eventCount = events.rows.length;
  console.log(`Building dashboard for ${eventCount} events:`, events.rows.map((r) => r.data.event_id));

  await ensureTabs([TAB]);
  await clearTab(TAB);

  const rows: (string | number)[][] = [];
  const R = () => rows.length + 1; // 1-indexed row number of the NEXT row to be pushed

  // --- Row 1-3: right-side dynamic lists (headers here, left title also here) ---
  rows.push([
    "Ashley & Jared — RSVP Dashboard", "", "", "",
    "DIETARY NOTES / ACCOMMODATIONS", "", "", "",
    "HOUSEHOLDS NOT YET RESPONDED",
  ]);
  rows.push([
    "This tab updates automatically — no need to edit anything here.", "", "", "",
    "Guest", "Event", "Note", "",
    "Household", "Location",
  ]);
  rows.push([
    "", "", "", "",
    '=IFERROR(FILTER(Invitations!B2:B,Invitations!H2:H<>""),"None yet")',
    '=IFERROR(FILTER(Invitations!C2:C,Invitations!H2:H<>""),"")',
    '=IFERROR(FILTER(Invitations!H2:H,Invitations!H2:H<>""),"")',
    "",
    '=IFERROR(FILTER(Households!C2:C,Households!L2:L<>"TRUE"),"All responded! 🎉")',
    '=IFERROR(FILTER(Households!F2:F&", "&Households!G2:G,Households!L2:L<>"TRUE"),"")',
  ]);

  // --- Overview ---
  rows.push(["OVERVIEW"]);
  const overviewStart = R();
  rows.push(["Total Households", "=COUNTA(Households!A2:A)"]);
  rows.push(["Total Guests Invited", "=COUNTA(Guests!A2:A)"]);
  // Households!L (submitted) stores the literal text "TRUE"/"FALSE" — bare
  // "TRUE"/"FALSE" in COUNTIF/COUNTIFS criteria is parsed as a boolean
  // keyword and won't match a text cell, so use SUMPRODUCT with a plain
  // string-equality comparison instead.
  rows.push(["Households Responded", '=SUMPRODUCT(--(Households!L2:L="TRUE"))']);
  rows.push(["Households Not Yet Responded", `=B${overviewStart}-B${overviewStart + 2}`]);
  const responseRateRow = R();
  rows.push(["Response Rate", `=IFERROR(B${overviewStart + 2}/B${overviewStart},0)`]);
  const deadlineRow = R();
  rows.push(["RSVP Deadline", '=IFERROR(VLOOKUP("rsvp_deadline",Settings!A:B,2,FALSE),"Not set")']);
  rows.push(["Days Remaining", `=IFERROR(DATEVALUE(B${deadlineRow})-TODAY(),"")`]);
  rows.push([]);

  // --- By event (one row per row currently in the Events tab; add a row here + rerun this script if a new event is added) ---
  rows.push(["BY EVENT"]);
  const byEventHeaderRow = R();
  rows.push(["Event", "Date", "Invited", "Yes", "No", "Pending"]);
  for (let i = 0; i < eventCount; i++) {
    const evRow = i + 2; // Events tab data starts at row 2
    // "Invited" and "Pending" deliberately don't filter on Invitations!D
    // (invited) via COUNTIFS — same "TRUE" keyword-vs-text-cell mismatch as
    // above. Every invitation row is currently invited=TRUE by construction
    // (no invited=FALSE rows exist), so a plain per-event row count is
    // equivalent and avoids the issue.
    rows.push([
      `=Events!B${evRow}`,
      `=Events!C${evRow}`,
      `=COUNTIF(Invitations!C:C,Events!A${evRow})`,
      `=COUNTIFS(Invitations!C:C,Events!A${evRow},Invitations!E:E,"YES")`,
      `=COUNTIFS(Invitations!C:C,Events!A${evRow},Invitations!E:E,"NO")`,
      `=COUNTIFS(Invitations!C:C,Events!A${evRow},Invitations!E:E,"")`,
    ]);
  }
  rows.push(["(To add a future event: add one more row above referencing the new Events tab row, or rerun scripts/build-dashboard.ts)"]);
  rows.push([]);

  // --- Meal choices (auto-detects whichever event has requires_meal=TRUE) ---
  rows.push(["MEAL CHOICES"]);
  const mealEventRow = R();
  rows.push([
    "Meal Event",
    '=INDEX(Events!B2:B,MATCH("TRUE",Events!F2:F,0))',
    '=INDEX(Events!A2:A,MATCH("TRUE",Events!F2:F,0))',
  ]);
  const mealRef = `$C$${mealEventRow}`;
  rows.push(["Steak", `=COUNTIFS(Invitations!C:C,${mealRef},Invitations!F:F,"Steak")`]);
  rows.push(["Fish", `=COUNTIFS(Invitations!C:C,${mealRef},Invitations!F:F,"Fish")`]);
  rows.push(["Vegetarian", `=COUNTIFS(Invitations!C:C,${mealRef},Invitations!F:F,"Vegetarian")`]);
  rows.push(["Not Yet Chosen (attending)", `=COUNTIFS(Invitations!C:C,${mealRef},Invitations!E:E,"YES",Invitations!F:F,"")`]);
  rows.push([]);

  // --- Steak temperature ---
  rows.push(["STEAK TEMPERATURE"]);
  rows.push(["Medium", '=COUNTIFS(Invitations!F:F,"Steak",Invitations!G:G,"Medium")']);
  rows.push(["Medium well", '=COUNTIFS(Invitations!F:F,"Steak",Invitations!G:G,"Medium well")']);
  rows.push(["Well done", '=COUNTIFS(Invitations!F:F,"Steak",Invitations!G:G,"Well done")']);
  rows.push(["Not Yet Chosen", '=COUNTIFS(Invitations!F:F,"Steak",Invitations!G:G,"")']);

  console.log(`\nTotal rows: ${rows.length}`);

  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify(rows, null, 2));
    console.log("\nDRY RUN — no writes performed.");
    return;
  }

  await overwriteTab(TAB, rows, "USER_ENTERED");
  console.log("Wrote Dashboard values/formulas.");

  const sheetId = await getSheetId(TAB);

  const bold = (startRow: number, endRow: number, startCol: number, endCol: number) => ({
    repeatCell: {
      range: { sheetId, startRowIndex: startRow - 1, endRowIndex: endRow, startColumnIndex: startCol, endColumnIndex: endCol },
      cell: { userEnteredFormat: { textFormat: { bold: true } } },
      fields: "userEnteredFormat.textFormat.bold",
    },
  });
  const fill = (startRow: number, endRow: number, startCol: number, endCol: number, color: { red: number; green: number; blue: number }) => ({
    repeatCell: {
      range: { sheetId, startRowIndex: startRow - 1, endRowIndex: endRow, startColumnIndex: startCol, endColumnIndex: endCol },
      cell: { userEnteredFormat: { backgroundColor: color } },
      fields: "userEnteredFormat.backgroundColor",
    },
  });
  const percent = (row: number, col: number) => ({
    repeatCell: {
      range: { sheetId, startRowIndex: row - 1, endRowIndex: row, startColumnIndex: col, endColumnIndex: col + 1 },
      cell: { userEnteredFormat: { numberFormat: { type: "PERCENT", pattern: "0%" } } },
      fields: "userEnteredFormat.numberFormat",
    },
  });
  const colWidth = (startCol: number, endCol: number, px: number) => ({
    updateDimensionProperties: {
      range: { sheetId, dimension: "COLUMNS", startIndex: startCol, endIndex: endCol },
      properties: { pixelSize: px },
      fields: "pixelSize",
    },
  });

  const sectionHeaderRows = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.length === 1 && typeof r[0] === "string" && r[0] === (r[0] as string).toUpperCase() && (r[0] as string).length > 0)
    .map(({ i }) => i + 1);

  const requests = [
    bold(1, 1, 0, 10),
    ...sectionHeaderRows.map((row) => bold(row, row, 0, 1)),
    ...sectionHeaderRows.map((row) => fill(row, row, 0, 10, { red: 0.92, green: 0.92, blue: 0.86 })),
    bold(2, 2, 4, 10), // right-list column headers
    bold(byEventHeaderRow, byEventHeaderRow, 0, 6), // by-event table header
    bold(mealEventRow, mealEventRow, 0, 1),
    percent(responseRateRow, 1),
    colWidth(0, 1, 260),
    colWidth(4, 5, 200),
    colWidth(8, 9, 200),
  ];

  await batchUpdateSpreadsheet(requests as any);
  console.log("Applied formatting.");
}

main().catch((e) => {
  console.error("ERROR:", e.message, e.stack);
  process.exitCode = 1;
});
