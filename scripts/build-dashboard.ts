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
  // Only rows the guest is actually invited to count. A revoked invitation
  // can leave a stale attendance answer behind (removing an invite doesn't
  // erase the reply given while it stood), and those must not be counted.
  const comingSet = new Set<string>(); // has a YES to at least one invited event
  const noSet = new Set<string>(); // has a NO to at least one invited event
  for (const r of invitations.rows) {
    if (r.data.invited !== "TRUE") continue;
    if (r.data.attendance === "YES") comingSet.add(r.data.guest_name);
    if (r.data.attendance === "NO") noSet.add(r.data.guest_name);
  }
  const comingCount = comingSet.size;
  // "Not Coming" means declining every event, not just one (e.g. skipping
  // the after party but attending the ceremony still counts as coming) —
  // guests with a NO to at least one event AND a YES to none.
  const notComingCount = [...noSet].filter((g) => !comingSet.has(g)).length;
  const comingReservedRows = Math.max(20, comingCount * 4);
  const notComingReservedRows = Math.max(15, notComingCount * 4);
  console.log(`Coming: ${comingCount} unique guests now, reserving ${comingReservedRows} rows.`);
  console.log(`Not coming: ${notComingCount} unique guests now, reserving ${notComingReservedRows} rows.`);

  const uniqueNotes = new Set<string>();
  for (const r of invitations.rows) {
    if (r.data.invited !== "TRUE") continue;
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
    // Every figure here is scoped to rows with invited=TRUE, so guests who
    // aren't invited to an event don't inflate its totals — and neither do
    // stale answers left on invitations that were later revoked.
    //
    // SUMPRODUCT with a plain string comparison rather than COUNTIFS:
    // "TRUE" as a COUNTIFS criterion is parsed as the boolean keyword and
    // never matches these text cells, the same trap the Households
    // Responded formula above sidesteps the same way.
    const invitedToEvent = `(Invitations!$C$2:$C=Events!A${evRow})*(Invitations!$D$2:$D="TRUE")`;
    rows.push([
      `=Events!B${evRow}`,
      `=Events!C${evRow}`,
      `=SUMPRODUCT(${invitedToEvent})`,
      `=SUMPRODUCT(${invitedToEvent}*(Invitations!$E$2:$E="YES"))`,
      `=SUMPRODUCT(${invitedToEvent}*(Invitations!$E$2:$E="NO"))`,
      `=SUMPRODUCT(${invitedToEvent}*(Invitations!$E$2:$E=""))`,
    ]);
  }
  rows.push(["(To add a future event: add one more row above referencing the new Events tab row, or rerun scripts/build-dashboard.ts)"]);
  rows.push([]);

  // --- Coming / Not Coming (per-guest, deduped across events) ---
  // A guest who said YES to all their events collapses to one line here
  // (same combined text each time). "Coming" is anyone with a YES to AT
  // LEAST ONE event — declining the after party but attending the ceremony
  // still counts as coming. This is deliberately placed above Meal Choices
  // / Steak Temperature — who's actually coming matters more than food.
  rows.push(["COMING (RSVP YES)"]);
  // The invited=TRUE term matters here: a guest whose only YES sits on an
  // event they were later un-invited from is not coming to anything, and
  // without it they'd still be listed. Inside FILTER a plain ="TRUE"
  // comparison works fine — it's an array comparison against text, not a
  // COUNTIFS criterion.
  const comingCondition = 'Invitations!E2:E="YES",Invitations!D2:D="TRUE"';
  rows.push([`="Count: "&IFERROR(COUNTA(UNIQUE(FILTER(Invitations!B2:B,${comingCondition}))),0)`]);
  for (let i = 1; i <= comingReservedRows; i++) {
    rows.push([`=IFERROR(INDEX(UNIQUE(FILTER(Invitations!B2:B,${comingCondition})),${i}),"")`]);
  }
  rows.push([]);

  // "Not Coming" is the mirror image of "Coming": only guests who declined
  // EVERY event (a NO on at least one, and a YES on none) — not anyone who
  // simply skipped one event while still attending others. The per-row
  // ARRAYFORMULA(COUNTIFS(...)) checks, for each NO row, whether that same
  // guest has a YES anywhere else in the sheet; guests with a mixed record
  // are excluded here (they're already covered by the Coming list above).
  rows.push(["NOT COMING (RSVP NO)"]);
  // The per-row COUNTIFS has to match the text "TRUE" as a criterion, where
  // the bare keyword would be read as a boolean and match nothing — so it
  // uses the wildcard "TRU*", which matches the text and not "FALSE".
  // (SUMPRODUCT can't be used here: it won't broadcast per row.)
  const notComingCondition =
    'Invitations!E2:E="NO",Invitations!D2:D="TRUE",' +
    'ARRAYFORMULA(COUNTIFS(Invitations!$B$2:$B,Invitations!$B$2:$B,' +
    'Invitations!$E$2:$E,"YES",Invitations!$D$2:$D,"TRU*"))=0';
  rows.push([`="Count: "&IFERROR(COUNTA(UNIQUE(FILTER(Invitations!B2:B,${notComingCondition}))),0)`]);
  for (let i = 1; i <= notComingReservedRows; i++) {
    rows.push([`=IFERROR(INDEX(UNIQUE(FILTER(Invitations!B2:B,${notComingCondition})),${i}),"")`]);
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
  const invitedToMeal = `(Invitations!$C$2:$C=${mealRef})*(Invitations!$D$2:$D="TRUE")`;
  rows.push(["Steak", `=SUMPRODUCT(${invitedToMeal}*(Invitations!$F$2:$F="Steak"))`]);
  rows.push(["Fish", `=SUMPRODUCT(${invitedToMeal}*(Invitations!$F$2:$F="Fish"))`]);
  rows.push(["Vegetarian", `=SUMPRODUCT(${invitedToMeal}*(Invitations!$F$2:$F="Vegetarian"))`]);
  rows.push([
    "Not Yet Chosen (attending)",
    `=SUMPRODUCT(${invitedToMeal}*(Invitations!$E$2:$E="YES")*(Invitations!$F$2:$F=""))`,
  ]);
  rows.push([]);

  // --- Steak temperature ---
  rows.push(["STEAK TEMPERATURE"]);
  const invitedSteak = '(Invitations!$D$2:$D="TRUE")*(Invitations!$F$2:$F="Steak")';
  rows.push(["Medium", `=SUMPRODUCT(${invitedSteak}*(Invitations!$G$2:$G="Medium"))`]);
  rows.push(["Medium well", `=SUMPRODUCT(${invitedSteak}*(Invitations!$G$2:$G="Medium well"))`]);
  rows.push(["Well done", `=SUMPRODUCT(${invitedSteak}*(Invitations!$G$2:$G="Well done"))`]);
  rows.push(["Not Yet Chosen", `=SUMPRODUCT(${invitedSteak}*(Invitations!$G$2:$G=""))`]);
  rows.push([]);

  // --- Dietary notes / accommodations ---
  // One line per unique (guest, note) pair — a guest's note is usually
  // identical across all 3 of their event rows, so dedupe rather than list
  // it 3x. Bounded (INDEX+IFERROR per row, not a spilling FILTER) because
  // the Households list below needs to be able to grow freely underneath it.
  rows.push(["DIETARY NOTES / ACCOMMODATIONS"]);
  const dietaryCondition =
    'Invitations!H2:H<>"",Invitations!D2:D="TRUE",' +
    'NOT(REGEXMATCH(LOWER(TRIM(Invitations!H2:H)),"^(none|n/?a)$"))';
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
  // clearTab() (called earlier) only clears cell VALUES, never formatting —
  // so bold/fill/borders from a previous build (row counts and section
  // positions shift as sections get added) or a manual edit in the Sheets
  // UI stay stuck on whatever content happens to land there now. Reset
  // formatting across a generous range first so every rebuild starts clean.
  const resetFormat = (endRow: number, endCol: number) => ({
    repeatCell: {
      range: { sheetId, startRowIndex: 0, endRowIndex: endRow, startColumnIndex: 0, endColumnIndex: endCol },
      cell: { userEnteredFormat: {} },
      fields: "userEnteredFormat",
    },
  });

  const sectionHeaderRows = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.length === 1 && typeof r[0] === "string" && r[0] === (r[0] as string).toUpperCase() && (r[0] as string).length > 0)
    .map(({ i }) => i + 1);

  const requests = [
    resetFormat(Math.max(rows.length + 20, 400), 10),
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
