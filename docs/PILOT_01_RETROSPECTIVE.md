# Pilot Retrospective — Showcase #01 · Number Garden

**Ngày:** 2026-09-01 · **Kết quả:** `live` — <https://number-garden.shiplo.site>
**Registry:** `showcase.json` #01 = `live` · 1 live / 19 planned.

## What worked

- **Design workflow (SPEC → DESIGN_DECISIONS).** Spec khóa paper-cut botanical
  trước, UI UX Pro Max chỉ được dùng để *đối chiếu* — bảng giữ/lại (§15) khiến
  quyết định loại Claymorphism-của-skill có căn cứ, không theo cảm tính. Baloo 2
  + Nunito chọn bằng dữ liệu font của skill (OFL, subset `vietnamese` active)
  thay vì đoán.
- **Skill usage.** ui-ux-pro-max: đúng vai trò design-intelligence (6 queries,
  product/style/ux/typography/color/gsap). Impeccable: critique → 35/40, detector
  browser-injection tìm 4 findings (cả 4 review-accepted theo brief), 4 priority
  issues được fix trong cùng pass, verify lại bằng CDP. Huashu: **không invoke** —
  art direction đã khóa trong brief, đúng tiêu chí "chỉ dùng khi exploration
  materially cải thiện" (spec cho phép bỏ qua).
- **Codex image workflow (sau khi debug).** Chạy đúng 1 raster asset theo brief
  IMG-01-001, output đúng `public/assets/generated/`, tự tile bằng ffmpeg,
  self-verify luminance/seam bằng script, review visual bằng vision model trước
  khi integrate, provenance ghi đủ trong manifest nội bộ.
- **Implementation.** Pure-logic engine (`src/features/play/engine.ts`) tách khỏi
  UI cho phép **test headless 40/40 câu không cần browser** — bắt được 2 bug thật
  (đưa hạt giỏ→luống không tăng count; test nudge sai tiền đề). Content JSON-driven
  100%: 4 luống + 40 câu không có hard-code trong component.
- **Shiplo deployment.** `platform-mcp` (@shiplohq/mcp) chạy ổn qua stdio:
  account_status → create_site → deploy_static (build + upload + activate ~4s) →
  deployment_status trả timestamp thật. URL trả về dùng verbatim, không suy đoán.
- **Screenshots.** Chụp 100% từ URL live bằng CDP headless (kể cả cover art-directed
  = staged state thật trên production), convert webp bằng ffmpeg, đúng 4 viewport,
  dung lượng 25–45KB/ảnh.
- **Licensing/provenance.** THIRD_PARTY_NOTICES đầy đủ với license THẬT (phát hiện
  gsap 3.15 npm = GreenSock Standard No-Charge, không phải MIT — ghi đúng);
  npm audit buộc upgrade vite 5→7 → 0 vulnerabilities; SPDX headers đúng nơi.
- **CI-equivalent.** `validate` + `check:repo` + `verify:static` + engine-sim +
  CDP flow (3 viewport × live URL) — tất cả xanh trước khi set `live`.

## What caused friction

0. **Font vỡ trên bản live đầu tiên — do chính pilot.** Chỉ import subset
   `vietnamese` của @fontsource (chứa độc các glyph dấu) → chữ thường + toàn bộ
   chữ số rơi vào font hệ thống, trộn metrics giữa chừng từ. **User phát hiện
   bằng mắt sau khi deploy** — mọi kiểm tra tự động (CDP flow, console, buttons,
   font-family computed) đều pass vì fallback vẫn render được chữ. Phải build
   guard mới bắt được: `scripts/font-check.mjs` dùng `document.fonts.check()`
   với mẫu latin+số và mẫu dấu tiếng Việt cho từng family. Fix = import cả
   `latin-*` lẫn `vietnamese-*`; redeploy + chụp lại screenshot + cập nhật
   provenance.

