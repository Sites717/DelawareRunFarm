// Delaware Run Farm — authenticated read/write to the data/*.json files
// and assets/photos/uploaded/ via GitHub's own Contents API. Every call
// here commits directly to the live repo - each save is a real git
// commit (so the owner gets full history/undo for free), and goes live
// on the site after GitHub Pages finishes its next build (usually under
// a couple of minutes).
import { GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, PHOTOS_DIR, TABS } from "./site-config.js";
import { getToken } from "./github-auth.js";

const API_ROOT = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

function authHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/vnd.github+json",
  };
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function base64ToUtf8(b64) {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function getFile(path) {
  const resp = await fetch(`${API_ROOT}/contents/${path}?ref=${GITHUB_BRANCH}`, { headers: authHeaders() });
  if (!resp.ok) throw new Error(`Could not read ${path} (HTTP ${resp.status})`);
  const body = await resp.json();
  return { text: base64ToUtf8(body.content), sha: body.sha };
}

async function putFile(path, base64Content, sha, message) {
  const resp = await fetch(`${API_ROOT}/contents/${path}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: base64Content,
      branch: GITHUB_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Save failed (HTTP ${resp.status}): ${body.slice(0, 300)}`);
  }
  return resp.json();
}

async function readArray(tabName) {
  const { path } = TABS[tabName];
  const { text, sha } = await getFile(path);
  const rows = JSON.parse(text || "[]");
  return { rows: Array.isArray(rows) ? rows : [], sha };
}

async function writeArray(tabName, rows, sha, message) {
  const { path } = TABS[tabName];
  const content = utf8ToBase64(JSON.stringify(rows, null, 2) + "\n");
  return putFile(path, content, sha, message);
}

// ---- Array-shaped tabs: ponies, farmstand_items, blocked_dates ----

export async function readTab(tabName) {
  return readArray(tabName);
}

export async function appendRow(tabName, rowObject) {
  const { rows, sha } = await readArray(tabName);
  rows.push(rowObject);
  return writeArray(tabName, rows, sha, `Admin: add to ${tabName}`);
}

export async function updateRow(tabName, index, rowObject) {
  const { rows, sha } = await readArray(tabName);
  if (index < 0 || index >= rows.length) throw new Error("That row no longer exists - someone may have just edited it. Refresh and try again.");
  rows[index] = rowObject;
  return writeArray(tabName, rows, sha, `Admin: update ${tabName}`);
}

// A real delete (not a soft clear) - safe here because every edit is a
// git commit, so nothing is ever truly unrecoverable.
export async function removeRow(tabName, index) {
  const { rows, sha } = await readArray(tabName);
  if (index < 0 || index >= rows.length) throw new Error("That row no longer exists - someone may have just edited it. Refresh and try again.");
  rows.splice(index, 1);
  return writeArray(tabName, rows, sha, `Admin: remove from ${tabName}`);
}

// ---- Object-shaped tabs: cavaliers_litter, site_status ----

export async function readObjectTab(tabName) {
  const { path } = TABS[tabName];
  const { text, sha } = await getFile(path);
  const data = JSON.parse(text || "{}");
  return { data: data && typeof data === "object" ? data : {}, sha };
}

export async function writeObjectTab(tabName, dataObject) {
  const { path } = TABS[tabName];
  let sha;
  try {
    ({ sha } = await getFile(path));
  } catch {
    sha = undefined; // file doesn't exist yet - this creates it
  }
  const content = utf8ToBase64(JSON.stringify(dataObject, null, 2) + "\n");
  return putFile(path, content, sha, `Admin: update ${tabName}`);
}

// ---- Photo uploads ----

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function safeFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/-+/g, "-");
}

// Uploads into assets/photos/uploaded/, timestamp-prefixed so names
// never collide and no existing file's sha is ever needed. Returns the
// relative path to store in a record's photo_url field.
export async function uploadPhoto(file) {
  const base64 = await readFileAsBase64(file);
  const path = `${PHOTOS_DIR}/${Date.now()}-${safeFileName(file.name)}`;
  await putFile(path, base64, undefined, `Admin: upload photo ${file.name}`);
  return path;
}
