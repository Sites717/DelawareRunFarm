// Delaware Run Farm — cavaliers page. Reads the single-row
// cavaliers_litter tab and rebuilds the "current litter" panel. Keeps
// the page's own static placeholder if the sheet isn't reachable yet.
import { fetchSingleRow } from "./data-reader.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function longDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T00:00:00`);
  if (isNaN(d)) return isoDate;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function shortDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T00:00:00`);
  if (isNaN(d)) return isoDate;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_PILL = {
  expecting: { cls: "pill-warn", label: "Expecting" },
  available: { cls: "pill-ok", label: "Pups available" },
  reserved: { cls: "pill-bad", label: "All reserved" },
};

function colorBreakdown(c) {
  const parts = [
    [c.blenheim_count, "Blenheim"],
    [c.tricolor_count, "Tricolor"],
    [c.blacktan_count, "Black & Tan"],
    [c.ruby_count, "Ruby"],
  ].filter(([n]) => Number(n) > 0);
  return parts.map(([n, label]) => `${n} ${label}`).join(" &middot; ");
}

function panelHtml(c) {
  const status = (c.status || "").toLowerCase();
  if (status === "none" || (!c.sire && !c.dam && !status)) {
    return `
      <div class="section-head">
        <p class="eyebrow">The current litter</p>
        <h2>No litter on the ground right now.</h2>
      </div>
      <p class="muted">Join the litter list below and we'll reach out the moment the next one arrives.</p>
    `;
  }

  const total = ["blenheim_count", "tricolor_count", "blacktan_count", "ruby_count"]
    .reduce((sum, key) => sum + (Number(c[key]) || 0), 0);
  const pill = STATUS_PILL[status] || { cls: "pill-warn", label: c.status || "" };
  const breakdown = colorBreakdown(c);

  return `
    <div class="section-head">
      <p class="eyebrow">The current litter</p>
      <h2>${c.born_date ? `Born ${longDate(c.born_date)}` : "The current litter"}</h2>
    </div>
    <div class="info-panel" style="max-width:none;">
      <div class="grid-4" style="gap:0;">
        <div class="info-row" style="flex-direction:column; align-items:flex-start; border-bottom:none; border-right:1px solid var(--line);">
          <span class="label">Sire</span><span class="value">${escapeHtml(c.sire) || "&mdash;"}</span>
        </div>
        <div class="info-row" style="flex-direction:column; align-items:flex-start; border-bottom:none; border-right:1px solid var(--line);">
          <span class="label">Dam</span><span class="value">${escapeHtml(c.dam) || "&mdash;"}</span>
        </div>
        <div class="info-row" style="flex-direction:column; align-items:flex-start; border-bottom:none; border-right:1px solid var(--line);">
          <span class="label">Go-home date</span><span class="value">${shortDate(c.go_home_date) || "TBD"}</span>
        </div>
        <div class="info-row" style="flex-direction:column; align-items:flex-start; border-bottom:none;">
          <span class="label">Price</span><span class="value">${c.price ? "$" + escapeHtml(c.price) : "TBD"}</span>
        </div>
      </div>
    </div>
    <p class="muted" style="margin-top:14px;">
      <span class="pill ${pill.cls}">${total ? total + " pups" : pill.label}</span>
      ${breakdown ? `&nbsp; ${breakdown}` : ""}
    </p>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const panel = document.querySelector("[data-cavaliers-panel]");
  if (!panel) return;
  let row;
  try {
    row = await fetchSingleRow("cavaliers_litter");
  } catch (err) {
    console.warn("Could not load live litter data, keeping placeholder content.", err);
    return;
  }
  if (!row) return;
  panel.innerHTML = panelHtml(row);
});
