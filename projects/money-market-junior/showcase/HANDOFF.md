# HANDOFF — Money Market Junior (#06)

```
Project: Money Market Junior (#06)
Spec: .showcase/06_money-market-junior.md
Status: live on Shiplo, verified at 3 viewports with zero console errors; root registry update pending (orchestrator)
Build: PASS — `npm run build` (ng build + flatten-dist) → dist/ 36 files, 0.65 MB, initial bundle 282.6 kB (81.9 kB transfer); verify:static PASS; largest file 266 kB (Shiplo 3 MB cap OK)
Shiplo deployment: URL: https://money-market-junior.shiplo.site (site ccf553cd-57e6-4abf-8279-e74a75eeb61f, deployment 788d3b5c-7f83-4bd5-9fe9-a99f350feb59, release 662c0fb5-c453-4b61-b34c-c7b15f29f108, activated 2026-09-01T16:03:42Z)
Live verification: PASS — CDP smoke + full driven flow (mouse/keyboard/touch: add items, over-budget teach state + recovery, pay with take-back, change built by hand 10+5+2+2, receipt) at 1440x900, 1024x768, 390x844 — zero console errors, all visible buttons ≥44px, prefers-reduced-motion usable; check:fonts PASS on live for Bricolage Grotesque 600/700/800 + Figtree 400/500/600/700
Screenshots: showcase/cover.webp (1440x900, staged basket 19/30), desktop.webp (1440x900), tablet.webp (1024x768, hero), mobile.webp (390x844) — all captured from the live URL (cover via scripts/capture-cover.mjs)
Codex-generated assets: NONE — all illustration is original inline SVG (produce, coins, notes, basket, awning, price tag, stamp, favicon)
Third-party assets: Angular 21.2.22 (MIT), RxJS 7.8.2 (Apache-2.0), tslib 2.8.1 (0BSD), GSAP 3.15.0 (GreenSock Standard No-Charge), Bricolage Grotesque (SIL OFL 1.1 via @fontsource 5.3.0), Figtree (SIL OFL 1.1 via @fontsource 5.3.0) — full table in THIRD_PARTY_NOTICES.md
License/provenance: PASS — Apache-2.0, SPDX headers on every authored source file (none on third-party/JSON/generated), package.json private+license+build, lockfile committed, npm audit 0 vulnerabilities, check:repo PASS
Security: PASS — no secrets, no eval, localStorage holds only anonymous mission completion with a reset button, no runtime CDN, no network API; production console clean at 3 viewports
Impeccable: critique 33/40 (Good). Dual-agent run (A design review + B detector, DEGRADED regex mode). Fixed all findings: P1 basket steppers 40→48px; P1 mobile basket now a fixed bottom bar/sheet so total+budget stay visible while shopping; P1 checkout totals exposed to screen readers (sr-only in both counter blocks); P2 mission tabs no longer wipe the basket (per-mission baskets); P2 PAID stamp repositioned off the price column; plus skip link, ESC in change phase, tagline contrast 4.0→4.5+, wallet-pill separator, chip capping, change palette filtered to usable denominations (≤4 options), single polite live announcer, hint copy aligned to real behavior. Detector: 2 width-transition warnings on the 18px budget-bar fill accepted as the intentional progress-bar pattern (confined subtree, reduced-motion guarded); 1 border-accent false positive fixed cosmetically (dropped a 2px radius on the shelf divider).
Remaining issues: NONE blocking. Known/accepted: (a) drag-to-basket is a mouse/pen enhancement — touch uses tap-to-add so page scrolling is never hijacked (design §8, documented in metadata note); (b) duplicate SVG filter id mmj-hard across art instances — identical parameters, harmless, latent only if a filter ever diverges; (c) wallet-token drag is not implemented (copy says "tap"); product-card drag covers the spec's spatial gesture.
Root integration required:
- showcase.json: id "money-market-junior" (number 6) → status "live", demo.url = "https://money-market-junior.shiplo.site", demo.deployedAt = "2026-09-01T16:03:42Z", screenshots: cover/desktop/tablet/mobile → showcase/cover.webp, showcase/desktop.webp, showcase/tablet.webp, showcase/mobile.webp
- README gallery: via npm run gallery
- sourceCommitSha finalization: YES
```

## Notes for the orchestrator

- Angular 21.2 (not 22): the machine's active Node v24.13.0 is below Angular
  CLI 22's engine floor (v24.15.0) and switching the global nvm node would
  have disrupted concurrent leads — same choice geometry-builder (#03) made.
- The engine (`src/app/features/market/engine.ts`, pure, erasable-TS) is
  imported directly by `scripts/engine-sim.mjs` under Node 24 type stripping:
  183 checks green, covering every mission (exact budget, over-by-N,
  zero-item checkout, requirement gaps, wallet multiset mechanics, canonical
  change breakdown 0–45, multi-solution change builds).
- Visual identity is deliberately distinct from #01/#02/#03 (signage system:
  sign band + striped scalloped awnings + butter price-tag stickers +
  receipt ticket; Bricolage Grotesque/Figtree vs the other showcases' fonts).
- Scratch dirs (`.shots/`, `.chrome-profile-*`, `.cp-*`) were deleted after
  capture; the local static preview server was stopped.
