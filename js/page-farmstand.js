// Delaware Run Farm — farm stand page. Reads the farmstand_items tab
// and uses it for two things: the "on the board this week" list (every
// in-stock item), and a small in-stock tag list appended under each
// season's copy. Keeps the page's own static placeholders if the sheet
// isn't reachable yet.
import { fetchTab } from "./data-reader.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderStockBoard(items) {
  const board = document.querySelector("[data-stock-board]");
  if (!board) return;
  const inStock = items.filter((i) => (i.in_stock || "").toLowerCase() === "yes");
  board.innerHTML = inStock.length
    ? inStock.map((i) => `
        <div class="info-row" style="border-color:rgba(255,255,255,0.14);">
          <span class="label" style="color:#CFC9B4;">${escapeHtml(i.item_name)}</span>
          <span class="value" style="color:#fff;">In stock</span>
        </div>
      `).join("")
    : `<p class="muted" style="color:#CFC9B4;">Nothing on the board right now &mdash; check back soon.</p>`;
}

function renderSeasonTags(items) {
  document.querySelectorAll("[data-season-items]").forEach((el) => {
    const season = el.getAttribute("data-season-items");
    const matches = items.filter((i) => {
      if ((i.in_stock || "").toLowerCase() !== "yes") return false;
      const itemSeason = (i.season || "").toLowerCase();
      return itemSeason === season || itemSeason === "all";
    });
    el.innerHTML = matches.map((i) => `<span class="pill pill-neutral">${escapeHtml(i.item_name)}</span>`).join("");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  let items;
  try {
    items = await fetchTab("farmstand_items");
  } catch (err) {
    console.warn("Could not load live farm stand data, keeping placeholder content.", err);
    return;
  }
  renderStockBoard(items);
  renderSeasonTags(items);
});
