// Delaware Run Farm — admin-page sign-in. No Google, no OAuth popup:
// the owner pastes a GitHub Personal Access Token (scoped to just this
// one repo, see GITHUB_SETUP.md) once per browser. It's stored only in
// that browser's localStorage and sent only to api.github.com - never
// seen by anyone else, never committed anywhere.
import { GITHUB_OWNER, GITHUB_REPO } from "./site-config.js";

const STORAGE_KEY = "drf_admin_token";

export function getToken() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function isSignedIn() {
  return !!getToken();
}

export function signOut() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore - nothing to clear
  }
}

// Verifies the token actually works against this specific repo before
// trusting it (catches a typo'd or wrongly-scoped token immediately,
// rather than failing later on the first save).
export async function verifyAndStoreToken(token) {
  const resp = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (resp.status === 401 || resp.status === 403) {
    throw new Error("That token was rejected - check it was copied in full and has Contents: Read and write access to this repo.");
  }
  if (!resp.ok) {
    throw new Error(`Could not verify the token (HTTP ${resp.status}). Check your internet connection and try again.`);
  }
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    throw new Error("Could not save the token in this browser (private/incognito mode blocks this). Try a normal browser window.");
  }
}