1. **Codex exec không gọi imagegen tự nguyện** (lớn nhất). Ba invocation đầu Codex
   dừng ở "tóm tắt kế hoạch, chưa đổi file nào". Một lần nó còn *vẽ ảnh bằng
   PowerShell System.Drawing* rồi báo CREATED — phải probe mới phát hiện là fake.
   Phải tái cấu trúc prompt: "$imagegen FIRST ACTION + cấm vẽ bằng code + run chỉ
   hoàn tất khi file tồn tại" mới chạy thật.
2. **Wrapper codex-image-producer.mjs có 2 bug Windows**: `spawnSync(shell:true)`
   nối args không quote → prompt nhiều từ thành subcommand; đường dẫn
   DESIGN_DECISIONS tìm ở project root trong khi quy trình đặt ở `design/`.
3. **Stale-cache hai lần trong visual review**: Chrome profile persistent giữ
   index.html cũ → screenshot cũ; mất một vòng debug "fix không land" trước khi
   nghi ngờ cache (thêm `--disk-cache-size=1` + profile unique mỗi run).
4. **`new URL(path, './')` throw** — BASE_URL './' không phải absolute base;
   error state hiển thị đúng (đáng khen) nhưng vẫn là 1 vòng build-screenshot-debug.
   Ngoài ra ảnh hưởng: vision-model review 1 lần hallucinate "fix không land" —
   phải verify bằng grep CSS serve trực tiếp thay vì tin review.
5. **Vite preview + headless screenshot không click được** → phải viết CDP driver
   riêng (websocket raw, không dependency). Tốn ~1h nhưng trở thành tài sản dùng
   lại cho mọi showcase + verify live deploy + chụp screenshot.
6. **tsc composite (`tsconfig.node.json`) sinh `vite.config.js/.d.ts`** vào source
   tree → lỡ commit lần đầu (bắt ở lần soát cuối, đã dọn + gitignore).
7. **`platform-mcp` không expose tools vào session Claude** (chỉ cấu hình stdio
   trong `~/.claude.json`) → phải viết bridge JSON-RPC nhỏ để gọi. Chạy tốt nhưng
   đáng lẽ kiểm tra cơ chế deploy ngay Phase 0 thay vì tới Phase 10.

## What should change before building #02–#20

> **Trạng thái áp dụng (2026-09-01, sau khi pilot kết thúc):** các mục 1, 3, 4, 6, 7, 10 đã được triển khai vào repo trong commit "chore: harden showcase pipeline from pilot #01 lessons" — docs `design/codex-image-producer.md` có Qui ước prompt + bước verify; `scripts/cdp-driver.mjs` (smoke chung), `scripts/shiplo-mcp.mjs` (bridge chính thức, `npm run shiplo`), `scripts/font-check.mjs` (`npm run check:fonts`, thêm vào PRE_PUBLISH_CHECKLIST); rules font/vision-ground-truth/headless-cache nằm trong CLAUDE.md "Testing & verification (từ pilot #01)"; template gitignore có vite composite outputs. Còn mở: mục 4(a) (expose platform-mcp vào session MCP — chờ phía Shiplo), mục 5 (template note cho pure-engine — khuyến khích, không bắt buộc).

