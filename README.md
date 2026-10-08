# Delaware Run Farm — website prototype

A plain static HTML/CSS/JS site (no build step) for Delaware Run Farm,
a working family farm in Watsontown, PA. Covers all five offerings:
racing ponies, Cavalier King Charles puppies, seasonal produce/eggs/honey,
farm stays, and in-person visits.

## Structure

```
index.html          Home - "this week on the farm" banner is live
ponies.html          Racing ponies for sale - list is live
cavaliers.html       Cavalier King Charles puppies - current litter is live
farm-stand.html      Produce, eggs & honey - stock board is live
stays.html           Farm stays overview (static copy)
book-stay.html       Request-to-book form - calendar hides owner-blocked dates
visit.html           Hours, directions, farm manners, contact (static copy)
admin.html           Owner-only page to edit all of the above (no GitHub UI needed day-to-day)
GITHUB_SETUP.md       One-time setup: create a Personal Access Token
data/*.json          The editable "database" - plain JSON files committed in this repo
css/style.css        Shared design system
js/main.js           Nav toggle, FAQ accordions, filter chips, Formspree
                     form handling, booking summary math
js/site-config.js     Repo owner/name/branch + the data-file schema
js/data-reader.js     Public, read-only content fetch (used by all 7 public pages)
js/github-auth.js     Admin-only token storage/verification
js/github-api.js      Admin-only authenticated read/write (via GitHub's Contents API) + photo upload
js/page-*.js          Per-page wiring that renders live content into each public page
js/admin.js           Admin page logic
assets/              Logo, favicon, curated photos (assets/photos/uploaded/ holds admin uploads)
```

Ponies, the Cavalier litter, farm stand stock, blocked stay dates, and
the homepage status banner are all edited from `admin.html` - the owner
never needs to touch a JSON file, a Google account, or any code
directly. Every save there is a real git commit to `data/*.json`, so
there's a full history of every change for free. Edits take about a
minute to go live (GitHub Pages rebuilds the site after each commit) -
not instant, but close. Each public page quietly falls back to its own
built-in placeholder content if the data files are ever unreachable
(e.g. no network).

## Before going live

1. **GitHub token**: follow `GITHUB_SETUP.md` once (about 5 minutes),
   then paste the resulting token into `admin.html`. After that,
   everything editable lives behind that one page.
2. **Forms**: every `<form data-formspree>` posts to
   `https://formspree.io/f/your-form-id`. Create a free account at
   [formspree.io](https://formspree.io), make one form per page (or reuse
   one form ID for all of them), and replace that placeholder `action`
   URL in each HTML file.
3. **Real business details**: phone, email, address, and hours are
   realistic placeholders. Search each file for the current placeholder
   phone number `(570) 555-0142` and address `123 Creek Road` to find
   what to replace. (Pony/litter/farm-stand details live in `data/*.json`
   and are edited from `admin.html` instead.)
4. **Photos**: `assets/photos/` holds a curated ~44-photo selection out of
   the full raw archive in `image library/` (gitignored, not deployed).
   None of the Ponies/Cavalier photos are of this farm's actual specific
   animals — the ponies/breeding shots are real but generic to the
   property, and the Cavalier/Farm Stand shots are AI-generated
   placeholders. Replace with real photos of the actual animals/products
   whenever available (ponies/cavalier litter photos can now be uploaded
   directly from `admin.html` instead).

## Deploying to GitHub Pages

```
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

Then in the repo's GitHub Settings → Pages, set **Source: Deploy from a
branch**, branch `main`, folder `/ (root)`. No build step, no GitHub
Actions workflow needed — it's plain static files.
