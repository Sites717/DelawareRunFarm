// Delaware Run Farm — admin page wiring. Plain DOM, no framework, to
// match the rest of the (zero-build) site. Every section follows the
// same shape: load rows with readTab()/readObjectTab(), render them as
// cards, open an inline form to add/edit, save with appendRow()/
// updateRow()/writeObjectTab(), and for lists, remove with removeRow()
// (a real delete - every save is its own git commit, so nothing here is
// truly unrecoverable).
import { verifyAndStoreToken, signOut, isSignedIn } from "./github-auth.js";
import { readTab, appendRow, updateRow, removeRow, readObjectTab, writeObjectTab, uploadPhoto } from "./github-api.js";
import { toDirectImageUrl } from "./data-reader.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function toast(message, isError = false) {
  const el = $("#toast");
  el.textContent = message;
  el.className = "admin-toast show" + (isError ? " error" : "");
  setTimeout(() => el.classList.remove("show"), 3500);
}

function withBusy(btn, fn) {
  return async (...args) => {
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Saving...";
    try {
      await fn(...args);
    } catch (err) {
      console.error(err);
      toast(err.message || "Something went wrong - try again.", true);
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  };
}

// ---------------------------------------------------------------- auth

async function enterApp() {
  $("#admin-gate").style.display = "none";
  $("#admin-app").style.display = "block";
  $("#signed-in-as").style.display = "inline";
  $("#signout-btn").style.display = "inline-block";
  await Promise.all([loadPonies(), loadCavaliers(), loadPuppies(), loadFarmstand(), loadBlockedDates(), loadStatus()]);
}

if (isSignedIn()) {
  enterApp();
}

$("#token-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("#token-input");
  const errorEl = $("#token-error");
  const submitBtn = $("#token-form button[type=submit]");
  errorEl.classList.remove("show");
  submitBtn.disabled = true;
  submitBtn.textContent = "Connecting...";
  try {
    await verifyAndStoreToken(input.value.trim());
    await enterApp();
  } catch (err) {
    errorEl.textContent = err.message || "Could not connect - try again.";
    errorEl.classList.add("show");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Connect";
  }
});

$("#signout-btn").addEventListener("click", () => {
  signOut();
  location.reload();
});

// ---------------------------------------------------------------- tabs

$$(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".admin-tab").forEach((t) => t.classList.remove("active"));
    $$(".admin-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    $(`.admin-panel[data-panel="${tab.dataset.tab}"]`).classList.add("active");
  });
});

// ---------------------------------------------------------------- shared photo-field widget
// Renders a file input + live preview; on change it uploads immediately
// (into assets/photos/uploaded/) and stores the resulting relative path
// in a hidden field so the rest of the form behaves like any other field.
function photoFieldHtml(fieldName, currentUrl) {
  const preview = currentUrl ? toDirectImageUrl(currentUrl) : "";
  return `
    <label>Photo
      <input type="hidden" name="${fieldName}" value="${escapeHtml(currentUrl || "")}" />
      <input type="file" accept="image/*" class="photo-input" data-field="${fieldName}" />
    </label>
    <img class="photo-preview" src="${preview}" style="width:84px;height:84px;object-fit:cover;border-radius:8px;margin-top:8px;${preview ? "" : "display:none;"}" />
  `;
}

function wirePhotoField(form) {
  const input = $(".photo-input", form);
  if (!input) return;
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    const hidden = form.querySelector(`input[type="hidden"][name="${input.dataset.field}"]`);
    const preview = $(".photo-preview", form);
    input.disabled = true;
    try {
      const path = await uploadPhoto(file);
      hidden.value = path;
      preview.src = toDirectImageUrl(path);
      preview.style.display = "inline-block";
      toast("Photo uploaded.");
    } catch (err) {
      console.error(err);
      toast("Photo upload failed - try again.", true);
    } finally {
      input.disabled = false;
    }
  });
}