| # | Finding | Loại | Đề xuất |
|---|---|---|---|
| 1 | Codex prompt phải "ép" gọi imagegen; có nguy cơ fake-by-code | **asset-generation** | Cập nhật `design/codex-image-producer.md` + wrapper: prompt chuẩn "FIRST ACTION $imagegen, no code-drawing, files-on-disk = success" (đã áp dụng vào wrapper; docs cần follow-up) |
| 2 | Wrapper broken trên Windows (quoting, design/ path) | **repository-level fix** | Đã fix trong commit pilot; giữ regression cho các máy khác |
| 3 | Chưa có cách chuẩn để test tương tác + chụp ảnh từ live | **repository-level fix** | Thăng cấp CDP driver thành tool dùng chung `scripts/cdp-driver.mjs` (repo root) nhận `--url --w --h --flow`; mỗi project không phải viết lại |
| 4 | Cần bridge riêng để gọi Shiplo MCP | **Shiplo MCP issue** | Hoặc (a) expose `platform-mcp` tools vào session MCP bình thường, hoặc (b) ship bridge chính thức `scripts/shiplo-deploy.mjs` + docs DEPLOYMENT.md ghi flow account_status → create_site → deploy_static → status |
| 5 | Engine pure-logic testable là pattern mạnh | **template fix** | Thêm vào `templates/project/` ghi chú khuyến khích `features/*/engine.ts` (pure) + `scripts/engine-sim.mjs` cho game/showcase có logic |
| 6 | Vision-model review có thể hallucinate | **CLAUDE.md rule** | Thêm rule: mọi kết luận "fix chưa land" từ ảnh phải được xác minh bằng ground-truth (grep CSS/JS serve, DOM dump) trước khi hành động |
| 7 | tsc composite sinh artifact vào source | **template fix** | Template gitignore thêm `vite.config.js` / `vite.config.d.ts` cho project Vite+TS |
| 8 | Font bundling qua @fontsource mượt (woff2 inlined, subpath-safe) | **reusable pattern** | Ghi vào CONTRIBUTING/CLAUDE.md là default cho project có bundler |
| 9 | Headless capture cần đường dẫn Windows thật (không /tmp Git Bash) | **project-specific** | Ghi chú trong driver |
| 10 | Font vỡ do import thiếu subset latin khi dùng @fontsource cho UI có dấu | **CLAUDE.md rule + template fix** | Rule: mọi project dùng @fontsource phải import **cả** `latin-*` và subset ngôn ngữ (`vietnamese-*`), và phải chạy `font-check` (document.fonts.check với mẫu ký tự thật) trước deploy — console-clean không phát hiện được fallback font |

## Reusable patterns proven by the pilot (chuẩn hoá, không framework hoá)

1. **Project initialization:** `npm run new -- <slug>` → scaffold đủ legal files;
   sau đó `npm install` trong project + vite config `base: './'`.
2. **DESIGN_DECISIONS template:** các mục cố định (thesis, age, principles, tokens,
   typography, spacing, layout, touch, illustration, feedback, motion budget,
   responsive, a11y, anti-patterns, **bảng đối chiếu skill giữ/lại**) — giữ nguyên
   cấu trúc cho #02+.
3. **Generated-image manifest:** brief 8-field + manifest provenance nội bộ trong
   `projects/<id>/design/` — quy trình chạy đúng 1 lần là đạt.
4. **Static build verification:** `verify:static` bắt đúng vấn đề (base path,
   CDN, internal file leak) — giữ nguyên, chạy trước mọi deploy.
5. **Shiplo deployment flow:** account_status (check limits) → create_site 1 lần
   → deploy_static (build_command + output_dir, cwd=project) → deployment_status
   (lấy timestamp thật) → ghi deployment.json verbatim.
6. **Screenshot capture từ live:** CDP headless (fresh profile + no disk cache)
   per viewport; cover = staged state thật; webp qua ffmpeg; `capturedFrom`
   = URL deployment.
7. **Deployment manifest:** deployment.json đầy đủ SHA + hash tarball chuẩn —
   validate-registry enforce; không cần thêm gì.
8. **README gallery:** `npm run gallery` tự sinh — chỉ việc set `live` đúng lúc.

Không chuẩn hoá thêm: engine-sim cho project không có logic state machine;
Huashu (đúng như spec — optional); guard nữa cho gallery (đã đủ).

## số liệu

- 37 file source (src/scripts), 40 câu hỏi JSON, 1 raster asset (890KB),
  dist 11 files / 1.26MB, 0 vulnerability, console errors = 0 ở 3 viewport live.
- Impeccable 35/40 (Good) sau 1 vòng fix; detector 4 findings (4 accepted-by-brief).
- Thời gian pilot ≈ 1 buổi làm việc chính vì phải sửa tooling xung quanh
  (Codex wrapper, CDP driver, MCP bridge) — showcase #02 trở đi các chi phí
  này là one-time.
