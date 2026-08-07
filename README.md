# DynamiX Group

Providing certainty in life.

A single-page site for DynamiX Group, the Singapore wealth advisory firm founded and led by David Seen, built as a self-contained `index.html`. Brand identity, voice, and visual system live in [`docs/branding-dynamix.md`](docs/branding-dynamix.md), the current source of truth for this site.

David's personal advisor brand, AWFA, has its own separate kit at [`docs/branding-awfa.md`](docs/branding-awfa.md) for reference; the two are related but visually distinct (see the "Relationship to the AWFA Brand" section of the DynamiX kit).

## Logo assets

`assets/` holds resized copies of the real DynamiX Group logo (`Dynamix logo social.png`, the one export that actually has a proper background rather than a baked-in transparency checkerboard):

- `dynamix-badge.png` (180x180) — used in the nav and footer as the brand mark.
- `dynamix-favicon.png` (64x64) — browser tab icon.
- `dynamix-social.png` (512x512) — `og:image` for link previews.

The two earlier exports (`Dynamix New Transparent.jpg` / `.png`) both turned out to have the transparency-preview checkerboard flattened into the pixels rather than a real alpha channel, so they aren't used. If a clean transparent PNG or SVG of the full lockup (or just the X/ring mark on its own) becomes available, it can replace these directly.

## Daily Dashboard

`dashboard/` is a private, installable daily task dashboard for David, served from the same
site at `/dashboard/` (`noindex`, not linked from the marketing page). It tracks recurring
routines, keeps nagging about anything missed until it is done, and can pull tasks in from
Google Calendar events tagged `#task` and Gmail threads labelled `Dashboard/Task`.

It works standalone with no setup — routines live in the browser's local storage. Two optional
layers sit on top:

- **`apps-script/Code.gs`** — a Google Apps Script running under David's own account that pulls
  in tagged Calendar events, labelled Gmail threads, and (once configured) Zoho Mail, and syncs
  completions across devices.
- **`api/chat.ts`** — a Vercel serverless function backing the dashboard's Ask tab. It holds the
  Anthropic API key and nothing else; routines and conversation stay in the browser.

Full setup and usage: [`docs/dashboard.md`](docs/dashboard.md).

## Contact details

The email, phone, and consultation copy on the live site are placeholders, replace them with DynamiX Group's real contact details before sharing this publicly.

## Preview

Open `index.html` directly in a browser, or serve the folder with any static file server.

## Deploy

- **Vercel:** project `amble-studio-portfolio` (name predates two rebrands now; rename when convenient).
  The dashboard assistant needs `ANTHROPIC_API_KEY` set in the project's environment variables,
  and `DASHBOARD_SHARED_KEY` is strongly recommended so the endpoint is not open to anyone who
  finds the URL.
- **GitHub Pages:** enable in repo settings (Pages → `main` branch, root folder).
