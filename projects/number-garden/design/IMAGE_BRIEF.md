# IMAGE_BRIEF — 01-number-garden

<!--
  Producer: OpenAI Codex (imagegen) — đúng một vai trò: raster asset producer.
  Quy trình: design/codex-image-producer.md. Brief này KHÔNG được mâu thuẫn
  projects/number-garden/design/DESIGN_DECISIONS.md (nguồn sự thật visual).
-->

## Context

- **Showcase**: `01-number-garden` — `Number Garden` (khu vườn số học, paper-cut botanical, trẻ 5–7)
- **Design system**: `projects/number-garden/design/DESIGN_DECISIONS.md` — paper-cut
  flat, palette đất ấm (paper `#FAF3E3`, ink `#3D3425`, greens, terracotta, sun yellow),
  KHÔNG gradient, KHÔNG bóng nhựa, KHÔNG text trong ảnh.
- **Brief ID gốc**: `IMG-01-*`

## Assets

### `IMG-01-001` — Paper grain texture tile (asset raster DUY NHẤT của project)

- **Purpose**: vân giấy sợi tự nhiên dùng làm overlay toàn app (body::before,
  `background-repeat`, opacity tổng thể 3–5%, multiply) — tạo chất liệu "giấy cắt
  thủ công" cho mọi màn hình. Thuần trang trí chất liệu: không chứa thông tin,
  không semantic, không phải điều kiện để UI hoạt động (procedural fallback nếu
  asset không đạt).
- **Dimensions / aspect ratio**: `1024x1024`, **tileable/seamless 4 phía** (dùng
  làm repeating background). PNG. Dung lượng mục tiêu ≤ 900 KB (sẽ tối ưu sau).
- **Composition**: kết cấu giấy thủ công đều khắp frame — sợi giấy mảnh, lấm tấm
  hạt phụp nhẹ, mật độ và độ sáng ĐỒNG NHẤT toàn khung (không hotspot, không
  vignette, không ánh sáng có hướng, không bóng đổ). Full-bleed.
- **Visual language**: ảnh phẳng màu kem giấy ấm — nền chủ đạo `#FAF3E3`, vân/sợi
  chỉ lệch nhẹ về `#EFE3C4`–`#E4D5AE` (chênh sáng thấp), matte hoàn toàn như scan
  phẳng tờ giấy cắt, grain ở scale mịn (từng sợi nhìn thấy ở 100% nhưng không thô).
- **Constraints**:
  - Tileable seamlessly cả 4 cạnh (không seam nhìn thấy khi repeat).
  - Độ sáng đồng nhất toàn tile (quantitative: chênh luminance cục bộ < ~8%).
  - Palette khóa họa ấm kem giấy (`#FAF3E3` family) — không tint lạnh.
  - Matte, phẳng, không gradient, không gloss, không nhiễu số kiểu TV-static.
- **Negative constraints**: KHÔNG chữ/embedded text, watermark, logo, signature;
  KHÔNG đối tượng (lá, hoa, đồ vật, bàn tay); KHÔNG gradient/vệt sáng/vignette;
  KHÔNG tint tím-xanh; KHÔNG nếp gấp sâu hay vết rách có bóng; KHÔNG seam tile.
- **Output path**: `projects/number-garden/public/assets/generated/paper-texture.png`
  (Codex chỉ được ghi vào `projects/number-garden/public/assets/generated/`).
- **Intended use**: overlay nền toàn app (screen LessonSelect/Play/WhyItWorks/End);
  cũng dùng tĩnh cho backdrop giấy ở màn chọn bài.
- **Third-party reference**: `none` — asset sinh thuần từ brief, không tham chiếu
  ảnh bên thứ ba.

---

## Checklist trước khi invoke Codex

- [x] `DESIGN_DECISIONS.md` tồn tại và brief không mâu thuẫn (palette/flat/matte khớp §4, §9).
- [x] Asset entry điền đủ 8 field bắt buộc.
- [x] Asset không có embedded text (Purpose ghi rõ thuần texture).
- [x] Đã cân nhắc SVG/CSS/HTML: mọi illustration/icons/geometry khác của project
      chạy SVG/CSS; chỉ texture chất-liệu-giấy mới cần raster (mô tả trong §9 của DESIGN_DECISIONS).
- [x] Output path là thư mục generated sạch, không đè file existing.
