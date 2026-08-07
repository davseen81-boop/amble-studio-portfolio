# Branding Kit — David Seen / AWFA

> **This is the primary brand kit** — the source of truth for visual identity and voice across every surface in this repository: the public site, the daily dashboard, and any generated email or document.
>
> Adopted from `@davseen222` on Instagram and Alpha Wealth Financial Advisers (awfa.com.sg). Originally written for the CPF Calculator and the wider AI Advisor Ecosystem; promoted to primary here so all of David's properties share one identity.
>
> The earlier DynamiX Group kit is kept at [`branding-dynamix.md`](branding-dynamix.md) as a record of the previous identity.

---

## 1. Brand Identity

### 1.1 The North Star
**Tagline:** *CFO of your life — 1% Better.*

A daily commitment to compounding wisdom. The CFO metaphor reframes everyday people as the chief financial officer of their own life — the person ultimately accountable for income, protection, growth, and legacy. The "1% Better" promise is the cadence: small, repeatable, honest improvements.

### 1.2 Mission
Help everyday Singaporeans and their families make wise financial choices and fulfil their aspirations — by turning complex financial planning into something approachable, daily, and human.

### 1.3 Positioning
A **trusted financial companion**, not a salesperson. AWFA goes beyond managing finances; the relationship is the product. David Seen is the human face of that promise — a co-founder who shows up with his family, his culture, and his routines, not just his credentials.

### 1.4 Audience
- **Primary:** Singapore-based working professionals and families, 28–55, navigating CPF, insurance, savings, retirement, and legacy decisions.
- **Secondary:** Aspiring financial advisors looking to join a values-led team.
- **Tertiary:** Bilingual Chinese-Singaporean households who appreciate cultural fluency (CNY, zodiac, mahjong, family milestones).

### 1.5 Brand Personality
| Trait | What it means | What it isn't |
|---|---|---|
| **Warm** | Speaks like a friend who happens to know finance | Cold, jargon-heavy |
| **Disciplined** | Believes in daily 1% gains, compounding, structure | Hype, get-rich-quick |
| **Family-anchored** | Decisions framed around loved ones and legacy | Transactional, individualistic |
| **Aspirational but grounded** | Talks about dreams alongside the boring habits that get you there | Flashy luxury signalling |
| **Culturally Singaporean** | Code-switches naturally between English, Mandarin, and local idioms | Generic global-finance tone |

### 1.6 Voice & Tone
- **Voice (always):** Conversational, encouraging, practical, story-led. Uses first person and addresses the reader directly ("you").
- **Tone (varies by context):**
  - *Educational content:* patient, clear, analogies over equations.
  - *Personal stories:* candid, warm, family-forward.
  - *Calls to action:* confident and specific — never pushy.

**Words we lean into:** companion, journey, secure, wise, dream, 1% better, compound, family, legacy, aspirations, protect, grow.

**Words we avoid:** guaranteed, hot tip, beat the market, exclusive, hack, hustle.

### 1.7 Content Pillars (from IG)
1. **Wealth that works** — CPF, retirement planning, savings, investment frameworks.
2. **Protection first** — insurance, hospitalisation, accident, legacy.
3. **1% Better daily** — habits, mindset, compounding, productivity.
4. **Family & legacy** — Dwayne, Dylan, the Seen family, milestones.
5. **The journey** — travel (Bangkok, Japan, FWD NY/Vegas), awards (AWFA Awards), CNY/zodiac moments.

### 1.8 Signature Phrases
- "CFO of your life."
- "1 percent better every day."
- "We're your financial companions — not just your advisors."
- "Secure your future. Where financial dreams become reality."

---

## 2. Visual System

### 2.1 Color Palette

Sampled directly from awfa.com.sg. The brand reads as **gold + forest** on a clean light surface — a classic wealth-advisor signal of trust, longevity, and quiet prosperity.

#### Primary

| Token | Hex | RGB | Use |
|---|---|---|---|
| `--brand-gold` | `#D5AB45` | 213, 171, 69 | Primary accent, CTAs, key numbers, highlights |
| `--brand-forest` | `#27392E` | 39, 57, 46 | Headers, dark surfaces, footer, hero sections |

#### Neutrals

| Token | Hex | RGB | Use |
|---|---|---|---|
| `--ink-900` | `#303030` | 48, 48, 48 | Headings |
| `--ink-700` | `#4C4C4C` | 76, 76, 76 | Body text |
| `--ink-500` | `#7A7A7A` | 122, 122, 122 | Secondary text, captions |
| `--ink-300` | `#9D9D9D` | 157, 157, 157 | Borders, dividers, disabled |
| `--ink-100` | `#CDCDCD` | 205, 205, 205 | Soft borders, subtle backgrounds |
| `--surface` | `#FFFFFF` | 255, 255, 255 | Default background |
| `--surface-muted` | `#FCFCFC` | 252, 252, 252 | Alternate sections |

#### Semantic (recommended extensions)

| Token | Hex | Use |
|---|---|---|
| `--success` | `#3F8A5A` | Positive returns, on-track indicators |
| `--warning` | `#E0A33A` | Attention without alarm (gold-adjacent) |
| `--danger` | `#B7423A` | Shortfalls, errors |
| `--info` | `#3A6FB7` | Tips, callouts |

#### Usage rules
- Gold is **accent, not field** — use for emphasis (CTAs, key figures, underlines, icons), never as a large body background.
- Forest is the anchor for dark sections, the brand "voice in the room."
- Keep large surfaces white or near-white; let gold and forest do the work.
- Aim for **WCAG AA** contrast: body text on white uses `--ink-700`; never use gold on white for body copy (insufficient contrast).

