/**
 * Ashley & Jared — RSVP Dashboard (Google Apps Script web app)
 *
 * Serves a read-only dashboard over the RSVP spreadsheet. It writes nothing.
 *
 * Design rules this file follows, matching scripts/build-dashboard.ts in the
 * ashandjaeinthea repo:
 *
 *  1. EVERY figure is scoped to invitations with invited = "TRUE". A guest who
 *     isn't invited to an event must never count toward it, and an answer left
 *     behind on an invitation that was later revoked must never count either.
 *  2. Nothing is hardcoded per event. Events, meal options and steak
 *     temperatures are all read from the sheet, so adding, renaming or retiring
 *     an event needs no edit here.
 *  3. Columns are resolved by HEADER NAME, never by index, so reordering or
 *     inserting a column in the sheet can't silently shift a value.
 *
 * Note on the `invited` column: it holds the TEXT "TRUE"/"FALSE", not booleans.
 * Compare with String(v).trim().toUpperCase() === 'TRUE' — a `=== true` check
 * silently matches nothing.
 */

var SPREADSHEET_ID = '1Y7TIq0Lj1NEnRQFr2Xebk4-c5bo8E4h31edhhOpf5Ms';

/** Web app entry point. */
function doGet() {
  return HtmlService.createTemplateFromFile('Dashboard')
    .evaluate()
    .setTitle('Ashley & Jared — RSVP Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Adds a "Dashboard" menu to the spreadsheet itself. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('RSVP Dashboard')
    .addItem('Open dashboard', 'showDashboardSidebar')
    .addToUi();
}

function showDashboardSidebar() {
  var html = HtmlService.createTemplateFromFile('Dashboard')
    .evaluate()
    .setTitle('RSVP Dashboard');
  SpreadsheetApp.getUi().showSidebar(html);
}

/* ------------------------------------------------------------------ *
 * Sheet reading
 * ------------------------------------------------------------------ */

/** Reads a tab into an array of objects keyed by header name. Blank rows dropped. */
function readTab_(ss, tabName) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function (h) { return String(h == null ? '' : h).trim(); });
  var out = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    var blank = true;
    for (var c = 0; c < headers.length; c++) {
      if (!headers[c]) continue;
      var cell = row[c] == null ? '' : String(row[c]).trim();
      obj[headers[c]] = cell;
      if (cell !== '') blank = false;
    }
    if (!blank) out.push(obj);
  }
  return out;
}

/** The invited column is text, not a boolean — see the note at the top. */
function isInvited_(invitationRow) {
  return String(invitationRow.invited || '').trim().toUpperCase() === 'TRUE';
}

/** Splits a comma-separated Settings value, e.g. meal_options. */
function settingList_(settings, key, fallback) {
  var raw = settings[key];
  if (!raw) return fallback;
  var parts = String(raw).split(',').map(function (s) { return s.trim(); })
    .filter(function (s) { return s.length > 0; });
  return parts.length ? parts : fallback;
}

/* ------------------------------------------------------------------ *
 * Main data builder — everything the page renders comes from here
 * ------------------------------------------------------------------ */

