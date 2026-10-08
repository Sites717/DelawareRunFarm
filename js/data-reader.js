// Delaware Run Farm — public, read-only content access. Every normal
// page (index/ponies/cavaliers/farm-stand/stays/visit/book-stay) reads
// its live content from the plain JSON files in data/, served same-
// origin by GitHub Pages like any other static asset - no sign-in, no
// external service, no API key. The admin page writes these same files
// back through the GitHub API instead (see github-api.js).
import { TABS } from "./site-config.js";

// A cache-buster so a just-saved admin edit shows up on the next page
// load instead of a stale cached copy of the JSON file.
function bust(path) {
  return `${path}?v=${Date.now()}`;
}

async function fetchJson(tabName) {
  const schema = TABS[tabName];
  if (!schema) throw new Error(`Unknown data tab "${tabName}"`);
  const resp = await fetch(bust(schema.path));
  if (!resp.ok) throw new Error(`Could not load "${tabName}" (HTTP ${resp.status})`);
  return resp.json();
}

// Ponies / farm stand items / blocked dates - a plain array of records.
export async function fetchTab(tabName) {
  const rows = await fetchJson(tabName);
  return Array.isArray(rows) ? rows : [];
}

// The current Cavalier litter - a single record, or null if not set yet.
export async function fetchSingleRow(tabName) {
  const row = await fetchJson(tabName);
  return row && typeof row === "object" ? row : null;
}

// The homepage status banner - a plain {key: value} object.
export async function fetchKeyValueTab(tabName) {
  const obj = await fetchJson(tabName);
  return obj && typeof obj === "object" ? obj : {};
}

// Photos are either one of the curated assets/photos/... files already
// in the repo, or one uploaded from the admin page under
// assets/photos/uploaded/... - both are already-servable relative paths,
// so this is a pass-through. Kept as its own function (rather than used
// inline) so a future external photo host could be swapped in here
// without touching every page that calls it.
export function toDirectImageUrl(path) {
  return path || "";
}
