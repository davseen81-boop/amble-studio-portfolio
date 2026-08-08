# DynamiX Group

Providing certainty in life.

A single-page site for DynamiX Group, the Singapore wealth advisory firm founded and led by David Seen, built as a self-contained `index.html`.

Brand identity and visual system live in [`docs/branding.md`](docs/branding.md) — the AWFA kit, now the source of truth across every surface here. The site keeps the DynamiX Group name and its firm voice; only the visual system moved. The palette is gold `#D5AB45` on black `#111111`, with Raleway throughout.

That black is a deliberate deviation from the kit, which specifies forest `#27392E` as its dark anchor: David asked for gold and black. It also suits the logo better — the chrome lettering washes out on light grounds — and raises the gold/dark contrast from 5.69:1 to 8.76:1. The previous DynamiX kit is kept at [`docs/branding-dynamix.md`](docs/branding-dynamix.md) as a record of the earlier identity.

Gold is a light colour, which makes two rules load-bearing rather than stylistic: nothing white ever sits on a gold fill (2.16:1 — buttons take black text instead, 8.76:1), and gold is never small text on white (the `--accent-text` token, `#8A6B1E`, is the 5:1 substitute). The same applies to the amber, green, red, and blue semantic colours, which each have a `-text` variant for use as type.

## Logo assets

`assets/dynamix-lockup.png` (1006x523) is the real DynamiX Group logo with a genuine alpha
channel — 78% of its pixels are fully transparent, so it drops straight onto the black hero
panel without a plate behind it. Everything else is derived from it:

- `dynamix-favicon.png` (64x64) — browser tab.
- `dynamix-badge.png` (180x180) — nav, footer, apple-touch-icon.
- `dynamix-icon-512.png` (512x512) — PWA manifest, `purpose: any`.
- `dynamix-maskable-512.png` (512x512) — PWA `purpose: maskable`, with a wider safe zone,
  since launchers crop maskable icons to a circle.
- `dynamix-social.png` (1200x630) — `og:image`, the full lockup on black at OG's 1.91:1.

Every icon is the **full lockup** on black, at the largest size the square allows. A 2:1 mark
in a square is a compromise — at 64px the tagline is gone and the wordmark is small — but the
full logo is what was asked for, and padding is kept tight so it reads as well as it can.
Regenerate them from the lockup if it ever changes.

The nav, footer, and dashboard header show the lockup directly rather than a square badge
beside a typed wordmark, which duplicated the name and tagline the logo already contains. The
header is black for the same reason the icons are: the logo's chrome lettering nearly vanishes
on white.

The two earlier exports (`Dynamix New Transparent.jpg` / `.png`) had the transparency-preview
checkerboard flattened into the pixels rather than a real alpha channel, so they aren't used.

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
