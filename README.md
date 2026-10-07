# Delaware Run Farm — website prototype

A plain static HTML/CSS/JS site (no build step) for Delaware Run Farm,
a working family farm in Watsontown, PA. Covers all five offerings:
racing ponies, Cavalier King Charles puppies, seasonal produce/eggs/honey,
farm stays, and in-person visits.

## Structure

```
index.html        Home
ponies.html        Racing ponies for sale
cavaliers.html     Cavalier King Charles puppies
farm-stand.html    Produce, eggs & honey
stays.html         Farm stays overview
book-stay.html     Request-to-book form
visit.html         Hours, directions, farm manners, contact
css/style.css      Shared design system
js/main.js         Nav toggle, FAQ accordions, filter chips, Formspree
                   form handling, booking summary math
assets/            Logo, favicon, curated photos
```

## Before going live

1. **Forms**: every `<form data-formspree>` posts to
   `https://formspree.io/f/your-form-id`. Create a free account at
   [formspree.io](https://formspree.io), make one form per page (or reuse
   one form ID for all of them), and replace that placeholder `action`
   URL in each HTML file.
2. **Real business details**: phone, email, address, hours, and every
   price/pony/litter detail in these pages are realistic placeholders.
   Search each file for the current placeholder phone number
   `(570) 555-0142` and address `123 Creek Road` to find what to replace.
3. **Logo**: `assets/logo.svg` is a simple placeholder mark. Swap in the
   real logo file and update the `<img src="assets/logo.svg">` references
   (and `assets/favicon.svg`) across all 7 pages.
4. **Photos**: `assets/photos/` holds a curated ~44-photo selection out of
   the full raw archive in `image library/` (gitignored, not deployed).
   None of the Ponies/Cavalier photos are of this farm's actual specific
   animals — the ponies/breeding shots are real but generic to the
   property, and the Cavalier/Farm Stand shots are AI-generated
   placeholders. Replace with real photos of the actual animals/products
   whenever available.

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
