/**
 * One-time (or re-run-anytime) setup script that creates the 5 RSVP tabs
 * in the target Google Sheet (if missing) and fills them with headers +
 * realistic sample data, so the /rsvp flow can be tested end-to-end
 * locally before real guest data is entered.
 *
 * Usage:
 *   npm run seed:sheet
 *
 * Reads credentials from .env.local (GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL,
 * GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID) — see GOOGLE_SHEETS_SETUP.md.
 *
 * WARNING: this OVERWRITES the contents of the Households, Guests, Events,
 * Invitations, and Settings tabs in the configured sheet. Use a duplicate
 * test spreadsheet during development, per the project's privacy/security
 * requirements. Do not point GOOGLE_SHEET_ID at the production sheet when
 * running this.
 */
import { loadEnvConfig } from "@next/env";

type Row = (string | number)[];

async function main() {
  loadEnvConfig(process.cwd());

  // Imported dynamically so env vars are loaded before lib/google-sheets.ts
  // reads process.env at module-init time.
  const { ensureTabs, overwriteTab } = await import("../lib/google-sheets");

  const TAB_NAMES = ["Households", "Guests", "Events", "Invitations", "Settings"];
  await ensureTabs(TAB_NAMES);

  const households: Row[] = [
    [
      "household_id",
      "household_name",
      "primary_guest_name",
      "search_name",
      "city",
      "state",
      "zip_code",
      "phone_last_four",
      "email",
      "verification_method",
      "submitted",
      "submitted_at",
      "updated_at",
    ],
    [
      "hh_001",
      "Barchus Household",
      "Jared Barchus",
      "jared barchus",
      "Atlanta",
      "GA",
      "30308",
      "1234",
      "jared@example.com",
      "",
      "FALSE",
      "",
      "",
    ],
    // Two "John Smith" households on purpose, to exercise secondary verification.
    [
      "hh_002",
      "Smith Household (Ohio)",
      "John Smith",
      "john smith",
      "Columbus",
      "OH",
      "43004",
      "5678",
      "john.smith.oh@example.com",
      "",
      "FALSE",
      "",
      "",
    ],
    [
      "hh_003",
      "Smith Household (Texas)",
      "John Smith",
      "john smith",
      "Austin",
      "TX",
      "78701",
      "9012",
      "john.smith.tx@example.com",
      "",
      "FALSE",
      "",
      "",
    ],
    // Already-submitted household, to exercise the "update a prior RSVP" flow.
    [
      "hh_004",
      "Rivera Household",
      "Maria Rivera",
      "maria rivera",
      "Miami",
      "FL",
      "33101",
      "3456",
      "maria@example.com",
      "",
      "TRUE",
      "2026-09-01T12:00:00.000Z",
      "2026-09-01T12:00:00.000Z",
    ],
  ];

  const guests: Row[] = [
    [
      "guest_id",
      "household_id",
      "first_name",
      "last_name",
      "display_name",
      "is_plus_one",
      "plus_one_name_editable",
    ],
    ["guest_001", "hh_001", "Jared", "Barchus", "Jared Barchus", "FALSE", "FALSE"],
    ["guest_002", "hh_001", "Ashley", "Bennett", "Ashley Bennett", "FALSE", "FALSE"],
    ["guest_003", "hh_002", "John", "Smith", "John Smith", "FALSE", "FALSE"],
    ["guest_004", "hh_003", "John", "Smith", "John Smith", "FALSE", "FALSE"],
    ["guest_005", "hh_004", "Maria", "Rivera", "Maria Rivera", "FALSE", "FALSE"],
    // Plus-one with an editable placeholder name.
    ["guest_006", "hh_004", "", "", "Guest of Maria", "TRUE", "TRUE"],
  ];

  const events: Row[] = [
    [
      "event_id",
      "event_name",
      "event_date",
      "event_time",
      "location",
      "requires_meal",
      "display_order",
      "active",
    ],
    [
      "friday_welcome",
      "Friday Welcome Celebration",
      "November 13, 2026",
      "6:00 PM",
      "The Forth Hotel, Atlanta",
      "FALSE",
      "1",
      "TRUE",
    ],
    [
      "ceremony",
      "Saturday Ceremony",
      "November 14, 2026",
      "4:00 PM",
      "Venue TBD, Atlanta",
      "FALSE",
      "2",
      "TRUE",
    ],
    [
      "reception",
      "Saturday Reception",
      "November 14, 2026",
      "6:00 PM",
      "Venue TBD, Atlanta",
      "TRUE",
      "3",
      "TRUE",
    ],
    [
      "family_brunch",
      "Sunday Family Brunch",
      "November 15, 2026",
      "10:00 AM",
      "Location TBD, Atlanta",
      "FALSE",
      "4",
      "TRUE",
    ],
  ];

  const invitationHeader = [
    "guest_id",
    "event_id",
    "invited",
    "attendance",
    "meal_choice",
    "steak_temperature",
    "dietary_notes",
    "updated_at",
  ];

  const invitationRow = (
    guestId: string,
    eventId: string,
    invited: boolean,
    extra: Partial<{
      attendance: string;
      mealChoice: string;
      steakTemperature: string;
      dietaryNotes: string;
      updatedAt: string;
    }> = {}
  ): Row => [
    guestId,
    eventId,
    invited ? "TRUE" : "FALSE",
    extra.attendance ?? "",
    extra.mealChoice ?? "",
    extra.steakTemperature ?? "",
    extra.dietaryNotes ?? "",
    extra.updatedAt ?? "",
  ];

  const invitations: Row[] = [
    invitationHeader,
    // Jared — invited to everything.
    invitationRow("guest_001", "friday_welcome", true),
    invitationRow("guest_001", "ceremony", true),
    invitationRow("guest_001", "reception", true),
    invitationRow("guest_001", "family_brunch", true),
    // Ashley — everything but brunch.
    invitationRow("guest_002", "friday_welcome", true),
    invitationRow("guest_002", "ceremony", true),
    invitationRow("guest_002", "reception", true),
    invitationRow("guest_002", "family_brunch", false),
    // John Smith (Ohio) — ceremony + reception only.
    invitationRow("guest_003", "friday_welcome", false),
    invitationRow("guest_003", "ceremony", true),
    invitationRow("guest_003", "reception", true),
    invitationRow("guest_003", "family_brunch", false),
    // John Smith (Texas) — reception only.
    invitationRow("guest_004", "friday_welcome", false),
    invitationRow("guest_004", "ceremony", false),
    invitationRow("guest_004", "reception", true),
    invitationRow("guest_004", "family_brunch", false),
    // Maria — already RSVP'd yes to ceremony/reception/brunch, Fish, with a note.
    invitationRow("guest_005", "friday_welcome", false),
    invitationRow("guest_005", "ceremony", true, {
      attendance: "YES",
      updatedAt: "2026-09-01T12:00:00.000Z",
    }),
    invitationRow("guest_005", "reception", true, {
      attendance: "YES",
      mealChoice: "Fish",
      dietaryNotes: "Gluten-free",
      updatedAt: "2026-09-01T12:00:00.000Z",
    }),
    invitationRow("guest_005", "family_brunch", true, {
      attendance: "YES",
      updatedAt: "2026-09-01T12:00:00.000Z",
    }),
    // Maria's plus-one — reception only.
    invitationRow("guest_006", "friday_welcome", false),
    invitationRow("guest_006", "ceremony", false),
    invitationRow("guest_006", "reception", true),
    invitationRow("guest_006", "family_brunch", false),
  ];

  const settings: Row[] = [
    ["key", "value"],
    ["rsvp_open", "TRUE"],
    ["rsvp_deadline", "2026-10-01"],
    ["support_email", "hello@ashandjaeinthea.com"],
    [
      "confirmation_message",
      "Your RSVP has been received. We can't wait to celebrate with you in Atlanta.",
    ],
    ["registry_url", "https://example.com/registry"],
    [
      "registry_message",
      "Your presence is the greatest gift. For those who have asked, our registry can be found here.",
    ],
    ["steak_options", "Medium rare,Medium,Medium well,Well done"],
    ["meal_options", "Steak,Fish,Vegetarian"],
  ];

  await overwriteTab("Households", households);
  await overwriteTab("Guests", guests);
  await overwriteTab("Events", events);
  await overwriteTab("Invitations", invitations);
  await overwriteTab("Settings", settings);

  console.log("Seed complete: Households, Guests, Events, Invitations, Settings populated.");
  console.log("Try searching for: Jared Barchus, John Smith (x2, to test verification), Maria Rivera.");
}

main().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
