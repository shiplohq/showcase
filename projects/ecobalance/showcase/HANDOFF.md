# EcoBalance (#13) — Lead Handoff

Project: EcoBalance (#13)
Spec: .showcase/13_ecobalance.md
Status: deployed + verified live at https://ecobalance.shiplo.site — awaiting orchestrator integration (registry → live)

Build: PASS — `npm run build` (tsc -b && vite build); dist 40 files, 808,839 bytes (~0.79 MB);
`npm run verify:static -- ecobalance` PASS (no CDN, no internal-file leak, no .gitkeep).
Engine suite: `npm run test:engine` = 1,611 checks, 0 failures (content validation, determinism,
free-play bounded oscillation for both biomes, 300-run fuzz invariants, predator-starvation cascade,
do-nothing fails + keeper-policy solves every challenge).

Shiplo deployment: URL: https://ecobalance.shiplo.site (site da54b429-7bb2-4cd0-87a2-cac3f6f63b13,
release 384856e7-8dd8-4b52-a89c-56069bc606ab / deployment c2713b02-9310-4afc-93e9-5ffc1f5d6ace,
deployedAt 2026-09-03T18:19:52Z; first release 90f32d1a superseded same session after a chip-nowrap
fix — source equals deployed).

Live verification: PASS — full CDP-driven flow (biome select → open meadow → keyboard slider plan
+ ArrowRight → step → cause line → food web overlay → field chart + Esc → challenge start + drought
banner → reset → wetland biome → reduced-motion) at 1440×900, 1024×768 and 390×844 with ZERO console
errors; viewport-fit asserted at 1440×900 and 1024×768 (no page scroll, no notebook/ledger overflow);
font gate 8/8 family-weight pairs on live (latin+digits AND vietnamese); screenshots captured from
live only, zero console errors during capture.

