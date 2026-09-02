# HANDOFF — Phonics Forest (Showcase #08)

```
Project: Phonics Forest (#08)
Spec: .showcase/08_phonics-forest.md
Status: LIVE (release 2) — deployed, verified, screenshotted; awaiting orchestrator registry/gallery integration
Build: PASS — `npm run build` (tsc -b && vite build) · dist 20 files / 0.68 MB (710,020 bytes deployed, largest file 148.5 KB) · verify:static PASS
Shiplo deployment: URL: https://phonics-forest.shiplo.site (site 445abfc8-b942-4285-aea5-ffa01c96a359 · deploy #2: deployment ecab1250-ff60-4602-b69b-d3fe1c200cd8 · release a5f39f0b-48aa-4712-8bdc-32558d9b0ce0 · activated 2026-09-02T13:56:32Z · deploy #1 was 9e91febb / release 142c9ea2, activated 2026-09-01T20:31:41Z)
Live verification: PASS (re-verified on release 2) — finale fix confirmed live: tree-mastery finale buttons = [Play again, Back to the forest], 3/3 fireflies, back-nav lands on the grove with persisted progress. FULL activity flow driven headless on the public URL at 1440×900 and 1024×768 (zero console errors; 390×844 verified on release 1, only finale logic changed since): grove → sh tree listen (6 rounds, nudge + hint paths) → tree awake → Escape back (progress persisted) → Creature roundup (wrong-drop gentle hint, tap-tap + keyboard carry, 8/8 home) → reduced-motion usable. No horizontal scroll; stage scrollHeight ≤ viewport at 1440×900 and 1024×768; geometry assertions pass on live. check:fonts PASS on live (Fraunces 600, Andika 700 — latin+digits + Vietnamese) plus a document.fonts.check over the actual IPA sample /ʃ/ /tʃ/ /ŋ/ /iː/ /uː/ in Andika (verified on release 1; fonts unchanged in release 2). Live serves dist byte-identically (index-BXnFlaQL.js sha256 fa6bcd68…).
Screenshots: ALL re-captured from release 2 — cover.webp (1440×900, art-directed staged finale with the corrected buttons) · desktop.webp (1440×900 honest) · tablet.webp (1024×768 hero) · mobile.webp (390×844 honest) — capturedFrom https://phonics-forest.shiplo.site, alts match the pixels, recorded in showcase/metadata.json. mobileSupport: "limited" with note.
Codex-generated assets: NONE — 100% original SVG authored in src/components/art.ts; no raster, no AI images (justified in design/DESIGN_DECISIONS.md §9)
Third-party assets: gsap 3.15.0 (GreenSock Standard No-Charge; bundled) · Andika (latin+latin-ext+vietnamese) + Fraunces (latin+vietnamese) via @fontsource 5.3.0 (SIL OFL 1.1; bundled) — full table in THIRD_PARTY_NOTICES.md. Audio: zero assets — speechSynthesis + WebAudio synthesis.
License/provenance: PASS — LICENSE/NOTICE present; Apache-2.0; SPDX headers on all original source; THIRD_PARTY_NOTICES has no placeholder rows; artifactSha256 (release 2) = 0238301c639dfc1017050c71b2806de227a781499fcb964ec7ffbbe5a40d5f1b (tar -czf - -C dist . | sha256sum from the exact uploaded dist; see deployment.json notes for the mtime caveat + per-file sha cross-check)
Security: PASS — npm audit 0 vulnerabilities; no secrets/eval/sensitive storage; no runtime CDN; production console clean; check:repo PASS; npm run validate PASS (registry untouched by lead)
Impeccable: dual-agent critique 34/40 (Good) + deterministic detector 0 findings — all priority issues FIXED and re-verified: P0 mobile answers below fold (compact ≤479px clearing; all 3 leaves above fold), P0 mobile 5th tree hidden (2-col forest path), P1 desktop clearing overflow + stone covering firefly row (52vh cap + stone at right foot), P1 roundup dead finale (tray folds to carved summary, 12px word chips, 900ms lantern ring), P2 creature-word contrast 3.4:1 → ≈8:1, P3 wake finale (sign-glow + reduced-motion sign-flash). Independent review then found the finale's stale-Next root cause (capture-cover back-step never landed) — fixed in clearing.ts and shipped in release 2. Snapshot: .impeccable/critique/2026-09-01T20-29-07Z__projects-phonics-forest.md
Remaining issues: NONE. Known-and-accepted: title tag is bilingual (spec's product name); onboarding is prose in the caption band — deliberate scope per spec's minimal-chrome thesis; grove/roundup share the backdrop illustration (frugal by design).
Root integration required:
- showcase.json: status "live" · demo.url "https://phonics-forest.shiplo.site" · demo.deployedAt "2026-09-02T13:56:32Z" · screenshots cover/desktop/tablet/mobile → "projects/phonics-forest/showcase/*.webp" (mobile included; mobileSupport limited is declared in metadata.json)
- README gallery: via npm run gallery
- sourceCommitSha finalization: YES (deployment.json sourceCommitSha is null — set to the integration commit after review; the deployed release-2 build corresponds to the current source)
```

## Dev commands (project dir)

```
npm install
npm run dev            # vite dev server
npm run test:engine    # headless simulation: every tree's 6 rounds + nudge/hint + 3 sort deals
npm run build          # tsc -b && vite build → dist/
npm run preview        # serve dist/ locally

node scripts/cdp-driver.mjs <url> --out <win-path> --w 1440 --h 900   # full-flow driver
node scripts/overflow-check.mjs <url>                                 # no-scroll assertions (1440/1024)
node scripts/geometry-check.mjs <url>                                 # fold/overlap assertions
node scripts/capture-cover.mjs <url> <win-path>                       # staged cover capture
```
