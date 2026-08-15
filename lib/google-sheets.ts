import { google, sheets_v4 } from "googleapis";
import type {
  EventRow,
  GuestRow,
  HouseholdRow,
  InvitationRow,
  RsvpSettings,
  SettingsRow,
  SubmitEventResponse,
  SubmitPlusOneName,
} from "@/types/rsvp";

if (typeof window !== "undefined") {
  throw new Error("lib/google-sheets.ts must only be imported on the server.");
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function getAuth() {
  const projectId = process.env.GOOGLE_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey || !SHEET_ID) {
    throw new Error(
      "Missing Google Sheets credentials. Check .env.local against .env.example."
    );
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

let cachedClient: sheets_v4.Sheets | null = null;

function getSheetsClient(): sheets_v4.Sheets {
  if (!cachedClient) {
    cachedClient = google.sheets({ version: "v4", auth: getAuth() });
  }
  return cachedClient;
}

function columnToLetter(col: number): string {
  let letter = "";
  let n = col;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

export interface TabRow<T> {
  rowNumber: number; // 1-indexed sheet row, header is row 1
  data: T;
}

export interface TabData<T> {
  headers: string[];
  rows: TabRow<T>[];
}

async function readTab<T>(tabName: string): Promise<TabData<T>> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A1:Z10000`,
  });
  const values = res.data.values ?? [];
  if (values.length === 0) return { headers: [], rows: [] };

  const [headerRow, ...dataRows] = values;
  const headers = headerRow.map((h) => String(h ?? "").trim());

  const rows: TabRow<T>[] = [];
  dataRows.forEach((row, i) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, colIndex) => {
      obj[h] = String(row[colIndex] ?? "").trim();
    });
    const isBlank = Object.values(obj).every((v) => v === "");
    if (!isBlank) {
      rows.push({ rowNumber: i + 2, data: obj as T });
    }
  });

  return { headers, rows };
}

async function writeCells(
  tabName: string,
  headers: string[],
  updates: { rowNumber: number; values: Partial<Record<string, string>> }[]
): Promise<void> {
  if (!updates.length) return;
  const sheets = getSheetsClient();
  const data: sheets_v4.Schema$ValueRange[] = [];

  for (const { rowNumber, values } of updates) {
    for (const [key, value] of Object.entries(values)) {
      const colIndex = headers.indexOf(key);
      if (colIndex === -1) continue;
      data.push({
        range: `${tabName}!${columnToLetter(colIndex + 1)}${rowNumber}`,
        values: [[value ?? ""]],
      });
    }
  }

  if (!data.length) return;
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: "RAW", data },
  });
}

/**
 * Clears all cell content in a tab. Used by one-off maintenance scripts
 * before a full rewrite whose row/column count may be smaller than what's
 * currently there (overwriteTab alone only touches cells within the new
 * data's extent, so a shrinking write would otherwise leave stale trailing
 * rows behind).
 */
export async function clearTab(tabName: string): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: tabName,
    requestBody: {},
  });
}

/** Used only by scripts/seed-sheet.ts to create any tabs that don't exist yet. */
export async function ensureTabs(tabNames: string[]): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existing = new Set(
    (spreadsheet.data.sheets ?? []).map((s) => s.properties?.title).filter(Boolean)
  );
  const missing = tabNames.filter((name) => !existing.has(name));
  if (!missing.length) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
    },
  });
}

/** Used only by scripts/seed-sheet.ts to populate a tab from scratch. */
export async function overwriteTab(
  tabName: string,
  rows: (string | number | boolean)[][]
): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });
}

export const getHouseholdsTab = () => readTab<HouseholdRow>("Households");
export const getGuestsTab = () => readTab<GuestRow>("Guests");
export const getEventsTab = () => readTab<EventRow>("Events");
export const getInvitationsTab = () => readTab<InvitationRow>("Invitations");

export async function getSettings(): Promise<RsvpSettings> {
  const { rows } = await readTab<SettingsRow>("Settings");
  const map = new Map(rows.map((r) => [r.data.key, r.data.value]));

  const bool = (key: string, fallback: boolean) => {
    const v = map.get(key);
    if (v === undefined || v === "") return fallback;
    return v.trim().toUpperCase() === "TRUE";
  };
  const str = (key: string, fallback: string) => {
    const v = map.get(key);
    return v && v.trim() ? v.trim() : fallback;
  };
  const list = (key: string, fallback: string[]) => {
    const v = map.get(key);
    if (!v || !v.trim()) return fallback;
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  return {
    rsvpOpen: bool("rsvp_open", true),
    rsvpDeadline: map.get("rsvp_deadline")?.trim() || null,
    supportEmail: str("support_email", ""),
    confirmationMessage: str(
      "confirmation_message",
      "Your RSVP has been received."
    ),
    registryUrl: str("registry_url", "https://example.com/registry"),
    registryMessage: str(
      "registry_message",
      "Your presence is the greatest gift. For those who have asked, our registry can be found here."
    ),
    steakOptions: list("steak_options", [
      "Medium rare",
      "Medium",
      "Medium well",
      "Well done",
    ]),
    mealOptions: list("meal_options", ["Steak", "Fish", "Vegetarian"]),
  };
}

export async function submitRsvp(params: {
  householdId: string;
  responses: SubmitEventResponse[];
  plusOneNames?: SubmitPlusOneName[];
}): Promise<string> {
  const nowIso = new Date().toISOString();
  const [households, guests, invitations] = await Promise.all([
    getHouseholdsTab(),
    getGuestsTab(),
    getInvitationsTab(),
  ]);

  const household = households.rows.find(
    (r) => r.data.household_id === params.householdId
  );
  if (!household) {
    throw new Error("Household not found");
  }

  const invUpdates = params.responses
    .map((resp) => {
      const match = invitations.rows.find(
        (r) =>
          r.data.guest_id === resp.guestId && r.data.event_id === resp.eventId
      );
      if (!match) return null;
      return {
        rowNumber: match.rowNumber,
        values: {
          attendance: resp.attendance,
          meal_choice: resp.mealChoice ?? "",
          steak_temperature: resp.steakTemperature ?? "",
          dietary_notes: resp.dietaryNotes ?? "",
          updated_at: nowIso,
        },
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  if (invUpdates.length) {
    await writeCells("Invitations", invitations.headers, invUpdates);
  }

  if (params.plusOneNames?.length) {
    const guestUpdates = params.plusOneNames
      .map((po) => {
        const match = guests.rows.find((r) => r.data.guest_id === po.guestId);
        if (!match) return null;
        return {
          rowNumber: match.rowNumber,
          values: { display_name: po.displayName },
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
    if (guestUpdates.length) {
      await writeCells("Guests", guests.headers, guestUpdates);
    }
  }

  await writeCells("Households", households.headers, [
    {
      rowNumber: household.rowNumber,
      values: {
        submitted: "TRUE",
        submitted_at:
          household.data.submitted === "TRUE"
            ? household.data.submitted_at
            : nowIso,
        updated_at: nowIso,
      },
    },
  ]);

  return nowIso;
}
