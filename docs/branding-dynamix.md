# Branding Kit — DynamiX Group

> Derived from the DynamiX Group logo mark (`Dynamix New Transparent.jpg`). This is the source of truth for visual identity and voice across the DynamiX Group website and related materials. DynamiX Group is the agency founded and led by David Seen; where David's personal AWFA brand ([`branding-awfa.md`](branding-awfa.md)) speaks in the first person to individual clients, DynamiX Group speaks as the firm.

---

## 1. Brand Identity

### 1.1 The North Star
**Tagline:** *Providing certainty in life.*

Where AWFA is the personal, first-person promise, DynamiX Group is the institutional version of the same idea: a firm built so that certainty isn't dependent on any one person in the room.

### 1.2 Mission
Give Singaporean individuals, families, and businesses a steady, disciplined financial partner, not a one-time transaction, so that big decisions (protection, retirement, legacy, employee benefits) are handled with the same care whether you're a solo client or a 200-person company.

### 1.3 Positioning
A **wealth advisory firm**, not a brokerage. DynamiX Group is built around continuity: a bench of advisors trained under one philosophy, so certainty survives any single relationship. David Seen founded and leads the firm; the firm is bigger than any one advisor.

### 1.4 Audience
- **Primary:** Singapore-based individuals and families seeking ongoing advisory relationships (CPF, protection, retirement, legacy).
- **Secondary:** Small and mid-sized businesses needing corporate advisory and employee benefits structuring.
- **Tertiary:** Advisors evaluating DynamiX Group as a firm to join.

### 1.5 Brand Personality
| Trait | What it means | What it isn't |
|---|---|---|
| **Steady** | Built to outlast any single relationship or market cycle | Reactive, trend-chasing |
| **Disciplined** | Process-driven advice, documented and repeatable | Ad hoc, personality-dependent |
| **Transparent** | Plain-English plans, visible fees, no fine print surprises | Jargon-heavy, opaque |
| **Client-first** | The relationship outlasts any single transaction | Transactional, quota-driven |
| **Singaporean, professional** | Fluent in local context (CPF, HDB, local family structures) without losing polish | Generic global-finance tone |

### 1.6 Voice & Tone
- **Voice (always):** Institutional but warm, first person plural ("we"). Confident without being corporate-cold.
- **Tone (varies by context):**
  - *Educational content:* clear, structured, plain English over jargon.
  - *Client stories:* specific, understated, never boastful.
  - *Calls to action:* direct and low-pressure, an invitation to a conversation, not a pitch.

**Words we lean into:** certainty, steady, plan, protect, grow, legacy, partner, continuity, discipline, clarity.

**Words we avoid:** guaranteed returns, hot tip, beat the market, exclusive, hack, hustle, disrupt.

### 1.7 Service Pillars
1. **Wealth Planning** — savings, investment frameworks, structured toward real goals.
2. **Protection & Insurance** — health, hospitalisation, income protection, family cover.
3. **Retirement & CPF** — CPF optimisation and retirement income planning.
4. **Legacy & Estate** — wills, trusts, succession, family continuity.
5. **Corporate Advisory** — employee benefits and business protection for company clients.

### 1.8 Signature Phrase
- "Providing certainty in life."

---

## 2. Visual System

### 2.1 Color Palette