function getDashboardData() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  var households = readTab_(ss, 'Households');
  var guests = readTab_(ss, 'Guests');
  var events = readTab_(ss, 'Events');
  var invitations = readTab_(ss, 'Invitations');

  var settings = {};
  readTab_(ss, 'Settings').forEach(function (r) { settings[r.key] = r.value; });

  // --- Lookups -----------------------------------------------------
  var householdOfGuest = {};
  guests.forEach(function (g) { householdOfGuest[g.guest_id] = g.household_id; });

  // Only invited rows are ever considered from here down.
  var invited = invitations.filter(isInvited_);

  var invitedGuestIds = {};
  var invitedHouseholdIds = {};
  invited.forEach(function (inv) {
    invitedGuestIds[inv.guest_id] = true;
    var hid = householdOfGuest[inv.guest_id];
    if (hid) invitedHouseholdIds[hid] = true;
  });

  // --- Per-event stats, driven entirely by the Events tab ----------
  var activeEvents = events
    .filter(function (e) { return String(e.active).trim().toUpperCase() === 'TRUE'; })
    .sort(function (a, b) { return Number(a.display_order || 0) - Number(b.display_order || 0); });

  var byEvent = activeEvents.map(function (e) {
    var rows = invited.filter(function (inv) { return inv.event_id === e.event_id; });
    var yes = 0, no = 0, pending = 0;
    rows.forEach(function (inv) {
      var a = String(inv.attendance || '').trim().toUpperCase();
      if (a === 'YES') yes++;
      else if (a === 'NO') no++;
      else pending++;
    });
    return {
      eventId: e.event_id,
      name: e.event_name,
      date: e.event_date,
      time: e.event_time,
      location: e.location,
      requiresMeal: String(e.requires_meal).trim().toUpperCase() === 'TRUE',
      invited: rows.length,
      yes: yes,
      no: no,
      pending: pending
    };
  });

  // --- Overview ----------------------------------------------------
  var totalHouseholds = Object.keys(invitedHouseholdIds).length;
  var totalGuests = Object.keys(invitedGuestIds).length;

  var respondedHouseholds = households.filter(function (h) {
    return invitedHouseholdIds[h.household_id] &&
      String(h.submitted).trim().toUpperCase() === 'TRUE';
  }).length;

  // Households that still owe a response. A household with no live invitation
  // is excluded — it can never respond, so listing it as pending is noise.
  var notResponded = households.filter(function (h) {
    return invitedHouseholdIds[h.household_id] &&
      String(h.submitted).trim().toUpperCase() !== 'TRUE';
  }).map(function (h) {
    var where = [h.city, h.state].filter(function (x) { return x; }).join(', ');
    return { name: h.primary_guest_name || h.household_name, location: where };
  }).sort(function (a, b) { return a.name.localeCompare(b.name); });

  // --- Coming / Not coming, deduped per guest across events --------
  var yesGuests = {}, noGuests = {};
  invited.forEach(function (inv) {
    var a = String(inv.attendance || '').trim().toUpperCase();
    if (a === 'YES') yesGuests[inv.guest_name] = true;
    else if (a === 'NO') noGuests[inv.guest_name] = true;
  });
  var coming = Object.keys(yesGuests).sort();
  // Not coming means declining everything they're invited to — skipping the
  // after party while attending the ceremony still counts as coming.
  var notComing = Object.keys(noGuests).filter(function (n) { return !yesGuests[n]; }).sort();

  // --- Meals, for whichever event has requires_meal = TRUE ---------
  var mealEvent = activeEvents.filter(function (e) {
    return String(e.requires_meal).trim().toUpperCase() === 'TRUE';
  })[0];

  var meals = [];
  var steak = [];
  var steakLabel = 'Steak';

  if (mealEvent) {
    var mealRows = invited.filter(function (inv) { return inv.event_id === mealEvent.event_id; });
    var mealOptions = settingList_(settings, 'meal_options', ['Steak', 'Fish', 'Vegetarian']);

    meals = mealOptions.map(function (option) {
      return {
        label: option,
        count: mealRows.filter(function (inv) { return inv.meal_choice === option; }).length
      };
    });
    meals.push({
      label: 'Not yet chosen (attending)',
      count: mealRows.filter(function (inv) {
        return String(inv.attendance).trim().toUpperCase() === 'YES' && !inv.meal_choice;
      }).length
    });

    var steakOptions = settingList_(settings, 'steak_options',
      ['Medium rare', 'Medium', 'Medium well', 'Well done']);
    var steakRows = invited.filter(function (inv) { return inv.meal_choice === steakLabel; });

    steak = steakOptions.map(function (option) {
      return {
        label: option,
        count: steakRows.filter(function (inv) { return inv.steak_temperature === option; }).length
      };
    });
    steak.push({
      label: 'Not yet chosen',
      count: steakRows.filter(function (inv) { return !inv.steak_temperature; }).length
    });
  }

  // --- Dietary notes, deduped (a note repeats across a guest's events) ---
  var seenNotes = {};
  var dietary = [];
  invited.forEach(function (inv) {
    var note = String(inv.dietary_notes || '').trim();
    if (!note || /^(none|n\/?a)$/i.test(note)) return;
    var key = inv.guest_name + ': ' + note;
    if (seenNotes[key]) return;
    seenNotes[key] = true;
    dietary.push({ guest: inv.guest_name, note: note });
  });
  dietary.sort(function (a, b) { return a.guest.localeCompare(b.guest); });

  var tz = ss.getSpreadsheetTimeZone() || 'America/New_York';

  return {
    generatedAt: Utilities.formatDate(new Date(), tz, "MMM d, yyyy 'at' h:mm a"),
    timeZone: tz,
    overview: {
      totalHouseholds: totalHouseholds,
      totalGuests: totalGuests,
      responded: respondedHouseholds,
      notResponded: totalHouseholds - respondedHouseholds,
      responseRate: totalHouseholds ? Math.round((respondedHouseholds / totalHouseholds) * 100) : 0,
      deadline: settings.rsvp_deadline || 'Not set'
    },
    byEvent: byEvent,
    coming: coming,
    notComing: notComing,
    mealEventName: mealEvent ? mealEvent.event_name : '',
    meals: meals,
    steak: steak,
    steakLabel: steakLabel,
    dietary: dietary,
    notRespondedList: notResponded
  };
}
