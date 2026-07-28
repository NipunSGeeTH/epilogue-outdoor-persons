/**
 * Epilogue 26 — Guest collector (run inside the Google Sheet)
 *
 * SETUP:
 * 1. Open the Sheet → Extensions → Apps Script
 * 2. Delete old code
 * 3. In Code.gs paste THIS file
 * 4. File → New → HTML file → name it exactly: Index
 * 5. Paste contents of Index.html into that file → Save
 * 6. Deploy → New deployment → Web app
 *      Execute as: Me
 *      Who has access: Anyone in moraspirit.com   (or Anyone)
 * 7. Open the Web App URL — fill the form there (committee use)
 *
 * After code changes: Deploy → Manage deployments → Edit → Version: New version → Deploy
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

/** Called from the form via google.script.run */
function saveGuests(payload) {
  const studentIndex = String((payload && payload.studentIndex) || "").trim();
  const guests = payload && Array.isArray(payload.guests) ? payload.guests : [];

  if (!studentIndex) {
    throw new Error("Student index is required.");
  }
  if (!guests.length) {
    throw new Error("Add at least one guest.");
  }
  if (guests.length > MAX_GUESTS) {
    throw new Error("Maximum " + MAX_GUESTS + " guests allowed.");
  }

  const sheet = getSheet_();
  const stamp = new Date();

  guests.forEach(function (guest, i) {
    const name = String((guest && guest.name) || "").trim();
    const nic = String((guest && guest.nic) || "")
      .trim()
      .toUpperCase();
    if (!name || !nic) {
      throw new Error("Guest " + (i + 1) + " is missing name or NIC.");
    }
    sheet.appendRow([stamp, studentIndex, name, nic, i + 1]);
  });

  return {
    status: "ok",
    message: "Saved " + guests.length + " guest(s).",
    count: guests.length,
  };
}

/**
 * Also accepts POST from the GitHub Pages form (needs Who has access: Anyone).
 * Body: raw JSON or form field "payload".
 */
function doPost(e) {
  try {
    const data = parsePayload_(e);
    const result = saveGuests(data);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: String(err.message || err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function parsePayload_(e) {
  if (e && e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }
  const raw = e && e.postData && e.postData.contents;
  if (!raw) {
    throw new Error("Empty request body.");
  }
  // form-urlencoded: payload=...
  if (String(e.postData.type || "").indexOf("application/x-www-form-urlencoded") !== -1) {
    const params = {};
    String(raw)
      .split("&")
      .forEach(function (part) {
        const pair = part.split("=");
        params[decodeURIComponent(pair[0])] = decodeURIComponent(
          (pair[1] || "").replace(/\+/g, " ")
        );
      });
    if (params.payload) return JSON.parse(params.payload);
  }
  return JSON.parse(raw);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];
  ensureHeaders_(sheet);
  return sheet;
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