Sampled from the DynamiX Group logo mark: a deep glossy red "X", a thin satin-gold ring, and chrome-silver lettering on transparent ground. Translated here into a flat, modern palette (the logo's chrome-bevel rendering is a dated production technique and is intentionally **not** reproduced on-screen; see Section 2.3).

#### Primary

| Token | Hex | Use |
|---|---|---|
| `--brand-red` | `#9C1B24` | Primary accent, CTAs, key marks, the "X" motif |
| `--brand-red-strong` | `#7A141B` | Hover / pressed states |
| `--brand-red-bright` | `#C62430` | Accent highlights on dark surfaces |
| `--brand-gold` | `#B8934A` | Secondary accent: dividers, rings, fine detail. Used sparingly, never as a CTA color |

#### Neutrals

| Token | Hex | Use |
|---|---|---|
| `--ink-900` | `#1C1A1B` | Headings |
| `--ink-700` | `#4A4547` | Body text |
| `--ink-500` | `#79767B` | Secondary text, captions |
| `--ink-300` | `#A9A6A8` | Borders, dividers |
| `--ink-100` | `#DAD7D8` | Soft borders, subtle backgrounds |
| `--surface` | `#FFFFFF` | Default background |
| `--surface-muted` | `#FAF9F8` | Alternate sections |
| `--dark` | `#171414` | Header/hero/footer dark surfaces (near-black, warm red undertone, not pure forest, not pure black) |

#### Semantic

| Token | Hex | Use |
|---|---|---|
| `--success` | `#3F8A5A` | Positive indicators |
| `--warning` | `#C9922E` | Attention without alarm |
| `--danger` | `#C0392B` | Errors, shortfalls (distinct shade from brand red to avoid ambiguity with CTAs) |
| `--info` | `#3A6FB7` | Tips, callouts |

#### Usage rules
- Red is the **one** accent color: CTAs, key figures, the X motif, active icon states. Never as a large body background.
- Gold is a **secondary, rationed** accent: thin rings, dividers, small flourishes. It should read as a detail, not compete with red.
- Dark surfaces use `--dark`, not pure black, and not the AWFA forest green. This is a distinct, red-anchored identity.
- Body text on white uses `--ink-700`. Never red-on-white for body copy (insufficient contrast, and reads as an error state).

### 2.2 Typography

| Role | Family | Fallback |
|---|---|---|
| Display / headings | **Source Serif 4** (600/700) | `"Source Serif 4", Georgia, serif` |
| UI + body | **IBM Plex Sans** (400/500/600) | `"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif` |
| Numerals | IBM Plex Sans with `tabular-nums` | `font-variant-numeric: tabular-nums` |

A serif display is justified here (unlike a generic default): the source logo itself is lettered in a classic serif-adjacent display face, and "a firm built to last" is a heritage-coded position. Distinct from the AWFA kit's Playfair Display, so the two brands don't visually collide when shown side by side.

- **Line height:** 1.5 body, 1.15 headings.
- **Letter spacing:** -0.01em on display/H1, +0.06em on uppercase labels (mirrors the tracked "GROUP" in the logo).

### 2.3 Logo & Wordmark Guidance

The source file (`Dynamix New Transparent.jpg`) is a flattened JPEG with a checkerboard pattern baked into the pixels (JPEG has no alpha channel, so "transparent" didn't export correctly). It is **not usable as a web asset as-is**.

- **For production:** export a true transparent PNG or SVG from the original design source.
- **Coded fallback (in use on the current site):** `DynamiX` set in the display serif, with the X rendered in `--brand-red`; `GROUP` tracked in caps beneath; a thin `--brand-gold` ring as a small decorative accent; tagline `providing certainty in life` in `--ink-500`, sentence case.
- **Don't:** attempt to recreate the source logo's chrome/bevel/drop-shadow rendering in CSS. That production style reads as dated; the flat red/gold/ink palette carries the identity forward on screen.

### 2.4 Iconography
- Outlined, 1.5px stroke, rounded caps and joins (Lucide, consistent with the AWFA kit for family resemblance across David's brands).
- `--ink-700` default, `--brand-red` for active/accent states.

### 2.5 Imagery
- Real moments over stock: team, client meetings, office, Singapore skyline in context, not generic handshake stock photography.
- Where no photography exists yet, use flat brand-color panels (red/gold/dark gradients) rather than fake screenshots or stock placeholders.

### 2.6 Layout & Spacing
- 12-column grid, 1200px max content width (shared with AWFA kit for consistency across David's properties).
- Radius: `--radius-sm: 6px` (inputs), `--radius-md: 12px` (cards), `--radius-lg: 20px` (hero panels), `--radius-pill: 999px` (chips/CTAs).
- Elevation: warm, dark-tinted shadows, `0 4px 16px rgba(23,20,20,0.10)`.

### 2.7 Motion
- Calm and institutional, not bouncy. Easing `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Durations: 150ms micro, 250ms default, 400ms page transitions.

---

## 3. Relationship to the AWFA Brand

DynamiX Group and AWFA (David Seen's personal advisor brand) share a founder, a philosophy, and a base palette family (a single warm accent against ink neutrals), but are visually distinct:

| | AWFA (personal) | DynamiX Group (firm) |
|---|---|---|
| Accent | Gold + forest green | Red + gold (rationed) |
| Voice | First person ("I") | First person plural ("we") |
| Display type | Raleway + Playfair Display | IBM Plex Sans + Source Serif 4 |
| Audience | Individual clients of David directly | Clients of the firm broadly, individuals and businesses |

---

## 4. Quick Reference Card

```
Brand:      DynamiX Group (founded and led by David Seen)
Tagline:    Providing certainty in life.
Voice:      Steady, disciplined, transparent, client-first, "we"
Primary:    #9C1B24 (red)  /  #B8934A (gold, rationed)
Dark:       #171414
Text:       #1C1A1B head  /  #4A4547 body
Fonts:      Source Serif 4 (display)  /  IBM Plex Sans (UI + body)
Icons:      Lucide, 1.5px outline
Imagery:    Real moments, flat brand-color panels as fallback
Motion:     Calm, institutional, 250ms default
```
