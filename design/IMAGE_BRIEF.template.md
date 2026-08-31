# IMAGE_BRIEF — <NN-slug>

<!--
  Cách dùng:
  1. Copy file này thành design brief cho showcase đang làm:
     - Repo-level (dùng ngay):            `design/IMAGE_BRIEF.md`
     - Theo project (khuyến nghị):        `projects/<id>/design/IMAGE_BRIEF.md`
  2. Điền ĐỦ mọi field dưới đây cho TỪNG asset. Một brief có thể chứa nhiều asset entry.
  3. KHÔNG invoke Codex khi brief còn placeholder.
  4. Sau khi generate xong: review visual → cập nhật manifest provenance
     (`design/generated-manifest.json`, hoặc `projects/<id>/design/generated-manifest.json`).
     Manifest là tài liệu nội bộ — không bao giờ nằm trong `public/` (thứ bị ship vào `dist/`).
  Xem quy trình đầy đủ: design/codex-image-producer.md
-->

## Context

- **Showcase**: `<NN-slug>` — `<title>`
- **Design system**: xem `DESIGN_DECISIONS.md` của project (nguồn sự thật visual — brief KHÔNG được mâu thuẫn với nó)
- **Brief ID**: `IMG-<NN>-<seq>` (ví dụ `IMG-01-001`) — dùng cho provenance trong manifest

## Assets

### `<IMG-NN-NNN>` — <tên ngắn của asset>

- **Purpose**: asset này làm gì trong UI, xuất hiện ở đâu, người xem cần hiểu gì khi thấy nó. (Nếu chỉ là trang trí thuần không hỗ trợ comprehension/feedback → cân nhắc lại xem có cần raster không.)
- **Dimensions / aspect ratio**: `<width>x<height>` hoặc ratio (`16:9`, `1:1`, `4:3`…) + dung lượng mục tiêu nếu có.
- **Composition**: bố cục, điểm nhấn, vị trí subject, hướng ánh sáng, khoảng thở (negative space) — đặc biệt nếu asset phải hòa với text/UI overlay.
- **Visual language**: phong cách (flat, paper-cut, painterly, isometric…), palette (tham chiếu token từ `DESIGN_DECISIONS.md`), line weight, texture, mức detail.
- **Constraints**: điều kiện BẮT BUỘC — palette khóa theo design tokens, background trong suốt/nền cụ thể, nhất quán nhân vật với các asset khác, edge treatment (full-bleed vs vignette), tileability nếu là texture.
- **Negative constraints**: những gì PHẢI KHÔNG xuất hiện — ví dụ: chữ/embedded text, watermark, logo, quyền lực thương hiệu của bên thứ ba, khuôn mặt realist cụ thể, gradient tím/xanh gratuitous, clutter.
- **Output path**: `public/assets/generated/<kebab-case-name>.<png|jpg|webp>` — đường dẫn relative đến project chứa brief. Codex chỉ được ghi vào thư mục này.
- **Intended use** (cho provenance): vị trí dùng trong UI (hero, card, sprite sheet, background layer…).
- **Third-party reference**: có dùng ảnh tham chiếu từ bên thứ ba không? Không → `none`. Có → ghi rõ nguồn + license + lý do.

---

## Checklist trước khi invoke Codex

- [ ] `DESIGN_DECISIONS.md` tồn tại và brief không mâu thuẫn.
- [ ] Mọi asset entry đã điền đủ 8 field bắt buộc (purpose, dimensions, composition, visual language, constraints, negative constraints, output path + intended use/reference).
- [ ] Asset không có embedded text (trừ khi field Purpose ghi rõ bắt buộc).
- [ ] Đã cân nhắc SVG/CSS/HTML cho phần geometry/icons/charts — chỉ raster mới đi qua Codex.
- [ ] Output paths không đè file existing mà chưa có ý định replace (nếu replace → ghi note trong brief).
