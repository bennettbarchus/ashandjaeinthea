# Google Sheets Setup for the RSVP Portal

The `/rsvp` route reads and writes guest data through a Google service
account — the browser never talks to Google Sheets directly. This doc
covers creating that service account and wiring it to the spreadsheet.

## 1. Create a Google Cloud project (if you don't have one)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/).
2. Create a new project (or reuse an existing one) — e.g. "ash-and-jae-rsvp".

## 2. Enable the Google Sheets API

1. In the Cloud Console, go to **APIs & Services → Library**.
2. Search for "Google Sheets API" and click **Enable**.

## 3. Create a service account

1. Go to **APIs & Services → Credentials → Create Credentials → Service account**.
2. Give it a name (e.g. "rsvp-portal").
3. No project-level roles are needed — access is granted per-spreadsheet in step 5.
4. Once created, open the service account, go to the **Keys** tab, and
   **Add Key → Create new key → JSON**. This downloads a JSON file —
   treat it like a password.

## 4. Extract the three values you need

From the downloaded JSON file:

| .env variable         | JSON field    |
| ---------------------- | ------------- |
| `GOOGLE_PROJECT_ID`    | `project_id`  |
| `GOOGLE_CLIENT_EMAIL`  | `client_email`|
| `GOOGLE_PRIVATE_KEY`   | `private_key` |

The private key contains literal `\n` sequences — when pasting it into
`.env.local`, keep it as a single-line, double-quoted string (Next.js
handles the `\n` escapes automatically — see `.env.example`).

## 5. Share the spreadsheet with the service account

1. Open (or create) the Google Sheet you want the app to use.
2. Click **Share**, and share it with the `client_email` address from
   step 4, giving it **Editor** access.
3. Copy the spreadsheet ID out of its URL:
   `https://docs.google.com/spreadsheets/d/`**`<THIS_PART>`**`/edit`
   → that's your `GOOGLE_SHEET_ID`.

**Use a duplicate/test spreadsheet during development.** Keep the
production sheet private and only point `GOOGLE_SHEET_ID` at it once
you're ready to go live.

## 6. Fill in `.env.local`

```env
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_CLIENT_EMAIL=rsvp-portal@your-project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-spreadsheet-id
```

`.env.local` is already in `.gitignore` — it is never committed.

## 7. Create the tabs and sample data

Run:

```bash
npm run seed:sheet
```

This creates (if missing) and **overwrites** the 5 tabs the app expects —
`Households`, `Guests`, `Events`, `Invitations`, `Settings` — with headers
and realistic sample rows (including a duplicate-name pair to test
secondary verification, and an already-submitted household to test the
"update a prior RSVP" flow). See `scripts/seed-sheet.ts` for the exact
data it writes.

Run this against a **test spreadsheet**, not the production one, unless
you're intentionally resetting it — it overwrites tab contents.

## 8. Sheet structure reference

### `Households`

| Column | Notes |
| --- | --- |
| `household_id` | Stable unique ID, e.g. `hh_001` |
| `household_name` | Display label, e.g. "Barchus Household" |
| `primary_guest_name` | Used for search + masking |
| `search_name` | Lowercase/normalized name used to detect duplicates for secondary verification |
| `city`, `state` | Shown to disambiguate search results when needed |
| `zip_code`, `phone_last_four`, `email` | Secondary verification fields — populate at least one |
| `verification_method` | Unused by the app; free-text note for your own reference |
| `submitted`, `submitted_at`, `updated_at` | Written by the app on submit — leave blank initially |

### `Guests`

One row per named guest (including plus-ones). Set `is_plus_one` and
`plus_one_name_editable` to `TRUE` for a placeholder guest (e.g. "Guest
of Jared") whose real name the invitee should be able to fill in.

### `Events`

One row per wedding-weekend event. `requires_meal` controls whether the
entrée-selection screen appears for that event. `active` lets you retire
an event without deleting its row/history. `display_order` controls the
order guests are asked about events.

### `Invitations`

**One row per (guest, event) pair.** This is what actually controls who
sees what — a guest with no row (or `invited = FALSE`) for an event never
sees it, even if they see other events. `attendance`, `meal_choice`,
`steak_temperature`, and `dietary_notes` start blank and are filled in by
the app when the guest RSVPs.

### `Settings`

Key/value pairs read by the app:

| Key | Purpose |
| --- | --- |
| `rsvp_open` | `TRUE`/`FALSE` — master switch for the whole `/rsvp` flow |
| `rsvp_deadline` | Any human-readable date string; shown to guests and used to block new (not-yet-submitted) RSVPs once passed |
| `support_email` | Shown as the "Can't find your invitation?" contact |
| `confirmation_message` | Shown on the final confirmation screen |
| `registry_url`, `registry_message` | Centralized registry link + copy |
| `meal_options` | Comma-separated entrée list, e.g. `Steak,Fish,Vegetarian` |
| `steak_options` | Comma-separated list, e.g. `Medium rare,Medium,Medium well,Well done` |

## 9. Adding real guests

Once you're ready to replace the seeded sample data, add real rows to
`Households`, `Guests`, and `Invitations` directly in the sheet (the app
never writes new rows to those three tabs — it only updates the
`attendance`/`meal_choice`/`steak_temperature`/`dietary_notes`/`submitted`
columns on existing rows). Re-running `npm run seed:sheet` will **wipe
out and replace** any manual edits, so only run it again if you actually
want to reset back to the sample data.
