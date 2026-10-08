// Delaware Run Farm — homepage "This week on the farm" panel. Reads the
// site_status tab and overwrites each pill's text in place; leaves the
// page's own static copy untouched (including the pill's color) if the
// sheet isn't reachable yet (not configured, offline, etc).
import { fetchKeyValueTab } from "./data-reader.js";

document.addEventListener("DOMContentLoaded", async () => {
  let status;
  try {
    status = await fetchKeyValueTab("site_status");
  } catch (err) {
    console.warn("Could not load live farm status, showing placeholder text.", err);
    return;
  }
  document.querySelectorAll("[data-status]").forEach((el) => {
    const value = status[el.getAttribute("data-status")];
    if (value) el.textContent = value;
  });
});