function readForm(form) {
  const obj = {};
  $$("[name]", form).forEach((el) => {
    if (el.type === "checkbox") obj[el.name] = el.checked ? "yes" : "no";
    else obj[el.name] = el.value.trim();
  });
  return obj;
}

// ============================================================ PONIES

let poniesCache = { rows: [] };

async function loadPonies() {
  poniesCache = await readTab("ponies");
  renderPoniesList();
}

function renderPoniesList() {
  const list = $("#ponies-list");
  if (poniesCache.rows.length === 0) {
    list.innerHTML = `<p class="muted">No ponies yet - add the first one below.</p>`;
    return;
  }
  list.innerHTML = poniesCache.rows.map((p, i) => `
    <div class="admin-row-card">
      <img src="${p.photo_url ? toDirectImageUrl(p.photo_url) : "assets/favicon.png"}" alt="" />
      <div class="meta">
        <strong>${escapeHtml(p.name) || "(unnamed)"}</strong>
        <span>${escapeHtml(p.status)} ${p.price ? "- $" + escapeHtml(p.price) : ""} - ${escapeHtml(p.age)} ${p.sex ? "- " + escapeHtml(p.sex) : ""}</span>
      </div>
      <div class="admin-actions">
        <button class="btn btn-outline btn-sm edit-pony" data-i="${i}">Edit</button>
        <button class="btn btn-outline btn-sm remove-pony" data-i="${i}">Remove</button>
      </div>
    </div>
  `).join("");
  $$(".edit-pony", list).forEach((btn) => btn.addEventListener("click", () => showPonyForm(Number(btn.dataset.i))));
  $$(".remove-pony", list).forEach((btn) => btn.addEventListener("click", withBusy(btn, async () => {
    const i = Number(btn.dataset.i);
    if (!confirm(`Remove ${poniesCache.rows[i].name || "this pony"}? This can't be undone from the admin page (though it stays in the site's git history).`)) return;
    await removeRow("ponies", i);
    toast("Pony removed.");
    await loadPonies();
  })));
}

function ponyFormHtml(p = {}) {
  return `
    <div class="inline-edit-form">
      <div class="grid-2">
        <label>Name<input name="name" value="${escapeHtml(p.name)}" required /></label>
        <label>Sex<select name="sex">
          <option value="">-</option>
          <option value="Mare" ${p.sex === "Mare" ? "selected" : ""}>Mare</option>
          <option value="Gelding" ${p.sex === "Gelding" ? "selected" : ""}>Gelding</option>
          <option value="Stallion" ${p.sex === "Stallion" ? "selected" : ""}>Stallion</option>
        </select></label>
        <label>Sire<input name="sire" value="${escapeHtml(p.sire)}" /></label>
        <label>Dam<input name="dam" value="${escapeHtml(p.dam)}" /></label>
        <label>Age<input name="age" value="${escapeHtml(p.age)}" placeholder="e.g. 2 years" /></label>
        <label>Height<input name="height" value="${escapeHtml(p.height)}" placeholder="e.g. 11.2 hh" /></label>
        <label>Status<select name="status">
          <option value="available" ${p.status === "available" ? "selected" : ""}>Available</option>
          <option value="coming" ${p.status === "coming" ? "selected" : ""}>Coming soon (not born yet)</option>
          <option value="reserved" ${p.status === "reserved" ? "selected" : ""}>Reserved</option>
          <option value="sold" ${p.status === "sold" ? "selected" : ""}>Sold</option>
        </select></label>
        <label>Price<input name="price" value="${escapeHtml(p.price)}" placeholder="e.g. 25000" /></label>
      </div>
      <label>Description<textarea name="description" rows="3">${escapeHtml(p.description)}</textarea></label>
      ${photoFieldHtml("photo_url", p.photo_url)}
      <div class="admin-actions" style="margin-top:14px;">
        <button class="btn btn-primary save-pony">Save</button>
        <button class="btn btn-outline cancel-form">Cancel</button>
      </div>
    </div>
  `;
}

