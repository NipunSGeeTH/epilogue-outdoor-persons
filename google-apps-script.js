/**
 * Epilogue 26 — paste into Sheet → Extensions → Apps Script (Code.gs)
 *
 * ADMIN (you) must allow public web apps first — see ADMIN.md / chat instructions.
 *
 * Deploy:
 *   Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone          ← NOT "Anyone at moraspirit.com"
 * Copy the /exec URL into config.js
 *
 * Good URL:  https://script.google.com/macros/s/XXXX/exec
 * Bad URL:   https://script.google.com/a/macros/moraspirit.com/s/XXXX/exec  (login wall)
 */

const MAX_GUESTS = 10;
const HEADERS = [
  "Timestamp",
  "Student Index",
  "Guest Name",
  "Guest NIC",
  "Guest #",
];

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "ok", message: "Epilogue guest API. POST JSON to save." })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const raw = e.postData && e.postData.contents;
    if (!raw) {
      return json_({ status: "error", message: "Empty body." });
    }
    const data = JSON.parse(raw);
    const studentIndex = String(data.studentIndex || "").trim();
    const guests = Array.isArray(data.guests) ? data.guests : [];

    if (!studentIndex) return json_({ status: "error", message: "Student index required." });
    if (!guests.length) return json_({ status: "error", message: "Add at least one guest." });
    if (guests.length > MAX_GUESTS) {
      return json_({ status: "error", message: "Max " + MAX_GUESTS + " guests." });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    ensureHeaders_(sheet);
    const stamp = new Date();

    guests.forEach(function (guest, i) {
      const name = String((guest && guest.name) || "").trim();
      const nic = String((guest && guest.nic) || "")
        .trim()
        .toUpperCase();
      if (!name || !nic) throw new Error("Guest " + (i + 1) + " missing name or NIC.");
      sheet.appendRow([stamp, studentIndex, name, nic, i + 1]);
    });

    return json_({ status: "ok", count: guests.length });
  } catch (err) {
    return json_({ status: "error", message: String(err.message || err) });
  }
}

function ensureHeaders_(sheet) {
  const row = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const empty = row.every(function (c) {
    return c === "" || c === null;
  });
  if (empty) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
