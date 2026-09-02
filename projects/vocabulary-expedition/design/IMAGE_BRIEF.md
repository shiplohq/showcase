# IMAGE_BRIEF — 07-vocabulary-expedition

<!--
  Producer policy: design/codex-image-producer.md (repo root).
  Classification record cho showcase #07 — quyết định asset được đưa ra TRƯỚC khi
  implement, đối chiếu DESIGN_DECISIONS.md (nguồn sự thật visual).
-->

## Asset classification (honest pass)

Showcase #07 là project illustration-heavy ("large illustrated scenes"). Phân loại
từng nhóm nhu cầu visual:

| Nhu cầu | Lớp | Quyết định |
|---|---|---|
| 6 scene plates lớn (living room, kitchen, classroom, market, farm, park) | **B — SVG/code-native** | Scene phải (1) crisp ở mọi zoom, (2) chứa `<g id="item-*">` khớp CHÍNH XÁC bbox % trong `units.json` để hotspot DOM overlay khớp hình, (3) nhất quán style qua 6 scene, (4) zero provenance risk, (5) giữ dist nhỏ. Vẽ tay bằng SVG path trong `src/features/scenes/*.vue` — gouache mảng phẳng, viền mềm. Raster backdrop sẽ yếu hơn ở cả 5 tiêu chí này → SVG thắng thẳng, không cần thử raster. |
| Hotspot/word targets | DOM/SVG over art | Nút HTML `<button>` overlay theo bbox % — KHÔNG bao giờ baked vào tranh (đúng rule repo). |
| World map + route | **B — SVG/code-native** | Bản đồ hành trình vẽ SVG, 6 trạm + đường chấm gạch. |
| Mascot Pip (sparrow + explorer hat) | **B — SVG/code-native** | Tái dùng 3 chỗ (map, clue card, scrapbook empty-state) — cần cùng một vector. |
| Paper/paint grain texture | **B — procedural** | SVG `feTurbulence` 3–4% — không cần raster; tránh trùng chất "paper texture" đã dùng ở #01 (visual diversity). |
| Icon UI (magnifier, leaf, pin, speaker, VI flag) | **B — SVG stroke** | Icons/diagrams/UI → SVG/CSS per rule, không raster. |
| Photo-real backdrops / hero raster | **C — Codex raster** | **KHÔNG cần** — không có nhu cầu nào raster giải quyết tốt hơn SVG ở project này. Không tạo brief, không chạy `assets:codex`. |
| Audio | — | Không ship file audio; feedback sound = WebAudio synth tự sinh (mặc định tắt). Không TTS. |

## Codex-generated assets

**NONE.** Zero brief được mở cho producer ở showcase #07 (lý do: bảng trên —
mọi raster candidate đều thua SVG/code-native theo tiêu chí bbox-accuracy,
zoom-crispness, style-consistency, provenance, size). `generated-manifest.json`
ghi record rỗng có chủ đích.

Nếu sau này cần raster (vd. promotional art ngoài product), thêm brief 8-field
vào file này theo `design/IMAGE_BRIEF.template.md` và chạy `npm run assets:codex`
từ repo root — output chỉ được nằm dưới `projects/vocabulary-expedition/public/assets/generated/`.