function showPonyForm(index = null) {
  const container = $("#ponies-form-container");
  const p = index !== null ? poniesCache.rows[index] : { id: String(Date.now()), status: "available" };
  container.innerHTML = ponyFormHtml(p);
  const form = $(".inline-edit-form", container);
  wirePhotoField(form);
  const hiddenId = document.createElement("input");
  hiddenId.type = "hidden"; hiddenId.name = "id"; hiddenId.value = p.id || String(Date.now());
  form.appendChild(hiddenId);

  const saveBtn = $(".save-pony", form);
  saveBtn.addEventListener("click", withBusy(saveBtn, async () => {
    const data = readForm(form);
    if (!data.name) { toast("Name is required.", true); throw new Error("Name is required.");
    }
    if (index !== null) await updateRow("ponies", index, data);
    else await appendRow("ponies", data);
    toast("Pony saved - it'll show on the live site within a minute or two.");
    container.innerHTML = "";
    await loadPonies();
  }));
  $(".cancel-form", form).addEventListener("click", () => { container.innerHTML = ""; });
}

$("#ponies-add-btn").addEventListener("click", () => showPonyForm(null));

// ============================================================ CAVALIERS

let cavaliersCache = { data: {} };

async function loadCavaliers() {
  cavaliersCache = await readObjectTab("cavaliers_litter");
  renderCavaliersForm();
}

function renderCavaliersForm() {
  const container = $("#cavaliers-form-container");
  const c = cavaliersCache.data || {};
  container.innerHTML = `
    <div class="inline-edit-form">
      <div class="grid-2">
        <label>Sire<input name="sire" value="${escapeHtml(c.sire)}" /></label>
        <label>Dam<input name="dam" value="${escapeHtml(c.dam)}" /></label>
        <label>Born date<input type="date" name="born_date" value="${escapeHtml(c.born_date)}" /></label>
        <label>Go-home date<input type="date" name="go_home_date" value="${escapeHtml(c.go_home_date)}" /></label>
        <label>Price<input name="price" value="${escapeHtml(c.price)}" placeholder="e.g. 2500" /></label>
        <label>Status<select name="status">
          <option value="expecting" ${c.status === "expecting" ? "selected" : ""}>Expecting</option>
          <option value="available" ${c.status === "available" ? "selected" : ""}>Puppies available</option>
          <option value="reserved" ${c.status === "reserved" ? "selected" : ""}>All reserved</option>
          <option value="none" ${c.status === "none" ? "selected" : ""}>No current litter</option>
        </select></label>
      </div>
      <p class="muted" style="margin-top:12px;">Puppy count by color (leave blank if unknown yet):</p>
      <div class="grid-2">
        <label>Blenheim<input name="blenheim_count" value="${escapeHtml(c.blenheim_count)}" /></label>
        <label>Tricolor<input name="tricolor_count" value="${escapeHtml(c.tricolor_count)}" /></label>
        <label>Black & Tan<input name="blacktan_count" value="${escapeHtml(c.blacktan_count)}" /></label>
        <label>Ruby<input name="ruby_count" value="${escapeHtml(c.ruby_count)}" /></label>
      </div>
      <div class="admin-actions" style="margin-top:14px;">
        <button class="btn btn-primary save-cavaliers">Save</button>
      </div>
    </div>
  `;
  const form = $(".inline-edit-form", container);
  const saveBtn = $(".save-cavaliers", form);
  saveBtn.addEventListener("click", withBusy(saveBtn, async () => {
    const data = readForm(form);
    await writeObjectTab("cavaliers_litter", data);
    toast("Litter info saved - it'll show on the live site within a minute or two.");
    await loadCavaliers();
  }));
}

// ============================================================ CAVALIER PUPPIES

let puppiesCache = { rows: [] };

async function loadPuppies() {
  puppiesCache = await readTab("cavalier_puppies");
  renderPuppiesList();
}