### 2.2 Typography

#### Type families
| Role | Family | Fallback stack |
|---|---|---|
| Primary (UI + body) | **Raleway** | `"Raleway", "Helvetica Neue", Arial, sans-serif` |
| Headings | **Raleway** (700) | same |
| Numerals (financial figures) | **Raleway** with `tabular-nums` enabled | `font-variant-numeric: tabular-nums` |
| Optional display accent | **Playfair Display** (serif) | `"Playfair Display", Georgia, serif` — sparingly, for editorial hero quotes only |

Raleway carries from the AWFA site directly. The optional serif gives the "1% Better" editorial moments a literary weight without competing.

#### Scale (rem-based, 1rem = 16px)
| Token | Size | Weight | Use |
|---|---|---|---|
| `--text-display` | 3.0rem (48px) | 700 | Hero |
| `--text-h1` | 2.25rem (36px) | 700 | Page titles |
| `--text-h2` | 1.75rem (28px) | 700 | Section titles |
| `--text-h3` | 1.375rem (22px) | 600 | Subsections |
| `--text-h4` | 1.125rem (18px) | 600 | Card titles |
| `--text-body` | 1rem (16px) | 400 | Body |
| `--text-small` | 0.875rem (14px) | 400 | Captions, helper text |
| `--text-micro` | 0.75rem (12px) | 500 | Labels, tags |

- **Line height:** 1.5 for body, 1.2 for headings.
- **Letter spacing:** -0.01em on H1/Display, 0 on body, +0.04em uppercase labels.
- **Numbers in financial output:** always tabular, right-aligned in tables, never below 14px.

### 2.3 Logo & Wordmark Guidance

When the project doesn't host the official AWFA logo, follow these rules so the calculator still reads as part of the family:

- **Wordmark fallback:** `AWFA` set in Raleway 700, letter-spacing 0.08em, in `--brand-forest` on light surfaces or `--brand-gold` on dark surfaces.
- **Personal brand fallback:** `David Seen` in Raleway 700; tagline `CFO of your life · 1% Better` in Raleway 500, letter-spacing 0.04em.
- **Minimum clear space:** half the cap-height of the wordmark on all sides.
- **Minimum size:** 80px wide on web, 24px tall in app bars.
- **Don't:** stretch, recolor outside the palette, place gold wordmark on white, or pair with competing serifs.

### 2.4 Iconography

- **Style:** Outlined, 1.5px stroke, rounded caps and joins. Reads as friendly and modern rather than corporate.
- **Recommended set:** [Lucide](https://lucide.dev) (consistent with the rest of the ecosystem).
- **Color:** `--ink-700` default, `--brand-gold` for active/accent states.
- **Size:** 20px in inline UI, 24px in nav, 32–40px in feature cards.
- **Motifs welcome:** sprouting plant (growth), shield (protection), compass (planning), house (legacy), small chart upticks (progress). Avoid stacks of cash, dollar signs, lambos.

### 2.5 Imagery & Photography

- **Primary subject matter:** real moments — family, travel, awards, food, community — never stock-photo handshakes or generic skylines.
- **Treatment:** natural light, warm white balance, minimal filters. Embrace candid framing.
- **Cultural cues are welcome:** CNY red is permissible as a *photographic* accent (not a UI color), mahjong tiles, zodiac iconography around lunar new year.
- **Overlays:** when text sits on photography, use a forest-green gradient overlay at 40–70% opacity rather than a flat black scrim.

### 2.6 Layout & Spacing

- **Grid:** 12-column, 80px max gutter, 1200px max content width.
- **Spacing scale (4px base):** 4, 8, 12, 16, 24, 32, 48, 64, 96.
- **Radius:** `--radius-sm: 6px` (inputs), `--radius-md: 12px` (cards), `--radius-lg: 20px` (hero panels), `--radius-pill: 999px` (chips/CTAs).
- **Elevation:** shadows are subtle and warm, never harsh — `0 4px 16px rgba(39, 57, 46, 0.08)` for cards.

### 2.7 Motion

- Calm, considered, never bouncy. Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Durations: 150ms (micro), 250ms (default), 400ms (page transitions).
- Animate value changes in the calculator with a brief count-up — money should feel intentional, not flashy.

---

## 3. Applying This to the CPF Calculator

A short checklist for adopting this kit:

1. Define the color tokens above as CSS custom properties on `:root` (or extend the Tailwind theme).
2. Load Raleway from Google Fonts with weights 400, 500, 600, 700.
3. Use `--brand-gold` only for the primary CTA, the headline number (e.g., projected CPF balance at 65), and key chart accents.
4. Use `--brand-forest` for the top nav / hero, footer, and any "trust" panels.
5. Frame the calculator's output in the brand's voice — e.g., a result panel titled *"Your 1% Better Plan"* with a sentence like *"Here's what showing up daily looks like by age 65."* rather than *"Projection Results."*
6. Add a soft brand footer linking to `awfa.com.sg` and `@davseen222`.

---

## 4. Quick Reference Card

```
Brand:      David Seen / Alpha Wealth Financial Advisers (AWFA)
Tagline:    CFO of your life — 1% Better
Voice:      Warm, disciplined, family-anchored, culturally Singaporean
Primary:    #D5AB45 (gold)  /  #27392E (forest)
Text:       #303030 head  /  #4C4C4C body
Font:       Raleway (400/500/600/700)
Icons:      Lucide, 1.5px outline
Imagery:    Real, warm, candid — family / travel / community
Motion:     Calm, intentional, 250ms default
```