Screenshots (all from https://ecobalance.shiplo.site, 2026-09-03T18:33Z):
- showcase/cover.webp — 1440×900, 93,978 B (art-directed: food web on, drought banner, active assignment)
- showcase/desktop.webp — 1440×900, 59,324 B (honest biome-cover landing)
- showcase/tablet.webp — 1024×768, 61,298 B (hero: field desk at season 2 with causes)
- showcase/mobile.webp — 390×844, 30,048 B (stacked desk; mobile declared "supported" + note)
Alts in showcase/metadata.json are derived from the deterministic DOM state at capture time.

Codex-generated assets: NONE — art direction is 100 % code-native SVG (linocut silhouettes,
layered bands, ink icons). No IMAGE_BRIEF was needed.

Third-party assets (exactly what ships in dist/, see THIRD_PARTY_NOTICES.md):
- gsap 3.15.0 — GreenSock Standard "No Charge" License (not MIT) — bundled into assets/index-*.js
- @fontsource/ibm-plex-serif / -sans / -mono 5.2.5 — SIL OFL 1.1 — 26 woff2+woff files in assets/

License/provenance: PASS — LICENSE/NOTICE present; Apache-2.0 SPDX headers on all original source
(src/**, scripts/**, vite.config.ts; src/vite-env.d.ts is pure tool boilerplate, exempt);
THIRD_PARTY_NOTICES.md lists exactly what ships, no placeholder rows; showcase/deployment.json
status "verified", url verbatim, artifactSha256
cf15a72531a1f6e2697a8f37d136f4266568c4440573f2af936c279c32a34d49 = deterministic tar hash
(normalized mtime/owner/sort).

Security: PASS — npm audit 0 vulnerabilities; no secrets; no eval/new Function (the unused
innerHTML helper was removed); localStorage holds only anonymous progress (completed assignments,
last biome) with a two-tap reset; no runtime network beyond the deployment itself (fonts bundled,
JSON local); production console clean on live at 3 viewports.

Impeccable: dual-agent critique (design review 29/40 + detector). Fixed from findings:
- P0 mobile ledger collapse (16 px sliver) → desk now flows as one scrollable page ≤980 px;
  measured 4 full rows, 0 sub-44px controls at 390×844.
- P1 locked-spec violations (cause 12→14 px, population 25→28 px, header buttons 44→48 px,
  Step/Play 50→56 px) → restored to DESIGN_DECISIONS §5/§8 values.
- P1 screen-reader gaps → assignment outcomes + extinctions announced via polite live region;
  debrief is role=dialog aria-modal with a Tab focus trap; sliders carry aria-valuetext.
- P2 saliency (out-of-range rows get a clay ink bar), carrying-capacity inline gloss, focusable
  ledger rows that highlight food-web edges, 1×/2×/4x playback speed, two-tap destructive reset.
- Detector: 2 side-tab findings → restyled (bordered note chips); cream-palette and
  shape-assembled-illustration triaged as locked-thesis false positives; text-occlusion was the
  overlay's own artifact. Design-hook flags: none persisted (all findings fixed at source).

Remaining issues: NONE blocking. Known small notes (not defects): slider has no visible end
labels (direction lives in −/+ buttons, aria and plan chip); woff1 fallbacks double the font
payload (~0.4 MB, browsers fetch woff2 only); challenge-slot scrolls internally while an
assignment is active at 1024×768 — ledger and controls never scroll.

Root integration required:
- showcase.json (#13): status "live"; demo.url "https://ecobalance.shiplo.site";
  demo.deployedAt "2026-09-03T18:19:52Z"; screenshots → projects/ecobalance/showcase/{cover,desktop,
  tablet,mobile}.webp; audience "10-14"; stack ["typescript","vite"] (already set).
- README gallery: via npm run gallery
- sourceCommitSha finalization: YES — deployment.json has null + note; commit the working tree
  (projects/ecobalance/** including .shiplo/project.json, design/DESIGN_DECISIONS.md,
  package-lock.json) and write the 40-hex SHA into showcase/deployment.json.

## Reviewer addendum (2026-09-09) — release 3 (post-review fix)

Independent review re-ran the full checklist from scratch and found one P1, fixed at source
and redeployed to the same site (release 123e4a5b / deployment dcb8f49d, activated
2026-09-09T15:29:46Z; artifact 48320aef…, 40 files / 809539 B):

- P1 (fixed): diorama specimen tags anchored at the scene border were cropped off-plate by the
  stage SVG's `xMidYMid slice` scaling at every viewport — Hawks tag fully invisible at
  1440x900 and 1024x768, tablet tags 0-24% readable (DOM rect probe + visible in the first
  gallery captures). `renderTags()` (src/screens/sim.ts) now clamps every tag into the
  guaranteed-visible window derived from the live plate box; re-applied via rAF after mount and
  on window resize; `destroy()` removes the listener. Verified live: all four tags fully
  rendered at all three viewports (rect probe + in-screenshot pixel verification).
- Metadata corrected: the original cover alt quoted season-0 tag values (the capture is
  season 1: 'Grass 58 · 6 shown', 'Rabbits 29 · 10 shown', 'Foxes 8 · 4 shown', 'Hawks 2');
  desktop alt placed 'Model notes'/'Reset saved data' under each plate (they live in one
  shared bar below both plates); mobile alt understated the visible ledger (Grass and
  Rabbits rows are in view, the Foxes row enters at the bottom). All four screenshots were
  re-captured from the release-3 deployment (capturedAt 2026-09-09T15:34Z) and the alts in
  showcase/metadata.json were rewritten from deterministic DOM dumps of the exact staged
  states.
- Everything else re-verified green on the new deployment: CDP full flow at 1440x900,
  1024x768, 390x844 (zero console errors, reduced-motion included); touch-target sweep on all
  six screen states at all three viewports (min 44x44, no horizontal overflow); engine suite
  1,611/0; verify:static PASS; live assets byte-identical to dist; THIRD_PARTY_NOTICES,
  headers and no-internal-leak checks unchanged.