function renderPuppiesList() {
  const list = $("#puppies-list");
  if (puppiesCache.rows.length === 0) {
    list.innerHTML = `<p class="muted">No individual puppies added yet - add the first one below.</p>`;
    return;
  }
  list.innerHTML = puppiesCache.rows.map((p, i) => `
    <div class="admin-row-card">
      <img src="${p.photo_url ? toDirectImageUrl(p.photo_url) : "assets/favicon.png"}" alt="" />
      <div class="meta">
        <strong>${escapeHtml(p.name) || "(unnamed)"}</strong>
        <span>${escapeHtml(p.status)} ${p.price ? "- $" + escapeHtml(p.price) : ""} - ${escapeHtml(p.color)} ${p.sex ? "- " + escapeHtml(p.sex) : ""}</span>
      </div>
      <div class="admin-actions">
        <button class="btn btn-outline btn-sm edit-puppy" data-i="${i}">Edit</button>
        <button class="btn btn-outline btn-sm remove-puppy" data-i="${i}">Remove</button>
      </div>
    </div>
  `).join("");
  $$(".edit-puppy", list).forEach((btn) => btn.addEventListener("click", () => showPuppyForm(Number(btn.dataset.i))));
  $$(".remove-puppy", list).forEach((btn) => btn.addEventListener("click", withBusy(btn, async () => {
    const i = Number(btn.dataset.i);
    if (!confirm(`Remove ${puppiesCache.rows[i].name || "this puppy"}? This can't be undone from the admin page (though it stays in the site's git history).`)) return;
    await removeRow("cavalier_puppies", i);
    toast("Puppy removed.");
    await loadPuppies();
  })));
}

function puppyFormHtml(p = {}) {
  return `
    <div class="inline-edit-form">
      <div class="grid-2">
        <label>Name<input name="name" value="${escapeHtml(p.name)}" required /></label>
        <label>Sex<select name="sex">
          <option value="">-</option>
          <option value="Boy" ${p.sex === "Boy" ? "selected" : ""}>Boy</option>
          <option value="Girl" ${p.sex === "Girl" ? "selected" : ""}>Girl</option>
        </select></label>
        <label>Color<select name="color">
          <option value="">-</option>
          <option value="Blenheim" ${p.color === "Blenheim" ? "selected" : ""}>Blenheim</option>
          <option value="Tricolor" ${p.color === "Tricolor" ? "selected" : ""}>Tricolor</option>
          <option value="Black & Tan" ${p.color === "Black & Tan" ? "selected" : ""}>Black &amp; Tan</option>
          <option value="Ruby" ${p.color === "Ruby" ? "selected" : ""}>Ruby</option>
        </select></label>
        <label>Status<select name="status">
          <option value="available" ${p.status === "available" ? "selected" : ""}>Available</option>
          <option value="reserved" ${p.status === "reserved" ? "selected" : ""}>Reserved</option>
          <option value="sold" ${p.status === "sold" ? "selected" : ""}>Sold</option>
        </select></label>
        <label>Price<input name="price" value="${escapeHtml(p.price)}" placeholder="e.g. 2800" /></label>
      </div>
      <label>Description<textarea name="description" rows="3">${escapeHtml(p.description)}</textarea></label>
      ${photoFieldHtml("photo_url", p.photo_url)}
      <div class="admin-actions" style="margin-top:14px;">
        <button class="btn btn-primary save-puppy">Save</button>
        <button class="btn btn-outline cancel-form">Cancel</button>
      </div>
    </div>
  `;
}

