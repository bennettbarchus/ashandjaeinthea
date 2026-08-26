// Rebuilds the "Dashboard" tab in the RSVP Google Sheet: a live, formula-driven
// summary (households/guests responded, per-event Yes/No/Pending, meal and
// steak-temperature breakdowns, dietary notes, and a not-yet-responded list).
// Single vertical column (the "By Event" table is the only part wider than
// two columns) — read top to bottom, no scrolling right required.
//
// Safe to rerun any time — it fully rebuilds the tab from the current
// Events/Households/Guests/Invitations structure. Rerun this after adding or
// removing an event so the "By Event" table picks up the new row count, or
// if the Dietary Notes list ever looks like it's running out of room (its
// reserved row count is sized off the live data each time this runs).
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
    getInvitationsTab,
  } = await import("../lib/google-sheets");

  const [events, invitations] = await Promise.all([getEventsTab(), getInvitationsTab()]);
  const eventCount = events.rows.length;
  console.log(`Building dashboard for ${eventCount} events:`, events.rows.map((r) => r.data.event_id));

  // These lists are BOUNDED (non-spilling) formula blocks — unlike a plain
  // FILTER(), which is unsafe here because something else is stacked
  // underneath each of them — so their row counts have to be fixed at build
  // time. Size each off how many unique entries exist right now, with
  // generous headroom, rather than guessing a constant.
  const uniqueGuestsWith = (attendance: "YES" | "NO") => {
    const set = new Set<string>();
    for (const r of invitations.rows) {
      if (r.data.attendance === attendance) set.add(r.data.guest_name);
    }
    return set.size;
  };
  const comingCount = uniqueGuestsWith("YES");
  const notComingCount = uniqueGuestsWith("NO");
  const comingReservedRows = Math.max(20, comingCount * 4);
  const notComingReservedRows = Math.max(15, notComingCount * 4);
  console.log(`Coming: ${comingCount} unique guests now, reserving ${comingReservedRows} rows.`);
  console.log(`Not coming: ${notComingCount} unique guests now, reserving ${notComingReservedRows} rows.`);

  const uniqueNotes = new Set<string>();
  for (const r of invitations.rows) {
    const note = r.data.dietary_notes.trim();
    if (!note || /^(none|n\/?a)$/i.test(note)) continue;
    uniqueNotes.add(`${r.data.guest_name}: ${note}`);
  }
  const dietaryReservedRows = Math.max(15, uniqueNotes.size * 4);
  console.log(`Dietary notes: ${uniqueNotes.size} unique entries now, reserving ${dietaryReservedRows} rows.`);

  await ensureTabs([TAB]);
  await clearTab(TAB);

  const rows: (string | number)[][] = [];
  const R = () => rows.length + 1; // 1-indexed row number of the NEXT row to be pushed

  rows.push(["Ashley & Jared — RSVP Dashboard"]);
  rows.push(["This tab updates automatically — no need to edit anything here."]);
  rows.push([]);

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
  const notRespondedRow = R();
  rows.push(["Households Not Yet Responded", `=B${overviewStart}-B${overviewStart + 2}`]);
  const responseRateRow = R();
  rows.push(["Response Rate", `=IFERROR(B${overviewStart + 2}/B${overviewStart},0)`]);
  const deadlineRow = R();
  rows.push(["RSVP Deadline", '=IFERROR(VLOOKUP("rsvp_deadline",Settings!A:B,2,FALSE),"Not set")']);
  rows.push(["Days Remaining", `=IFERROR(DATEVALUE(B${deadlineRow})-TODAY(),"")`]);
  rows.push([]);

  // --- By event (one row per row currently in the Events tab; the only
  // section wider than 2 columns, since it's inherently a comparison table) ---
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

  // --- Coming / Not Coming (per-guest, deduped across events) ---
  // A guest who said YES to all their events collapses to one line here
  // (same combined text each time); a guest with mixed answers (yes to one
  // event, no to another) correctly appears once in each list. This is
  // deliberately placed above Meal Choices / Steak Temperature — who's
  // actually coming matters more than what they're eating.
  rows.push(["COMING (RSVP YES)"]);
  rows.push([`="Count: "&IFERROR(COUNTA(UNIQUE(FILTER(Invitations!B2:B,Invitations!E2:E="YES"))),0)`]);
  for (let i = 1; i <= comingReservedRows; i++) {
    rows.push([`=IFERROR(INDEX(UNIQUE(FILTER(Invitations!B2:B,Invitations!E2:E="YES")),${i}),"")`]);
  }
  rows.push([]);

  rows.push(["NOT COMING (RSVP NO)"]);
  rows.push([`="Count: "&IFERROR(COUNTA(UNIQUE(FILTER(Invitations!B2:B,Invitations!E2:E="NO"))),0)`]);
  for (let i = 1; i <= notComingReservedRows; i++) {
    rows.push([`=IFERROR(INDEX(UNIQUE(FILTER(Invitations!B2:B,Invitations!E2:E="NO")),${i}),"")`]);
  }
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
  rows.push([]);

  // --- Dietary notes / accommodations ---
  // One line per unique (guest, note) pair — a guest's note is usually
  // identical across all 3 of their event rows, so dedupe rather than list
  // it 3x. Bounded (INDEX+IFERROR per row, not a spilling FILTER) because
  // the Households list below needs to be able to grow freely underneath it.
  rows.push(["DIETARY NOTES / ACCOMMODATIONS"]);
  const dietaryCondition =
    'Invitations!H2:H<>"",NOT(REGEXMATCH(LOWER(TRIM(Invitations!H2:H)),"^(none|n/?a)$"))';
  const dietarySource = `Invitations!B2:B&": "&Invitations!H2:H`;
  rows.push([`="Count: "&IFERROR(COUNTA(UNIQUE(FILTER(${dietarySource},${dietaryCondition}))),0)`]);
  const dietaryListStart = R();
  for (let i = 1; i <= dietaryReservedRows; i++) {
    rows.push([`=IFERROR(INDEX(UNIQUE(FILTER(${dietarySource},${dietaryCondition})),${i}),"")`]);
  }
  rows.push([]);

  // --- Households not yet responded ---
  // The one genuinely unbounded FILTER spill on the sheet — safe because
  // it's the LAST thing on the tab, so there's nothing below it to collide
  // with no matter how long the list gets.
  rows.push(["HOUSEHOLDS NOT YET RESPONDED"]);
  rows.push([`="Count: "&B${notRespondedRow}`]);
  // Households!A2:A<>"" bounds the FILTER to real data rows — without it,
  // the open-ended L2:L range also matches every blank row below row 113
  // out to the sheet's full row count (blank <> "TRUE" is true), padding
  // the list with junk " — , " entries.
  rows.push([
    '=IFERROR(FILTER(Households!C2:C&" — "&Households!F2:F&", "&Households!G2:G,Households!L2:L<>"TRUE",Households!A2:A<>""),"All responded! 🎉")',
  ]);

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
    bold(1, 1, 0, 1),
    ...sectionHeaderRows.map((row) => bold(row, row, 0, 1)),
    ...sectionHeaderRows.map((row) => fill(row, row, 0, 6, { red: 0.92, green: 0.92, blue: 0.86 })),
    bold(byEventHeaderRow, byEventHeaderRow, 0, 6), // by-event table header
    bold(mealEventRow, mealEventRow, 0, 1),
    percent(responseRateRow, 1),
    colWidth(0, 1, 480), // A — long text lives here (labels, notes, household lines)
    colWidth(1, 2, 140), // B — values / By Event's Date column
  ];

  await batchUpdateSpreadsheet(requests as any);
  console.log("Applied formatting.");
}

main().catch((e) => {
  console.error("ERROR:", e.message, e.stack);
  process.exitCode = 1;
});
