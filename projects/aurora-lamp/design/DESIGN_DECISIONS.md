# Aurora Lamp — Design Decisions (locked)

> Internal working document for Shiplo Showcase #18. Not shipped in `dist/`.
> Source of truth: `.showcase/18_aurora-lamp-launch.md`. This file records the
> art direction and the reasoning behind every visual decision. Verified
> against UI UX Pro Max searches (landing patterns, GSAP scroll presets,
> warm palette, font pairings, touch/a11y guidelines).

## 0. Art direction — "Dusk Atelier spec sheet"

Premium industrial-design editorial: the page is a **printed lighting
spec-sheet hung in a warm gallery**. Hairline engineering-drawing line art
(leader lines, dimension arrows, mono annotations) on warm paper; graphite
ink; anodized-aluminum grays; **one amber glow as the single saturated color
event**. The one deliberate inversion: the light-modes section is a deep
graphite "room at dusk" — because a lamp can only be demonstrated against
darkness. Everything else stays on paper.

Visual diversity vs sibling showcases: #17 rhythm-canvas is a dark
audio-reactive canvas tool; #19 is a type-led editorial index. Aurora Lamp
owns the **technical-drawing product-marketing language**: patent-drawing
line art + dimension lines + mono callouts, warm print typography, and a
glow that literally answers the mode toggle.

## 1. Pattern table (UI UX Pro Max check, per spec §Skill choreography)

| Item | Decision | Rejected alternatives |
|---|---|---|
| Pattern | One long scrollytelling page: hero → anatomy (pinned exploded SVG) → light modes → materials → dimensions → closing. Native scroll everywhere; exactly ONE pinned section. | Pricing/CTA pattern, waitlist pattern, AI-personalization pattern (all irrelevant to a launch microsite; also "no pricing table" is a spec rule). |
| Typography | **Fraunces** 600/700 (display — warm editorial serif, opsz flavor) + **Instrument Sans** 400/500/600 (body/UI grotesque) + **IBM Plex Mono** 400/500 (technical annotations, dimension readouts, section indices). All OFL, self-hosted woff2 from `@fontsource/*` (latin subset; UI copy is English). Fallbacks: `Georgia, 'Times New Roman', serif` / `'Helvetica Neue', Arial, sans-serif` / `ui-monospace, 'Cascadia Mono', Consolas, monospace`; `font-display: swap` on every face. | Space Mono/IBM Plex Sans "developer" pairing (too CLI), all-mono brutalist (fights "refined"), default Inter (generic SaaS). |
| Palette | Paper `#F7F2E9` · graphite ink `#241E15` · muted ink `#675C4B` · hairline `#D9CFC0` · aluminum `#C9C4BB`/`#A8A29A` · opal `#F4EFE6` · dusk `#1C1712` (modes section bg) · amber glow `#E8A33D` (graphics only) · ember `#8A5410` (text-level accent, ≥4.5:1 on paper). Mode glows: Ember 2700K `#E89A4A`, Focus 4000K `#F3E7C9`, Studio 5000K `#EDF2F0`. | Purple/blue SaaS gradient (spec ban), neon/glassmorphism (spec ban), cold white-ground dashboard grays (kills "warm gallery"). |
| 5 interaction rules | 1) Mode switch = real radio group (arrow keys, labeled); glow + room tint + copy + mono temperature readout all change together — never color-only. 2) Exploded view: scroll scrubs separation on desktop/tablet; a segmented **Assembled/Exploded** control gives the full keyboard/no-pin path; every state readable without animation. 3) Material swatches: focus/hover previews, click pins (`aria-pressed`); highlight = amber stroke + width + text cue under the drawing. 4) All CTAs are real anchors/buttons; "Replay the story" scrolls top (smooth only when motion allowed). 5) Scroll reveals are fade-only (y ≤ 16px) and content is visible without JS. | Scroll hijacking, hover-only affordances, color-only state, disabled-look fake buttons. |
| 5 anti-patterns | 1) No pricing table/checkout — closing is "Replay story" + "View specs" only. 2) No fake testimonials/logos/stock product photos — product is 100% code-native SVG. 3) No purple-blue gradient, no card-inside-card soup — sections are editorial bands with hairline rules, not nested cards. 4) No smooth-scroll library or pin spam — exactly one pinned section, `scrub: 0.8`. 5) No emoji-as-icon; all icons are inline SVG strokes in the drawing language. | (from spec + Quality bar) |
| Mobile 390 | No pin (static exploded diagram + toggle); single column; mode pills full-width 48px targets; spec table collapses to definition rows; hero type clamps. | Shrunk-desktop canvas. |
| Tablet 1024 | Pin retained with shorter scroll span; touch targets ≥48px; no hover dependence (focus = hover). | — |
| Desktop 1440 | Two-column editorial rhythm, generous whitespace, measure ≤ 66ch, dimension drawing gets full width band. | Scaling everything up only. |