function showPuppyForm(index = null) {
  const container = $("#puppies-form-container");
  const p = index !== null ? puppiesCache.rows[index] : { id: String(Date.now()), status: "available" };
  container.innerHTML = puppyFormHtml(p);
  const form = $(".inline-edit-form", container);
  wirePhotoField(form);
  const hiddenId = document.createElement("input");
  hiddenId.type = "hidden"; hiddenId.name = "id"; hiddenId.value = p.id || String(Date.now());
  form.appendChild(hiddenId);

  const saveBtn = $(".save-puppy", form);
  saveBtn.addEventListener("click", withBusy(saveBtn, async () => {
    const data = readForm(form);
    if (!data.name) { toast("Name is required.", true); throw new Error("Name is required."); }
    if (index !== null) await updateRow("cavalier_puppies", index, data);
    else await appendRow("cavalier_puppies", data);
    toast("Puppy saved - it'll show on the live site within a minute or two.");
    container.innerHTML = "";
    await loadPuppies();
  }));
  $(".cancel-form", form).addEventListener("click", () => { container.innerHTML = ""; });
}

$("#puppies-add-btn").addEventListener("click", () => showPuppyForm(null));

// ============================================================ FARM STAND

let farmstandCache = { rows: [] };

async function loadFarmstand() {
  farmstandCache = await readTab("farmstand_items");
  renderFarmstandList();
}

function renderFarmstandList() {
  const list = $("#farmstand-list");
  if (farmstandCache.rows.length === 0) {
    list.innerHTML = `<p class="muted">No items yet - add the first one below.</p>`;
    return;
  }
  list.innerHTML = farmstandCache.rows.map((item, i) => `
    <div class="admin-row-card">
      <div class="meta">
        <strong>${escapeHtml(item.item_name) || "(unnamed item)"}</strong>
        <span>${escapeHtml(item.season)}</span>
      </div>
      <label style="display:flex; align-items:center; gap:6px; font-size:0.85rem;">
        <input type="checkbox" class="toggle-stock" data-i="${i}" ${item.in_stock === "yes" ? "checked" : ""} /> In stock
      </label>
      <div class="admin-actions">
        <button class="btn btn-outline btn-sm remove-item" data-i="${i}">Remove</button>
      </div>
    </div>
  `).join("");
  $$(".toggle-stock", list).forEach((box) => box.addEventListener("change", withBusy(box, async () => {
    const i = Number(box.dataset.i);
    const item = farmstandCache.rows[i];
    await updateRow("farmstand_items", i, { ...item, in_stock: box.checked ? "yes" : "no" });
    farmstandCache.rows[i].in_stock = box.checked ? "yes" : "no";
    toast("Updated - it'll show on the live site within a minute or two.");
  })));
  $$(".remove-item", list).forEach((btn) => btn.addEventListener("click", withBusy(btn, async () => {
    const i = Number(btn.dataset.i);
    await removeRow("farmstand_items", i);
    toast("Item removed.");
    await loadFarmstand();
  })));
}

$("#farmstand-add-btn").addEventListener("click", () => {
  const container = $("#farmstand-form-container");
  container.innerHTML = `
    <div class="inline-edit-form">
      <div class="grid-2">
        <label>Item name<input name="item_name" required /></label>
        <label>Season<select name="season">
          <option value="spring">Spring</option>
          <option value="summer">Summer</option>
          <option value="fall">Fall</option>
          <option value="winter">Winter</option>
          <option value="all">All seasons</option>
        </select></label>
      </div>
      <label style="display:flex; align-items:center; gap:6px; margin-top:10px;">
        <input type="checkbox" name="in_stock" checked /> In stock
      </label>
      <div class="admin-actions" style="margin-top:14px;">
        <button class="btn btn-primary save-item">Add item</button>
        <button class="btn btn-outline cancel-form">Cancel</button>
      </div>
    </div>
  `;
  const form = $(".inline-edit-form", container);
  const saveBtn = $(".save-item", form);
  saveBtn.addEventListener("click", withBusy(saveBtn, async () => {
    const data = readForm(form);
    if (!data.item_name) { toast("Item name is required.", true); throw new Error("Item name is required."); }
    await appendRow("farmstand_items", data);
    toast("Item added - it'll show on the live site within a minute or two.");
    container.innerHTML = "";
    await loadFarmstand();
  }));
  $(".cancel-form", form).addEventListener("click", () => { container.innerHTML = ""; });
});

