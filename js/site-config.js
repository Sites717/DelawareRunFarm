// Delaware Run Farm — shared configuration. The "database" is just JSON
// files committed in this same repo, under data/ — no Google Sheets, no
// Google Drive, no Cloud Console project. Public pages read those files
// directly (same-origin fetch, always works). The admin page additionally
// writes them back via the GitHub API, using a Personal Access Token the
// owner pastes once into their own browser (see GITHUB_SETUP.md) - that
// token is never seen by anyone else and never committed anywhere.

export const GITHUB_OWNER = "Sites717";
export const GITHUB_REPO = "DelawareRunFarm";
export const GITHUB_BRANCH = "master";

// Where new admin-uploaded photos are saved - kept separate from the
// curated assets/photos/ set already in the repo.
export const PHOTOS_DIR = "assets/photos/uploaded";

// One entry per data file: its path (for both the public fetch and the
// admin page's GitHub API calls) and its shape - "array" for a list of
// records (ponies, farm stand items, blocked dates), "object" for a
// single record (the current litter, the homepage status banner).
export const TABS = {
  ponies: { path: "data/ponies.json", kind: "array" },
  cavaliers_litter: { path: "data/cavaliers_litter.json", kind: "object" },
  farmstand_items: { path: "data/farmstand_items.json", kind: "array" },
  blocked_dates: { path: "data/blocked_dates.json", kind: "array" },
  site_status: { path: "data/site_status.json", kind: "object" },
};
