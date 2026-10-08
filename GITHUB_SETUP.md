# One-time GitHub setup for the admin page

Do this once. Takes about 5 minutes. After this, you'll just paste one
token into the admin page and never touch GitHub, Google, or any code
directly again.

## What this is

The farm's editable content (ponies, the current litter, farm stand
stock, blocked stay dates, the homepage status banner) lives as plain
JSON files in this same repo, under `data/`. The admin page
(`admin.html`) edits those files directly through GitHub's own API.
Every save is a real git commit — so you automatically get a full
history of every change, and nothing is ever truly lost.

To let the admin page make those commits on your behalf, it needs a
**Personal Access Token** — a long random password-like string that
proves it's allowed to write to this one repo, and nothing else.

## 1. Create the token

1. Go to
   [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)
   (sign in to GitHub first if asked).
2. **Token name**: anything you'll recognize later, e.g. "Delaware Run Farm Admin".
3. **Expiration**: pick the longest option offered (up to 1 year). You'll
   need to repeat this whole page once it expires — worth putting a
   reminder on your calendar for then.
4. **Repository access**: choose **Only select repositories**, then pick
   `Sites717/DelawareRunFarm`. (Do not choose "All repositories" — this
   token should only ever be able to touch this one site.)
5. **Permissions**: expand **Repository permissions**, find **Contents**,
   and set it to **Read and write**. Leave everything else as **No access**.
6. Scroll down and click **Generate token**.
7. Copy the token shown (it starts with `github_pat_`) — **this is the
   only time GitHub will show it to you**. If you lose it, you'll just
   generate a new one.

## 2. Connect the admin page

1. Open `admin.html` on the live site.
2. Paste the token into the **Connect** box and submit.
3. That's it — the token is saved only in that browser, on that device.
   You won't need to paste it again here, but you will need to paste it
   once more on any other browser or device you want to use the admin
   page from (a work laptop, a phone, etc).

## Who can actually use the admin page

Anyone who has this exact token can edit the site. Treat it like a
password: don't post it anywhere public, and don't share it over email
or text if you can avoid it. If you ever think it's been seen by someone
it shouldn't have, go back to
[github.com/settings/tokens](https://github.com/settings/tokens),
delete it, and generate a fresh one (step 1 above) — the old one stops
working immediately.

## If something goes wrong

- **"That token was rejected"** when connecting: double-check you copied
  the whole token (it's long), and that you picked this repo and gave it
  Contents: Read and write in step 1.
- **A save fails partway**: nothing is lost — the data files are still
  whatever they were before your edit. Just try the save again.
- **You want to undo a change** after the fact: every save is a commit,
  so the full history is visible at
  `github.com/Sites717/DelawareRunFarm/commits/master` — a developer can
  revert any specific change from there if you ever need that.
