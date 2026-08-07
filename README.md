# DynamiX Group

Providing certainty in life.

A single-page site for DynamiX Group, the Singapore wealth advisory firm founded and led by David Seen, built as a self-contained `index.html`.

Brand identity and visual system live in [`docs/branding.md`](docs/branding.md) — the AWFA kit, now the source of truth across every surface here. The site keeps the DynamiX Group name and its firm voice; only the visual system moved, so the palette is gold `#D5AB45` on forest `#27392E` with Raleway throughout. The previous DynamiX kit is kept at [`docs/branding-dynamix.md`](docs/branding-dynamix.md) as a record of the earlier identity.

Gold is a light colour, which makes two rules load-bearing rather than stylistic: nothing white ever sits on a gold fill (2.16:1 — buttons take forest text instead, 5.69:1), and gold is never small text on white (the `--accent-text` token, `#8A6B1E`, is the 5:1 substitute). The same applies to the amber, green, red, and blue semantic colours, which each have a `-text` variant for use as type.

## Logo assets

The site now ships flat gold-and-forest marks generated to match the brand kit, which also satisfies the DynamiX kit's own instruction not to reproduce the original chrome/bevel rendering on screen:

- `dynamix-badge-gold.png` (180x180) — nav, footer, and apple-touch-icon.
- `dynamix-favicon-gold.png` (64x64) — browser tab icon.
- `dynamix-icon-512.png` (512x512) — PWA manifest icon (`any` + `maskable`).
- `dynamix-social-gold.png` (1200x630) — `og:image` for link previews.
- `dynamix-lockup-gold.png` (1000x520, transparent) — the hero lockup.

These are a coded wordmark — an X monogram in a thin gold ring, per the kit's fallback rules — not the official artwork. Drop in a real flat logo when one exists and repoint these filenames.

The original chrome exports are kept alongside them (`dynamix-badge.png`, `dynamix-favicon.png`, `dynamix-social.png`, `dynamix-lockup.png`) and are no longer referenced.

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
