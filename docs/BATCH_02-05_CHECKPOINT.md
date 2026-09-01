# Batch Checkpoint — Showcases #02–#05

**Ngày:** 2026-09-01 · **Kết quả:** 5/20 `live` (number-garden #01 pilot + fraction-bistro #02, geometry-builder #03, multiplication-galaxy #04, clock-quest #05). Mỗi project qua full lifecycle: lead subagent → independent reviewer → fix-loop → orchestrator integration (commit → sourceCommitSha → registry → gallery).

## What worked

- **Lead → Reviewer → fix-loop → integration** vận hành đúng thiết kế. Reviewer độc lập bắt được lỗi thật mà lead bỏ sót: #04 có 2 P2 layout (zero gutters trên mọi screen thật, scrollbar dính trong hero captures) — chặn đúng trước khi `live`; #03 thiếu draggable mirror line (spec IA); #05 lockout bug (lead tự bắt) + README screenshots.
- **Ground-truth verification của reviewer** (bài học pilot #01 được tuân thủ): byte-identity per-file sha256 local-vs-live, cover staging tái tạo bằng gameplay thật (#05, DOM state identical), refuted 2 vision-model hallucination (#04 "headline clipped" hóa ra flush-at-x=0; "instrument note sai" hóa ra đọc đúng).
- **Pure engine + engine-sim** ở cả 5 project (133/317/66/15/183 checks) — bắt bug logic thật không cần browser.
- **Framework diversity hoạt động**: Vue (#02), Angular 21 zoneless (#03), React (#04), no-build jQuery + vendored GSAP (#05, 433KB artifact) đều deploy static thuần lên Shiplo không vấn đề.
- **Visual diversity giữ vững**: 5 identity rõ ràng khác nhau (paper-cut garden / Italian editorial / Bauhaus blueprint / vintage star chart / nautical journal) — reviewer #06-style convergence check đã có trong mọi prompt.

## Systemic findings (áp dụng cho #06+)

| # | Finding | Loại | Hành động |
|---|---|---|---|
| 1 | **tar-hash artifactSha256 không tái lập được** (mtime nhúng trong tar) — 3/4 reviewer phải tự chế per-file sha256 để chứng minh content identity | pipeline | Đã cập nhật `.showcase/docs/DEPLOYMENT.md`: khuyến nghị lệnh tar chuẩn hoá mtime/owner/sort cho hash xác định + ghi chú cho verifier so per-file hash khi tar-hash lệch |
| 2 | **README thiếu screenshots section** — finding lặp ở #03, #04 (P3), #05 (P2) | prompt template | Đã nhúng yêu cầu bắt buộc vào lead prompt #09+ |
| 3 | **THIRD_PARTY_NOTICES khai vượt những gì ship** (font weight 500 không tồn tại trên đĩa) + HANDOFF sai count số file | prompt template | Đã nhúng "list exactly what ships" + "verified counts" vào lead prompt #09+ |
| 4 | **Viewport-fit phải assert chủ động** (scrollHeight ≤ viewport ở 1440×900 + 1024×768 mọi screen chính) — chỉ bị bắt ở review, không phải ở lead | prompt template | Đã thêm vào phase L của lead prompt #09+ |
| 5 | **Rate-limit 5h của API** — 4 lead + 2–3 reviewer đồng thời đốt sạch quota 2 lần (13:47, sau đó nữa), chết hàng loạt giữa chừng | orchestration | Quy tắc concurrency mới: tối đa ~3 lead-equivalent (reviewer ≈ 0.5). Pause/resume bằng SendMessage giữ nguyên context agent — hoạt động hoàn hảo, không mất việc dở |
| 6 | **`scripts/font-check.mjs` misparse multi-weight arg** ("Family:400,600" tách thành family giả) | repo tooling (chưa fix) | Workaround: một entry `Family:weight` mỗi lần gọi. Cần fix script khi tiện |
| 7 | **Angular CLI 22 engine-floor > Node 24.13** — cả #03, #06 đều phải dùng Angular 21.2 | env note | Ghi chú cho lead Angular sau này: pin @angular/cli 21.x |
| 8 | **Codex imagegen: 0/5 project dùng** — art direction của các spec đều code-native SVG/CSS đạt | observation | Codex path vẫn chưa được exercise trong batch; giữ protocol nguyên cho project cần raster (#07 vocabulary-expedition là ứng viên) |

## Numbers

- #02: 32 files / 529 KB · #03 deploy2: 32 / 687 KB · #04 deploy2: 29 / 839 KB · #05: 25 / 443 KB.
- npm audit 0 vulnerabilities × 5; console errors 0 ở 3 viewport × 5 (live).
- Tổng thời gian wall-clock #02–#05 ≈ 1 ngày làm việc (bao gồm 2 lần rate-limit mass-kill + 1 pause theo yêu cầu user).
