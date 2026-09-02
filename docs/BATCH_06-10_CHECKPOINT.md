# Batch Checkpoint — Showcases #06–#10

**Ngày:** 2026-09-03 · **Kết quả:** 10/20 `live` (#06 money-market-junior, #07 vocabulary-expedition, #08 phonics-forest, #09 grammar-detective, #10 story-sequencer — mỗi project qua lead → reviewer → fix-loop → orchestrator integration; #07/#08/#10 cần release 2 sau review).

## What worked

- **Fix-loop redeploy là normal flow**: 3/5 project ship release 2 sau review (#07 hotspot 44px + cover restage + mobile map vertical trail; #08 finale dead-end engine bug; #10 chips 48px + alt). Tất cả redeploy cùng site_id, provenance giữ lịch sử cả 2 release.
- **Deterministic artifact hash hoạt động** (#10 ghi đầu tiên): reviewer recompute khớp byte-exact — kết thúc false-alarm mtime của wave 1. #12+ được yêu cầu dùng method này mặc định.
- **Ground-truth review chuẩn hoá**: pixel-diff/SSIM (cover #07/#08), DOM getBoundingClientRect (#07 42 hotspots, #10 chips), per-file sha256 identity (mọi project). Vision-tool hallucinate bị bắt 3 lần và luôn bị refute bằng probe — quy tắc pilot đang chạy đúng.
- **Visual diversity 10/10**: market-signage, gouache field-journal, Nordic woodcut, manila case-file, comic-workshop — reviewer xác nhận từng cặp lân cận không hội tụ (journal #07 vs #05, case-file #09 vs #03, comic #10 vs #07).

## Systemic findings (áp dụng #11+)

| # | Finding | Hành động |
|---|---|---|
| 1 | **Alt/screenshot-caption accuracy là lỗi lặp nhiều nhất** (P2 ở #07, #08, #10 — alt mô tả trạng thái không có trong ảnh) | Từ #11: lead prompt yêu cầu "alts ACCURATE vs the actual image — reviewers pixel-diff these"; reviewer prompt có mục pixel-diff alt |
| 2 | **≥44px assertion chạy trên sai screen** (#07 đo album thay vì scene; #10 đo shelf thay vì link board) | Từ #11: prompt yêu cầu assert "ON THE ACTIVITY SCREENS"; driver phải cover mọi screen mang control |
| 3 | **"Doc-only fix" có thể ẩn runtime bug** (#08: alt P2 → root-cause ra finale dead-end thật) | Quy tắc mới cho lead: mọi thay đổi source sau deploy phải rebuild → redeploy → re-verify; không giữ source ≠ deployed |
| 4 | **`.angular/` cache thiếu trong template gitignore** → 2 file compiler cache lọt commit #10 | Template + #10 gitignore đã fix; orchestrator junk-grep trước mọi commit (đã bắt được) |
| 5 | **Port collision giữa các Chrome headless session** gây fake rendering failure (review #06) | Fresh profile + port riêng cho mọi CDP driver run (đã trong pattern pilot + nhắc trong prompt) |
| 6 | **CDP headless port / preview server phải dọn** sau run (nhiều agent để lại process) | Lead prompt đã nhắc "delete .shots scratch"; thêm: kill preview server sau dùng |

## Rate-limit / orchestration

- Lần thứ 3 user pause vì token — cơ chế resume-via-SendMessage giữ nguyên context agent hoạt động hoàn hảo (0 lần phải làm lại từ đầu; reviewer giữ đúng methodology đo cũ khi re-verify).
- Ngân sách ~3 lead-equivalent đang ổn; 429 chỉ xảy ra khi vượt (2 lần đầu batch).

## Numbers

- #06: 36 files / 0.65 MB · #07 release2: 18 / 828 KB · #08 release2: 20 / 710 KB · #09: 34 / 716 KB · #10 release2: 23 / 862 KB.
- npm audit 0 × 5; console errors 0 ở 3 viewport live × 5; engine-sim: 183/171·6units·15/271/358 checks.
- Codex raster: 0/5 (cả 10 project đầu đều code-native SVG/CSS).
