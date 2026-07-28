/**
 * Optional — paste into the RESPONSE spreadsheet Apps Script
 * (Extensions → Apps Script), then:
 *   Triggers (clock icon) → Add Trigger
 *     Function: expandFormSubmit
 *     Event source: From spreadsheet
 *     Event type: On form submit
 *
 * Splits the "Guests" text field into one row per guest on sheet "Guests".
 * Guests field format from the web form:
 *   Name | NIC
 *   Name | NIC
 */

const GUESTS_SHEET = "Guests";
const HEADERS = [
  "Timestamp",
  "Student Index",
  "Guest Name",
  "Guest NIC",
  "Guest #",
];

function expandFormSubmit(e) {
  const named = e.namedValues || {};
  const stamp = new Date();
  const studentIndex = first_(named["Student Index"] || named["Student index"]);
  const guestsRaw = first_(named["Guests"] || named["Guest list"]);

  if (!studentIndex || !guestsRaw) return;

  const lines = String(guestsRaw)
    .split(/\r?\n/)
    .map(function (l) {
      return l.trim();
    })
    .filter(Boolean);

  const sheet = getGuestsSheet_();
  lines.forEach(function (line, i) {
    const parts = line.split("|");
    const name = (parts[0] || "").trim();
    const nic = (parts[1] || "").trim().toUpperCase();
    if (!name && !nic) return;
    sheet.appendRow([stamp, studentIndex, name, nic, i + 1]);
  });
}

function first_(val) {
  if (Array.isArray(val)) return String(val[0] || "").trim();
  return String(val || "").trim();
}

function getGuestsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(GUESTS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(GUESTS_SHEET);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
