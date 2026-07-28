/**
 * Epilogue 26 — Outside Guest Collector
 *
 * Attach this to your sheet:
 * https://docs.google.com/spreadsheets/d/1FlWneIKvqvsh8XFS69vOB2968t9DEQeOLkqBZ_4_HXI
 *
 * STEPS:
 * 1. Open that Google Sheet
 * 2. Extensions → Apps Script
 * 3. Delete any default code, paste THIS entire file, Save (Ctrl/Cmd+S)
 * 4. Deploy → New deployment
 *      Type: Web app
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. Click Deploy → Authorize → Allow
 * 6. Copy the Web App URL (must end with /exec)
 * 7. Send that URL here, OR:
 *      GitHub repo → Settings → Secrets → Actions
 *      New secret name: GOOGLE_SCRIPT_URL
 *      Value: the /exec URL
 *    then re-run the "Deploy GitHub Pages" workflow
 *
 * Sheet columns (row 1): Timestamp | Student Index | Guest Name | Guest NIC | Guest #
 * Writes to the first tab. Re-deploy after script edits (Manage deployments → Edit → New version).
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
      return json_({
        status: "error",
        message: "Maximum " + MAX_GUESTS + " guests allowed.",
      });
    }

    const sheet = getSheet_();
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

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
