/* Google Form backend — works in incognito, no Google login needed */
window.EPILOGUE_CONFIG = {
  // Paste from Forms → ⋮ → Get pre-filled link (see SETUP below)
  formAction: "PASTE_FORM_ACTION_URL_HERE",
  // entry.xxxxxx ids from that same pre-filled link
  entryStudentIndex: "entry.000000000",
  entryGuests: "entry.000000000",
};

/*
  SETUP (about 2 minutes):

  1. Go to https://forms.google.com → Blank form
  2. Add 2 questions (Short answer):
       - Student Index
       - Guests
  3. Responses tab → Link to Sheets → select your existing sheet
     (or create new, then copy rows over)
  4. Click ⋮ (top right) → Get pre-filled link
       Type anything in both fields → Get link → Copy
  5. The link looks like:
       https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url&entry.111=x&entry.222=y
     Put into this file:
       formAction: "https://docs.google.com/forms/d/e/FORM_ID/formResponse"
       entryStudentIndex: "entry.111"
       entryGuests: "entry.222"
  6. Form settings → turn OFF "Restrict to users in moraspirit.com"
     (Responses from anyone)
  7. Push/commit this config, or paste values and reload the site

  Optional: paste apps-script/OnFormSubmit.gs into the Sheet’s Apps Script
  (Extensions → Apps Script) and add trigger onFormSubmit —
  it splits each submission into one row per guest.
*/
