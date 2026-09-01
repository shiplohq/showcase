# Money Market Junior

> Shiplo Showcase #06 — an illustrated 2D market where learners shop for a
> picnic within a fixed budget, computing totals and change with fictional
> tokens.

**Live demo:** <https://money-market-junior.shiplo.site>
**Category:** education-math · **Audience:** 7–11 · **License:** Apache-2.0 (original work)

## What it is

A pretend-play farmers' market for practicing money math. Children get a
wallet of market tokens and a picnic mission with a fixed budget: browse the
stalls, fill a basket, watch the running total against the budget bar, then
pay at the cashier — putting tokens in the tray, counting up to the total,
and finally making the change themselves. Every price, mission, budget and
wallet comes from local JSON; the currency is fictional so the math stays
country-neutral.

Four missions ship:

| Mission | Budget | Constraint | Learning goal |
|---|---|---|---|
| First Picnic | 30 | 2 fruit + 1 drink | Compose totals within 30 |
| Tight Pockets | 20 | bakery + fruit + drink + snack | Compare combinations within 20 |
| Change Maker | 40 | fruit + bakery + 2 drinks | Make change from a round amount |
| Free Shop | 50 | your own basket | Plan and check your own basket |

## The experience

- **Market signage art direction** — deep-green sign band, striped stall
  awnings with scalloped edges, butter-yellow price tags on strings, a
  till-receipt with a perforated edge and a coral PAID stamp. All
  illustration is original inline SVG (flat fills, ink outline, hard sticker
  shadow); no emoji, no stock art, no AI-generated raster.
- **Money you can see** — every amount appears as a numeral *and* as token
  coins (the basket total shows its breakdown; the receipt shows the change
  as coins). The budget bar and the wallet strip keep the constraint visible
  at all times.
- **Checkout that teaches** — pay by dragging or tapping wallet tokens into
  the cashier tray; the paid amount counts up per token; under-pay, exact-pay
  and over-pay each get a spoken, non-punitive label. In *Change Maker* the
  app computes the change and the learner builds it from coins — any
  combination that sums correctly is accepted.
- **Over-budget is a lesson, not a failure** — a coral tag says how many
  tokens over, the checkout button explains exactly what is still needed
  ("2 more fruit", "4 tokens over — put something back"), and nothing is
  ever locked, timed or scored against the child.
- **Motion with a job** — item-to-basket flight, a short odometer roll on
  the total, per-token count-ups, and one receipt-stamp delight. All of it
  respects `prefers-reduced-motion` (final states appear instantly).

## Keyboard & accessibility

The whole shopping path works without a mouse: mission tabs → shelf items
(Enter adds) → basket steppers → checkout → wallet tokens → tray take-backs
→ pay → change build → receipt. Esc leaves the checkout. Targets are ≥48px,
focus is always visible, feedback is announced via live regions, and no
state is color-only. Anonymous mission progress lives in `localStorage`
with a reset button — no accounts, no personal data.

## Static-first architecture

No backend, no database, no API, no SSR runtime. After `npm run build`, the
`dist/` folder is a complete static artifact: one hashed JS bundle, hashed
CSS with bundled `@fontsource` fonts (woff2), and `data/*.json` fetched
relative to the document. Content is validated at dev-time *and* runtime —
a broken catalog degrades to a friendly "market is closed" board, never a
white screen. Navigation is state-based with the mission mirrored into the
URL hash, so no server-history fallback is ever needed.

```text
public/data/products.json     8 products, stalls, currency (content state)
public/data/challenges.json   4 missions: budget, requirements, wallet, mode
src/app/features/market/engine.ts   pure logic: totals, gates, pay, change
scripts/engine-sim.mjs        183 headless checks over every mission
```

New content = new JSON, no component changes (the engine validates
feasibility, prices and wallets on load).

## Development

```bash
npm install
npm run dev        # ng serve
npm test:engine    # headless simulation of every mission + edge cases
npm run build      # production static build → dist/
```

Deploy: upload `dist/` as static files (this is exactly what the live
Shiplo deployment serves). Verify locally with
`node scripts/cdp-driver.mjs <url>` — a full shopping/checkout flow driven
through a real browser.

## Project structure

```text
money-market-junior/
├── README.md
├── LICENSE / NOTICE / THIRD_PARTY_NOTICES.md
├── package.json + lockfile        # committed
├── angular.json / tsconfig*.json
├── src/
│   ├── app/
│   │   ├── features/market/       # engine.ts (pure) + screens & components
│   │   ├── lib/                   # gsap wrapper, data loader, storage
│   │   └── shared/                # art registry (inline SVG), odometer
│   └── styles/                    # tokens / base / motion layers
├── public/
│   ├── data/                      # local JSON content — no API, no database
│   └── favicon.svg
├── scripts/                       # engine-sim, cdp-driver, capture-cover
├── showcase/
│   ├── cover.webp / desktop.webp / tablet.webp / mobile.webp
│   ├── metadata.json
│   ├── deployment.json
│   └── HANDOFF.md
└── dist/                          # generated, gitignored — the deploy artifact
```

## Open source

This project is part of the Shiplo Showcase and is distributed under the
Apache License 2.0. See `LICENSE` and `NOTICE`.

Shiplo names, logos and brand assets are handled separately from the
source-code license. See the repository `TRADEMARKS.md`.

Third-party material redistributed with this project (Angular, RxJS,
tslib, GSAP 3.15, Bricolage Grotesque, Figtree) is documented in
`THIRD_PARTY_NOTICES.md` (policy: repository `THIRD_PARTY_POLICY.md`).

This showcase is art-directed and maintained by Shiplo HQ with AI-assisted
implementation.

## Security and production use

This project is a demonstration/reference implementation, not a security
audit or a production-readiness guarantee.

If you adapt it for production use, you are responsible for reviewing and
hardening the code for your own threat model, dependencies, privacy
requirements, compliance obligations, hosting configuration and user data.

See `SECURITY.md` in the repository for the reporting policy and the
production-use checklist.
