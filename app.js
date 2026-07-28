(() => {
  const MAX_GUESTS = 10;
  const form = document.getElementById("guest-form");
  const guestsList = document.getElementById("guests-list");
  const addBtn = document.getElementById("add-guest");
  const countEl = document.getElementById("guest-count");
  const submitBtn = document.getElementById("submit-btn");
  const errorEl = document.getElementById("form-error");
  const successEl = document.getElementById("form-success");
  const template = document.getElementById("guest-row-template");

  function guestCount() {
    return guestsList.querySelectorAll("[data-guest]").length;
  }

  function refreshUI() {
    const n = guestCount();
    countEl.textContent = `${n} / ${MAX_GUESTS}`;
    addBtn.disabled = n >= MAX_GUESTS;

    guestsList.querySelectorAll("[data-guest]").forEach((row, i) => {
      row.querySelector("[data-guest-num]").textContent = String(i + 1);
      const removeBtn = row.querySelector("[data-remove]");
      removeBtn.disabled = n <= 1;
      removeBtn.hidden = n <= 1;
    });
  }

  function addGuest() {
    if (guestCount() >= MAX_GUESTS) return;

    const node = template.content.cloneNode(true);
    const row = node.querySelector("[data-guest]");
    row.querySelector("[data-remove]").addEventListener("click", () => {
      if (guestCount() <= 1) return;
      row.remove();
      refreshUI();
    });

    guestsList.appendChild(node);
    refreshUI();

    const nameInput = row.querySelector("[data-guest-name]");
    if (guestCount() > 1) nameInput.focus();
  }

  function showError(msg) {
    successEl.hidden = true;
    errorEl.hidden = false;
    errorEl.textContent = msg;
  }

  function showSuccess(msg) {
    errorEl.hidden = true;
    successEl.hidden = false;
    successEl.textContent = msg;
  }

  function clearMessages() {
    errorEl.hidden = true;
    successEl.hidden = true;
    errorEl.textContent = "";
    successEl.textContent = "";
  }

  function collectGuests() {
    return Array.from(guestsList.querySelectorAll("[data-guest]")).map((row) => ({
      name: row.querySelector("[data-guest-name]").value.trim(),
      nic: row.querySelector("[data-guest-nic]").value.trim().toUpperCase(),
    }));
  }

  function validate(studentIndex, guests) {
    if (!studentIndex) return "Enter student index number.";
    if (!guests.length) return "Add at least one outside guest.";
    if (guests.length > MAX_GUESTS) return `Maximum ${MAX_GUESTS} guests allowed.`;

    for (let i = 0; i < guests.length; i++) {
      const g = guests[i];
      if (!g.name) return `Enter a name for guest ${i + 1}.`;
      if (!g.nic) return `Enter a NIC for guest ${i + 1}.`;
      if (g.nic.length < 5) return `NIC for guest ${i + 1} looks too short.`;
    }

    const nics = guests.map((g) => g.nic);
    if (new Set(nics).size !== nics.length) {
      return "Duplicate NIC numbers found. Each guest needs a unique NIC.";
    }

    return null;
  }

  function formatGuests(guests) {
    return guests.map((g) => `${g.name} | ${g.nic}`).join("\n");
  }

  function submitToGoogleForm(studentIndex, guests) {
    const cfg = window.EPILOGUE_CONFIG || {};
    const action = cfg.formAction;
    const entryIndex = cfg.entryStudentIndex;
    const entryGuests = cfg.entryGuests;

    if (
      !action ||
      action.includes("PASTE_FORM") ||
      !entryIndex ||
      entryIndex.includes("000000") ||
      !entryGuests ||
      entryGuests.includes("000000")
    ) {
      throw new Error(
        "Form not connected yet. Create a Google Form (2 fields) and paste formAction + entry ids into config.js."
      );
    }

    const body = new FormData();
    body.append(entryIndex, studentIndex);
    body.append(entryGuests, formatGuests(guests));

    // no-cors: Google Forms does not send CORS headers; data still saves
    return fetch(action, {
      method: "POST",
      mode: "no-cors",
      body,
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages();

    const studentIndex = document.getElementById("student-index").value.trim();
    const guests = collectGuests();
    const problem = validate(studentIndex, guests);

    if (problem) {
      showError(problem);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Saving…";

    try {
      await submitToGoogleForm(studentIndex, guests);
      // opaque response — assume success if no network throw
      showSuccess(
        `Saved ${guests.length} guest${guests.length === 1 ? "" : "s"} for ${studentIndex}.`
      );
      form.reset();
      guestsList.innerHTML = "";
      addGuest();
    } catch (err) {
      showError(err.message || "Something went wrong. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save guest list";
    }
  });

  addBtn.addEventListener("click", addGuest);
  addGuest();
})();
