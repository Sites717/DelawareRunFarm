// Delaware Run Farm — ponies page. Reads the "ponies" tab and replaces
// the static placeholder cards with the real list. If the sheet can't
// be reached yet (not configured, offline), the page quietly keeps
// showing its own static markup instead of going blank.
import { fetchTab, toDirectImageUrl } from "./data-reader.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function pillFor(status) {
  if (status === "available") return { cls: "pill-ok", label: "Available" };
  if (status === "reserved") return { cls: "pill-bad", label: "Reserved" };
  if (status === "coming") return { cls: "pill-warn", label: "Coming soon" };
  return { cls: "pill-warn", label: status ? status[0].toUpperCase() + status.slice(1) : "Status unknown" };
}

function pedigreeLine(p) {
  if (p.sire && p.dam) return `Sire: ${escapeHtml(p.sire)} &middot; Dam: ${escapeHtml(p.dam)}`;
  if (p.sire) return `Sire: ${escapeHtml(p.sire)}`;
  if (p.dam) return `Dam: ${escapeHtml(p.dam)}`;
  return "";
}

function cardHtml(p) {
  const status = (p.status || "").toLowerCase();
  const pill = pillFor(status);
  const photo = p.photo_url ? toDirectImageUrl(p.photo_url) : "assets/photos/ponies-training-ring.jpg";
  const footerRight = status === "reserved"
    ? `<span class="muted" style="font-weight:700;">Reserved</span>`
    : (p.price ? `<span class="price">${status === "coming" ? "From $" : "$"}${escapeHtml(p.price)}</span>` : "<span></span>");
  return `
    <article class="animal-card" data-pony data-status="${escapeHtml(status)}">
      <div class="animal-photo" style="background-image:url('${photo}');">
        <span class="animal-status pill ${pill.cls}">${pill.label}</span>
      </div>
      <div class="animal-body">
        <h3 class="animal-name">${escapeHtml(p.name) || "Unnamed"}</h3>
        <p class="animal-pedigree">${pedigreeLine(p)}</p>
        <div class="spec-row">
          <div><span>Age</span>${escapeHtml(p.age) || "&mdash;"}</div>
          <div><span>Height</span>${escapeHtml(p.height) || "&mdash;"}</div>
          <div><span>Sex</span>${escapeHtml(p.sex) || "&mdash;"}</div>
        </div>
        <p>${escapeHtml(p.description)}</p>
        <div class="animal-footer">
          ${footerRight}
          <a href="visit.html#contact" class="btn btn-outline">Ask about ${escapeHtml(p.name) || "this pony"}</a>
        </div>
      </div>
    </article>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.querySelector("[data-ponies-grid]");
  const countEl = document.querySelector("[data-ponies-count]");
  if (!grid) return;

  let rows;
  try {
    rows = await fetchTab("ponies");
  } catch (err) {
    console.warn("Could not load live ponies data, keeping placeholder content.", err);
    return;
  }

  const visible = rows.filter((p) => (p.status || "").toLowerCase() !== "sold");
  if (countEl) countEl.textContent = `${visible.length} ${visible.length === 1 ? "pony" : "ponies"}`;
  grid.innerHTML = visible.length
    ? visible.map(cardHtml).join("")
    : `<p class="muted">No ponies listed right now &mdash; check back soon, or join the Farm Letter to hear about the next litter.</p>`;
});
