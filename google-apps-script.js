/**
 * LEGACY single-file backend (POST-only).
 * Prefer the folder apps-script/ (Code.gs + Index.html) — form runs inside Google, no CORS.
 *
 * Quick path: open Sheet → Apps Script → use apps-script/Code.gs and apps-script/Index.html
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
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Epilogue 26 — Guest Pass")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function saveGuests(payload) {
  const studentIndex = String((payload && payload.studentIndex) || "").trim();
  const guests = payload && Array.isArray(payload.guests) ? payload.guests : [];

  if (!studentIndex) throw new Error("Student index is required.");
  if (!guests.length) throw new Error("Add at least one guest.");
  if (guests.length > MAX_GUESTS) {
    throw new Error("Maximum " + MAX_GUESTS + " guests allowed.");
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  ensureHeaders_(sheet);
  const stamp = new Date();

  guests.forEach(function (guest, i) {
    const name = String((guest && guest.name) || "").trim();
    const nic = String((guest && guest.nic) || "")
      .trim()
      .toUpperCase();
    if (!name || !nic) throw new Error("Guest " + (i + 1) + " is missing name or NIC.");
    sheet.appendRow([stamp, studentIndex, name, nic, i + 1]);
  });

  return { status: "ok", count: guests.length };
}

function doPost(e) {
  try {
    let data;
    if (e && e.parameter && e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    } else {
      data = JSON.parse(e.postData.contents);
    }
    return ContentService.createTextOutput(JSON.stringify(saveGuests(data))).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: String(err.message || err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureHeaders_(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const empty = firstRow.every(function (cell) {
    return cell === "" || cell === null;
  });
  if (empty) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}
