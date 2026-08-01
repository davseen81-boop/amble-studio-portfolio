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

## Contact details

The email, phone, and consultation copy on the live site are placeholders, replace them with DynamiX Group's real contact details before sharing this publicly.

## Preview

Open `index.html` directly in a browser, or serve the folder with any static file server.

## Deploy

- **Vercel:** project `amble-studio-portfolio` (name predates two rebrands now; rename when convenient).
- **GitHub Pages:** enable in repo settings (Pages → `main` branch, root folder).
