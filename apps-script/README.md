# Apps Script — RSVP Dashboard web app

These two files are the Google Apps Script project that serves the RSVP
dashboard as a web page. They are kept here so the code is version-controlled;
Apps Script itself is edited at script.google.com.

- `Code.gs` — reads the spreadsheet and builds every figure
- `Dashboard.html` — the page it serves

## The one rule

Every count is scoped to invitations with `invited = "TRUE"`. The `invited`
column holds the **text** `"TRUE"`/`"FALSE"`, not booleans — `=== true` matches
nothing. Use `String(v).trim().toUpperCase() === 'TRUE'`.

Nothing is hardcoded per event: events, meal options and steak temperatures all
come from the sheet, and columns are resolved by header name rather than index.

## Deploying

See the redeployment steps in the project notes, or:

1. Open the spreadsheet → Extensions → Apps Script
2. Replace the contents of `Code.gs` and `Dashboard.html` with these files
3. Save, then Deploy → Manage deployments → edit → Version: New version → Deploy