// ============================================================ BLOCKED DATES

let blockedCache = { rows: [] };

async function loadBlockedDates() {
  blockedCache = await readTab("blocked_dates");
  renderBlockedList();
}

function renderBlockedList() {
  const list = $("#blocked-list");
  if (blockedCache.rows.length === 0) {
    list.innerHTML = `<p class="muted">No dates blocked right now.</p>`;
    return;
  }
  const sorted = blockedCache.rows
    .map((r, i) => ({ ...r, _i: i }))
    .sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));
  list.innerHTML = sorted.map((r) => `
    <div class="admin-row-card">
      <div class="meta">
        <strong>${escapeHtml(r.start_date)} &rarr; ${escapeHtml(r.end_date)}</strong>
        <span>${escapeHtml(r.reason)}</span>
      </div>
      <div class="admin-actions">
        <button class="btn btn-outline btn-sm remove-blocked" data-i="${r._i}">Remove</button>
      </div>
    </div>
  `).join("");
  $$(".remove-blocked", list).forEach((btn) => btn.addEventListener("click", withBusy(btn, async () => {
    const i = Number(btn.dataset.i);
    await removeRow("blocked_dates", i);
    toast("Date range removed.");
    await loadBlockedDates();
  })));
}

$("#blocked-add-btn").addEventListener("click", () => {
  const container = $("#blocked-form-container");
  container.innerHTML = `
    <div class="inline-edit-form">
      <div class="grid-2">
        <label>Start date<input type="date" name="start_date" required /></label>
        <label>End date<input type="date" name="end_date" required /></label>
      </div>
      <label>Reason (just for your own notes)<input name="reason" placeholder="e.g. booked on Airbnb" /></label>
      <div class="admin-actions" style="margin-top:14px;">
        <button class="btn btn-primary save-blocked">Block these dates</button>
        <button class="btn btn-outline cancel-form">Cancel</button>
      </div>
    </div>
  `;
  const form = $(".inline-edit-form", container);
  const saveBtn = $(".save-blocked", form);
  saveBtn.addEventListener("click", withBusy(saveBtn, async () => {
    const data = readForm(form);
    if (!data.start_date || !data.end_date) { toast("Both dates are required.", true); throw new Error("Both dates are required."); }
    await appendRow("blocked_dates", data);
    toast("Dates blocked - it'll show on the live site within a minute or two.");
    container.innerHTML = "";
    await loadBlockedDates();
  }));
  $(".cancel-form", form).addEventListener("click", () => { container.innerHTML = ""; });
});

// ============================================================ SITE STATUS (key/value)

const STATUS_FIELDS = [
  { key: "eggs_status", label: "Eggs" },
  { key: "pups_status", label: "Puppies" },
  { key: "stays_next_open", label: "Stays - next open date" },
];

let statusCache = { data: {} };

async function loadStatus() {
  statusCache = await readObjectTab("site_status");
  renderStatusForm();
}

function renderStatusForm() {
  const container = $("#status-form-container");
  const current = statusCache.data || {};
  container.innerHTML = `
    <div class="inline-edit-form">
      ${STATUS_FIELDS.map((f) => `
        <label>${f.label}<input name="${f.key}" value="${escapeHtml(current[f.key])}" /></label>
      `).join("")}
      <div class="admin-actions" style="margin-top:14px;">
        <button class="btn btn-primary save-status">Save</button>
      </div>
    </div>
  `;
  const form = $(".inline-edit-form", container);
  const saveBtn = $(".save-status", form);
  saveBtn.addEventListener("click", withBusy(saveBtn, async () => {
    const updated = { ...current };
    for (const f of STATUS_FIELDS) {
      updated[f.key] = $(`[name="${f.key}"]`, form).value.trim();
    }
    await writeObjectTab("site_status", updated);
    toast("Saved - it'll show on the live site within a minute or two.");
    await loadStatus();
  }));
}
