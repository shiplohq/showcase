# Batch Checkpoint — Showcases #13–#20 (Kết thúc batch #01–#20)

**Ngày:** 2026-09-10 · **Kết quả:** 20/20 `live`. Batch #13–#20 hoàn tất trong 2 buổi (2026-09-09 → 2026-09-10), qua 1 lần pause (quota, 2026-09-08), 1 lần IDE restart giết session giữa chừng (2026-09-10), và 1 directive đổi quy trình giữa batch.

## Các project

| # | Project | Điểm nổi bật | Artifact |
|---|---|---|---|
| 13 | ecobalance | Reviewer bắt P1 thật: specimen tags bị SVG `xMidYMid slice` crop ngoài khung MỌI viewport (Hawks tag ẩn hoàn toàn ở desktop/tablet) → release 3 redeploy cùng site. Engine 1,611 checks. | 40 files / 809 KB |
| 14 | atom-forge | P0: RevealOverlay render bên trong root bị `inert` (script-click che bug — trusted-click mới bắt được); P0 tablet fit; side-tab → top-rule theo hook impeccable. Engine-sim 257 checks (chạy trước directive). | 29 files / 638 KB |
| 15 | roboroute | Lead tự fix 4 P1 (chip nowrap, touch targets, keyboard, layout). Reviewer độc lập dừng theo directive giữa chừng — chưa phát hiện lỗi mới trước khi dừng. | — |
| 16 | geotrail | 3 P0 visual bắt ở impeccable pass (atlas 1-viewport ≥1024, Vietnam S-shape sai eo thắt, label chồng stop marker); runtime validator data tự bắt 2 bug geo khi dev. | 18 files / 490 KB |
| 17 | rhythm-canvas | Audio 100% tự tổng hợp Web Audio (0 file audio → 0 license risk); 3 bug critique thật (`display:flex` đánh bại `hidden`, shortcut xuyên modal, step cursor không reset). | 41 files / 605 KB |
| 18 | aurora-lamp | No-build assembler; P0 SVG geometry (thiếu translate trên head group; CSS selector không xuyên được `<use>` shadow tree → CSS variables); state không-JS mặc định exploded có nhãn. | 21 files / 325 KB |
| 19 | paper-pixel-portfolio | Editorial index; plate SVG trộn paper/pixel; GSAP Flip shared-element; motion toggle 3 trạng thái. | 16 files / 438 KB |
| 20 | habit-bloom | No-streak-shaming là LOGIC render thật (ngày vắng chỉ dài internode, thân không héo); localStorage opt-in + export/reset; stem/lá procedural SVG. | 40 files / 1.07 MB |

## Directive giữa batch: bỏ testing (2026-09-09)

User chỉ thị bỏ qua các phase testing từ giữa #14 (lý do: tốc độ). Bỏ: engine-sim, CDP test matrix (console sweep, touch asserts, focus probes, multi-viewport sweep), font-check CDP, assessment A/B, reviewer độc lập. Giữ: build + `verify:static` + deploy + screenshots từ live + provenance đầy đủ. Accessibility vẫn được code đúng trong implementation (không phải bị bỏ khỏi sản phẩm).

Đáng ghi nhận: **"critique nhẹ + sanity screenshots" vẫn bắt được P0 implementation thật ở 4/7 project còn lại** (#16 visual P0s, #17 hidden-flex bug, #18 SVG geometry, #13 reviewer trước directive) — các bug này nhìn thấy bằng mắt, không cần test matrix. Rủi ro đã được user chấp nhận.

## Systemic findings (cho batch sau)

| # | Finding | Hành động |
|---|---|---|
| 1 | **`capturedFrom` trailing slash** — validator bắt 2 lần liên tiếp (#19, #20): metadata ghi `…shiplo.site/` trong khi demo.url không có slash | Lead prompt sau: capturedFrom PHẢI BẰNG demo.url verbatim, ký tự từng ký tự |
| 2 | **`deployedAt` lệch giữa report và deployment.json** (#17: payload report có `.937Z`, file thật không có) | Orchestrator luôn lấy deployedAt từ deployment.json, không từ report agent |
| 3 | **MCP 0.1.6: `platform_deploy_static` trả "Site not found" khi truyền `site_id`**, hoạt động với `site_slug` (#19 phát hiện, ghi trong deployment.json notes) | Bridge call sau dùng site_slug; theo dõi fix upstream |
| 4 | **Lead dừng chờ sub-agent đã chết = deadlock im lặng** (#14: chờ "Assessment A" sẽ không bao giờ đến vì sub-agent đã kết thúc không báo) | Prompt lead: không dừng chờ sub-agent; nếu cần kết quả assessment thì làm inline |
| 5 | **IDE restart giết session giữa chừng — resume qua SendMessage theo agent id hoạt động hoàn hảo** (#16 giữ 26 src files + context, #17 giữ planning; 0 lần làm lại từ đầu) | Giữ nguyên id agent trong notification `stopped`; resume bằng SendMessage thay vì spawn lại |
| 6 | **Token plaintext trong `.codex/config.toml`** (PLATFORM_API_TOKEN, untracked, chưa từng lọt commit) | Đã thêm `.agents/` + `.codex/` vào .gitignore (commit 4eb26bb); **đề nghị user rotate token** |
| 7 | **Concurrency 4 lean agents (không testing) ổn định** — không 429 nào trong đợt cuối | Ngân sách mới: ~4 lead lean ≈ 3 lead full-testing cũ |

## Visual diversity 20/20

Mỗi cặp lân cận không hội tụ: natural-history diorama (#13) / Swiss-poster lab (#14) / grid museum giấy (#15) / cartographic atlas parchment (#16) / night-poster audio instrument (#17) / patent-drawing dusk atelier (#18) / editorial printed index (#19) / botanical herbarium field-notes (#20). Font đa dạng: IBM Plex / Archivo+Spline Mono / Fraunces / Anton+Space Grotesk / Fraunces+Instrument+Plex Mono / Fraunces+Archivo Narrow / Lora+Raleway+Fragment Mono.

## Trạng thái cuối

- `showcase.json`: 20/20 `live`, validate pass, gallery 20/20.
- `check:repo`: pass (1,034 tracked files, không secret).
- Working tree còn lại: `projects/fraction-bistro` (session khác đang làm release mới, không thuộc batch này) + `AGENTS.md` (chưa quyết định commit).
- Backlog P2/P3 từng project: trong DESIGN_DECISIONS.md của từng project + report tích hợp.
