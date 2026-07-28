/**
 * Epilogue 26 — Outside Guest Collector
 *
 * SETUP (about 5 minutes):
 * 1. Create a Google Sheet. Rename the first tab to: Guests
 * 2. Put these headers in row 1 (A–E):
 *    Timestamp | Student Index | Guest Name | Guest NIC | Guest #
 * 3. Extensions → Apps Script
 * 4. Delete any default code and paste THIS entire file
 * 5. Save → Deploy → New deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL (ends with /exec)
 * 7. Paste it into config.js as scriptUrl
 *    OR add it as GitHub secret GOOGLE_SCRIPT_URL for Pages deploy
 *
 * Re-deploy after any script edits: Deploy → Manage deployments → Edit → New version
 */

const SHEET_NAME = "Guests";
const MAX_GUESTS = 10;

function doGet() {
  return json_({
    status: "ok",
    message: "Epilogue 26 guest collector is running. Use POST to submit.",
  });
}

function doPost(e) {
  try {
    const raw = e.postData && e.postData.contents;
    if (!raw) {
      return json_({ status: "error", message: "Empty request body." });
    }

    const data = JSON.parse(raw);
    const studentIndex = String(data.studentIndex || "").trim();
    const guests = Array.isArray(data.guests) ? data.guests : [];

    if (!studentIndex) {
      return json_({ status: "error", message: "Student index is required." });
    }
    if (!guests.length) {
      return json_({ status: "error", message: "Add at least one guest." });
    }
    if (guests.length > MAX_GUESTS) {
      return json_({ status: "error", message: "Maximum " + MAX_GUESTS + " guests allowed." });
    }

    const sheet = getOrCreateSheet_();
    const stamp = new Date();

    guests.forEach(function (guest, i) {
      const name = String((guest && guest.name) || "").trim();
      const nic = String((guest && guest.nic) || "").trim().toUpperCase();
      if (!name || !nic) {
        throw new Error("Guest " + (i + 1) + " is missing name or NIC.");
      }
      sheet.appendRow([stamp, studentIndex, name, nic, i + 1]);
    });

    return json_({
      status: "ok",
      message: "Saved " + guests.length + " guest(s).",
      count: guests.length,
    });
  } catch (err) {
    return json_({ status: "error", message: String(err.message || err) });
  }
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "Timestamp",
      "Student Index",
      "Guest Name",
      "Guest NIC",
      "Guest #",
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
