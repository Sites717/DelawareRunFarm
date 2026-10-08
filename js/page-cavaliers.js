// Delaware Run Farm — cavaliers page. Reads the single-row
// cavaliers_litter tab and rebuilds the "current litter" panel, and
// reads the cavalier_puppies list to render individual puppy cards.
// Keeps the page's own static placeholder if the data isn't reachable yet.
import { fetchSingleRow, fetchTab, toDirectImageUrl } from "./data-reader.js";

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

function puppyPillFor(status) {
  if (status === "available") return { cls: "pill-ok", label: "Available" };
  if (status === "reserved") return { cls: "pill-bad", label: "Reserved" };
  return { cls: "pill-warn", label: status ? status[0].toUpperCase() + status.slice(1) : "Status unknown" };
}

function puppyCardHtml(p) {
  const status = (p.status || "").toLowerCase();
  const pill = puppyPillFor(status);
  const photo = p.photo_url ? toDirectImageUrl(p.photo_url) : "assets/photos/cavaliers-contact-sheet.jpg";
  const footerRight = status === "reserved"
    ? `<span class="muted" style="font-weight:700;">Reserved</span>`
    : (p.price ? `<span class="price">$${escapeHtml(p.price)}</span>` : "<span></span>");
  return `
    <article class="animal-card" data-status="${escapeHtml(status)}">
      <div class="animal-photo" style="background-image:url('${photo}');">
        <span class="animal-status pill ${pill.cls}">${pill.label}</span>
      </div>
      <div class="animal-body">
        <h3 class="animal-name">${escapeHtml(p.name) || "Unnamed"}</h3>
        <p class="animal-pedigree">${escapeHtml(p.color)}${p.sex ? ` &middot; ${escapeHtml(p.sex)}` : ""}</p>
        <p>${escapeHtml(p.description)}</p>
        <div class="animal-footer">
          ${footerRight}
          <a href="visit.html#contact" class="btn btn-outline">Ask about ${escapeHtml(p.name) || "this puppy"}</a>
        </div>
      </div>
    </article>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const panel = document.querySelector("[data-cavaliers-panel]");
  if (panel) {
    try {
      const row = await fetchSingleRow("cavaliers_litter");
      if (row) panel.innerHTML = panelHtml(row);
    } catch (err) {
      console.warn("Could not load live litter data, keeping placeholder content.", err);
    }
  }

  const puppiesSection = document.querySelector("[data-puppies-section]");
  const puppiesGrid = document.querySelector("[data-puppies-grid]");
  if (puppiesSection && puppiesGrid) {
    try {
      const puppies = await fetchTab("cavalier_puppies");
      const visible = puppies.filter((p) => (p.status || "").toLowerCase() !== "sold");
      if (visible.length) {
        puppiesGrid.innerHTML = visible.map(puppyCardHtml).join("");
        puppiesSection.style.display = "";
      }
    } catch (err) {
      console.warn("Could not load individual puppy data.", err);
    }
  }
});