## 2. Motion budget (spec §Motion direction)

- Feedback microinteraction (mode pill, swatch, toggle): 120–220 ms.
- Spatial transition (explode/assemble toggle, glow crossfade): 250–500 ms.
- Delight/reveal (section fades, hero intro): ≤ 900 ms, fade-dominant.
- GSAP usage: `gsap` + `ScrollTrigger` only (vendored 3.15). Registered once
  in `js/motion.js`; every tween goes through the motion gate.
- `prefers-reduced-motion`: ScrollTrigger never created; scrub/parallax
  removed; all tweens collapse to ≤150 ms fades or instant final state
  (pattern proven in clock-quest `js/motion.js`). CSS side: a
  `@media (prefers-reduced-motion: reduce)` block disables transitions on
  decorative layers. The exploded diagram renders fully labeled in its
  final assembled state — nothing is locked behind animation.

## 3. Data architecture (spec §State model + §JSON contract)

- **Content state** — `data/product.json`: product identity, modes (3),
  materials (4), exploded parts (6, incl. labels + drawing hints),
  dimensions, spec sheet rows, section copy fragments. Page copy that must
  survive JS-off (headings, leads, CTAs) is authored in `index.html`;
  everything data-shaped is injected from JSON. A new lamp variant = edit
  JSON, not markup.
- **Interaction state** — in-memory only: current mode, current anatomy
  state, pinned material.
- **Personal state** — none. No localStorage (nothing to persist for a
  story page; nothing to reset).

## 4. Accessibility contract

Semantic sections + h1→h3 outline; skip link; focus-visible rings (ember,
2px, offset); radio group for modes; buttons for toggles/swatches; the two
SVG scenes are `role="img"` with concise `aria-label`s, decorative glow
layers `aria-hidden`; live region announces mode changes; WCAG AA contrast
on all text pairs (ember `#8A5410` on paper ≈ 5.4:1, paper on dusk ≈ 13:1,
muted `#675C4B` on paper ≈ 5.6:1). No motion-only meaning.

## 5. Asset provenance

- Product drawings, glow, icons, dimension lines: original inline SVG
  authored in this project (Apache-2.0, Shiplo headers).
- Fonts: Fraunces / Instrument Sans / IBM Plex Mono — OFL 1.1, self-hosted
  woff2 copied from `@fontsource/*`; full license texts in `fonts/`.
- GSAP 3.15 (standard `gsap` + free `ScrollTrigger`) — vendored min builds,
  recorded in `THIRD_PARTY_NOTICES.md`. No raster assets, no CDN, no
  Codex-generated imagery needed (drawing language is code-native).

## 6. Fictional-brand guardrails

"Aurora" is a fictional lamp by a fictional studio ("Northlight Studio,
Oslo" — invented). No real lamp brand names, no currency amounts, no
availability claims beyond obviously-fictional launch copy ("Edition 01 —
a design study"). Footer states plainly it is a Shiplo showcase fiction.
