# DESIGN_DECISIONS — GeoTrail (Showcase #16)

> Khóa design system cho showcase #16. Nguồn: spec `.showcase/16_geotrail.md`
> (visual thesis "modern cartographic editorial — parchment warm, deep ocean
> blue, terra-cotta, forest" đã khóa) + đối chiếu UI UX Pro Max
> (queries: `geography learning game education kids atlas map quiz`,
> `map interaction pan zoom data visualization cartography`,
> `editorial vintage parchment map warm earthy typography`,
> `serif display editorial map label font pairing`,
> `compare side by side facts data table education`,
> `tooltip accessibility label density touch target children 8-14`,
> `keyboard navigation focus map zoom arrow keys`,
> `svg zoom pan motion path spatial transition gsap`, domain `gsap`, `ux`).
> Spec thắng recommendation: mọi gợi ý mâu thuẫn cartographic-editorial bị loại (§15).

## 1. Visual thesis

**Modern cartographic editorial.** App là một cuốn atlas mở: trang giấy parchment
ấm làm nền, các bản đồ là "plate" khung viền kép đặt trên nền đại dương xanh
sâu có vân khắc sóng mảnh. Đất nước là polygon phẳng low-poly màu đất ấm
(cream/tan/khaki) với viền ink mảnh; terracotta là màu của *hành trình* (đường
trail, marker, stamp); forest green là màu của *đúng*. Nhãn bản đồ chữ serif
tinh tế, letter-spacing rộng, uppercase cho micro-label. Không gradient, không
neon, không 3D — ánh sáng đến từ màu giấy và đường kẻ, không từ bóng đổ.

Từ khóa: open atlas spread · parchment · deep ocean · engraved wave texture ·
low-poly landmass · plate frame · ledger index · travel stamp · terracotta route ·
measured restraint.

## 2. Target users

8–14 tuổi đang học quốc gia, vùng, địa hình, khí hậu cơ bản. Hệ quả thiết kế:

- Copy tiếng Anh, câu hỏi ≤ 16 từ, không jargon; đơn vị đi kèm số (km², m).
- Đọc thành thục vừa phải: mọi câu hỏi map đều có text equivalent đầy đủ
  (tên + mô tả quan hệ), không bao giờ chỉ-"nhìn-mà-hiểu".
- Suy luận được quan hệ không gian (bắc/nam, giáp biển, sông) — đây chính là
  learning objective, không phải prerequisite.
- Non-punitive: sai chỉ ra thêm gợi ý, không trừ điểm, không timer, không streak.
- Motivation: thu stamp du hành theo từng stop (passport metaphor).

**Ngôn ngữ UI: tiếng Anh** (bộ dữ liệu địa lý chuẩn quốc tế; spec dùng tên
tiếng Anh: "Vietnam", "Southeast Asia").

## 3. Learning interaction principles

1. **Mỗi stop là một câu hỏi, không phải một cú click** — locate (tìm nơi trên
   bản đồ / chọn trong index), compare (so sánh hai nơi bằng facts), clue (suy
   luận từ 2–3 manh mối quan hệ). Cả ba mode đều đánh cùng dataset places.
2. **Map là công cụ suy luận** — click/focus country shape; zoom region bằng SVG
   transform (không map API); quan hệ "north of / borders / coast" được highlight
   bằng relation layer (mũi tên + outline), không chỉ đổi màu.
3. **Locate có drag-label path** (kéo nhãn tên vào bản đồ) nhưng click/keyboard
   list path luôn tồn tại song song (definition of done).
4. **Clue tiết lộ dần** — mỗi gợi ý thêm làm nổi bật thêm một quan hệ trên map
   (comprehension motion); dùng nhiều clue không bị phạt.
5. **Compare là dữ liệu thật** — side-by-side fact panel (area, population,
   capital, highest point, climate) + câu hỏi chỉ hỏi thứ margin rõ ràng;
   engine tự tính lại từ dữ liệu để chặn sai số liệu.
6. **Lỗi = thông tin, không phải trừng phạt** — chọn sai → shape vừa chọn nhận
   highlight mềm + hint thêm; bao giờ cũng thử lại được.
7. **Kết thúc bằng hình ảnh** — stamp album với stamp khắc theo từng nơi đã đi.

## 4. Color tokens

Cartographic editorial — parchment, deep ocean, terracotta, forest. Flat, no gradient.

### Neutrals (giấy / ink)

| Token | Hex | Vai trò |
|---|---|---|
| `--parchment` | `#F4EAD5` | Nền trang chính |
| `--parchment-raised` | `#FBF4E3` | Bề mặt nổi (mission panel, fact card) |
| `--parchment-deep` | `#E8DBBB` | Recessed well, code của ledger |
| `--ink` | `#2B2620` | Text chính, viền bản đồ (contrast ~12.5:1 trên parchment) |
| `--ink-soft` | `#5D5342` | Text phụ (≥18px bold / ≥24px thường) |
| `--line` | `#C9B78E` | Hairline, rule của ledger, graticule trên giấy |
| `--line-strong` | `#9A8A62` | Rule đậm, khung plate |

### Ocean (nền bản đồ)

| Token | Hex | Vai trò |
|---|---|---|
| `--ocean` | `#1E3A52` | Nền đại dương của plate |
| `--ocean-deep` | `#163044` | Vân khắc sóng, viền trong plate |
| `--ocean-ink` | `#8FB0C4` | Nhãn biển, chữ trên ocean (contrast ≥4.5:1) |

### Land (đất theo tint luân phiên)

| Token | Hex | Vai trò |
|---|---|---|
| `--land-cream` | `#EFE2BE` | Tint 1 |
| `--land-sand` | `#E3D2A2` | Tint 2 |
| `--land-khaki` | `#D8C68F` | Tint 3 |
| `--land-sage` | `#CFCC9C` | Tint 4 (ngoại lệ xanh nhẹ cho variety) |
| `--context` | `#B9AE8C` | Đất nền không chơi (context landmass, muted hơn) |

### Accents

| Token | Hex | Vai trò |
|---|---|---|
| `--terra` | `#C25E3B` | Trail route, marker hiện tại, drag ghost, stamp mộc |
| `--terra-deep` | `#9C4526` | Primary CTA bg (text parchment ~5.9:1), pressed, focus halo |
| `--forest` | `#3F6B4F` | Correct/đã hoàn thành (white ~5.4:1) |
| `--forest-deep` | `#2E5140` | Pressed forest, outline "đã đi" |
| `--brass` | `#B98A33` | Số plate, sao nhỏ, chi tiết khắc (chỉ decorative, kèm ink) |

### Trạng thái (không bao giờ color-only)

- **Correct** = `--forest` fill + icon compass-check + câu chữ. **Try-again**
  = `--terra` outline đứt + icon旗帜 + hint text. **Focus** = ring `--ink` 2px
  + 2px gap (trên mọi surface). **Active stop** = `--terra` + số stop + pulse nhẹ.
- Không dùng đỏ lỗi; "sai" không tồn tại như màu.

## 5. Typography

| Vai trò | Font | Weights | Ghi chú |
|---|---|---|---|
| Display / tựa plate / prompt | **Fraunces** (OFL, Undercase Type) | 600–700 (+ soft) | Serif editorial có cá tính, nhãn bản đồ kiểu atlas |
| Body / UI / facts | **IBM Plex Sans** (OFL, IBM) | 400–600 | Grotesque kỹ thuật, đọc rõ ở fact table; latin-ext ✓ |

- Self-host qua `@fontsource/fraunces` + `@fontsource/ibm-plex-sans` (bundle —
  không runtime CDN). UI tiếng Anh → subset `latin` + `latin-ext` (tên riêng có
  dấu). **Không có text tiếng Việt** → không cần subset vietnamese (đối chiếu
  rule: chỉ bắt buộc khi có dấu tiếng Việt).
- Scale (tablet-first): prompt `clamp(22px, 2.8vw, 30px)/1.2` Fraunces 650 ·
  section 22–26 Fraunces 700 · body 16–18/1.5 Plex 400–500 · map label 12–14
  uppercase tracking 0.08em Plex 600 (hoặc Fraunces small-cap cảm giác khắc) ·
  microcopy ≥13 (tablet ≥14).
- Map place label: đặt tại centroid, luôn đọc được (ink trên land, ocean-ink
  trên sea); label = chính text equivalent cho SR.

## 6. Spacing system

Base 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80`.
Gutters màn: 16 (mobile) / 24 (tablet) / 32 (desktop). Khoảng cách giữa hai
touch target kế tiếp ≥ 8px (skill: Touch Spacing — Medium).

## 7. Layout / grid

- App = 1 viewport stage, không scroll trên 1440×900 / 1024×768 cho mọi screen
  chính (assert ở phase L). Header mảnh kiểu "atlas spine" (title trái, stamp
  counter + reset phải), footer 1 dòng microcopy (disclaimer ranh giới).
- **Atlas screen = spread hai trang**: trang trái là world map với 4 plate
  highlight; trang phải là ledger index (trail rows có số, region, tiến độ) —
  KHÔNG card grid đều nhau; gutters giữa hai trang = 1 đường gấp giấy.
- **Trail screen**: plate map chiếm ~60–62% trái/trên; mission panel phải
  (desktop/tablet-landscape), bottom-sheet inline (hẹp). Trong panel: stop
  stepper (6 chấm nối route), prompt, activity body, feedback line.
- **Compare body**: hai fact card cạnh nhau (min 260px mỗi cột; stack dọc khi hẹp).
- **Stamp screen**: passport spread 2 trang, stamp slot lưới so le (không đều).
- Content max-width **1240px** desktop; tablet portrait là hero layout.

## 8. Touch-target rules

- Mọi button/chip (option, clue reveal, next, reset): **≥48×48px** (vượt 44px
  WCAG vì đối tượng 8–14 dùng tablet).
- **Map hit targets**: shape nhỏ (Đan Mạch, Singapore) quá bé → mỗi place có
  hit circleOverlay ≥ 44px diameter tại label anchor, focus ring vẽ tại đó;
  shape lớn = hit chính nó. Hit circle + shape đều chọn được.
- Spacing ≥8px; drag-drop snap **forgiving**: thả trong 60px của target tính đúng.
- Không interaction nào phụ thuộc hover; hover = enhancement desktop (land tint
  đậm hơn + label nổi).

## 9. Illustration language (SVG code-native, gốc)

- **Tất cả map = SVG polygon gốc tự vẽ** theo plates ( plates.json): mỗi quốc
  gia = 1place nhiều polygon (đảo), simplified low-poly 8–24 đỉnh, projection
  equirectangular có squash theo vĩ độ giữa plate — đúng tinh thần "simplified
  và local", không tile server, không imagery bên ngoài.
- **Context landmass** (Trung Quốc, Ấn Độ, Nga, Sahara lân cận…) vẽ muted
  `--context`, không chơi, không nhãn — plate crop kiểu atlas thật.
- **Decoration bản đồ**: graticule mảnh 6% opacity, vân sóng khắc (pattern
  SVG line uốn), compass rose đơn giản, số plate La Mã + rule kép viền plate,
  line sông (Nile, Mekong, Amazon) và dãy núi (Andes, Alps, Scandinavian
  mountains) bằng stroke nét đứt ký hiệu.
- **Stamp = SVG**: vòng răng cưa + tên nơi chạy viền tròn + silhouette mini
  của chính shape đó bên trong — tái dùng geometry plates.json.
- Icon UI (compass, flag, mountain, wave) = SVG stroke 2px đồng bộ, không emoji.
- Bóng: shadow offset đặc 2px cùng-hue (giấy in chồng), không blur lớn, không
  glassmorphism.

## 10. Component primitives

| Primitive | Mô tả |
|---|---|
| `PlateMap` | SVG container: ocean, graticule, shapes, relation layer, route layer, labels |
| `WorldIndex` | Bản đồ thế giới simplified (chỉ plate-select) |
| `MissionPanel` | Panel câu hỏi: stepper, prompt, activity, feedback |
| `LocateActivity` | Drag chip + map pick + list-alternative buttons |
| `CompareActivity` | Hai `FactCard` + 2 option button lớn |
| `ClueActivity` | Clue list reveal dần + relation highlight + answer input |
| `TrailRoute` | Polyline đứt terracotta nối stop markers trên map |
| `StampBadge` | Stamp SVG (earned/unearned) |
| `LedgerRow` | Hàng index trail: số, tên, region, tiến độ |
| `FeedbackLine` | Live-region dòng phản hồi + icon |

## 11. Feedback states

| Trạng thái | Biểu hiện |
|---|---|
| Press | scale 0.97 + shadow collapse, 120ms |
| Hover (desktop) | land tint đậm 1 bậc / panel lift 2px, 160ms |
| Focus-visible | ring ink 2px + gap 2px, không bao giờ remove |
| **Correct** | shape fill `--forest` 200ms + relation flash + live-region "Correct — …" + stamp award scale-in |
| **Try-again** | shape vừa chọn outline đứt `--terra` 500ms + hint mới xuất hiện (fade 150ms) — không rung, không đỏ |
| Clue reveal | thêm 1 dòng clue + relation layer vẽ mũi tên/outline 250ms |
| Stop advance | marker hiện tại dừng + route segment phủ màu forest 300ms, camera pan-zoom tới stop kế 300–450ms |
| Drag | ghost chip theo pointer; shape dưới pointer nhận outline terracotta |

Live region `aria-live="polite"` cho mọi feedback; copy feedback luôn chứa
tên nơi + quan hệ ("Correct — Egypt is south of Greece, and the Nile runs through it").

## 12. Motion budget (GSAP)

Từ spec (khóa): feedback 120–220ms · spatial 250–500ms · delight/reveal ≤900ms ·
không intro khóa thao tác · ease tự nhiên (`power2.out`, `power3.out`) ·
back.out chỉ cho stamp pop.

Chỉ định:
- Plate zoom-in khi vào trail: scale+translate 350–450ms `power3.inOut` (spatial).
- Stop-to-stop pan/zoom: 300–450ms `power2.inOut` (spatial continuity).
- Route reveal khi vào trail: strokeDashoffset vẽ 500ms; mỗi stop đúng:
  segment phủ màu 300ms.
- Clue relation highlight: mũi tên/outline draw 250ms.
- Stamp award: scale 0.6→1 + rotate -8°→0, 450ms `back.out(1.6)` (delight ≤900ms).
- Feedback fills: 150–200ms.
- Wrapper `src/lib/gsap.ts` register một lần + `gsap.matchMedia()` cho reduced
  motion: mọi tween → set final state tức thì, chỉ giữ fade ≤150ms.

## 13. Responsive strategy

- **Tablet 768–1199 = hero viewport**: trail screen = map trên + panel dưới
  (landscape: map trái + panel phải); touch ≥48px; không hover-requirement.
- **Desktop ≥1200**: spread rộng hơn, fact card 2 cột rõ, max-width 1240.
- **Mobile 360–767 `limited`**: stack dọc, map vẫn full-width interactive
  (tap-first), mission panel thành section inline; drag-label vẫn chạy
  (pointer events) nhưng tap path là chính; khai `mobileSupport: "limited"`
  + note nếu capture mobile cho thấy constraint. Không scroll ngang.
- Breakpoints: `480 / 768 / 1024 / 1200`. Reflow 200% zoom không mất content.

## 14. Accessibility constraints

- Semantic HTML trước ARIA; `lang="en"`; landmarks header/main/footer; prompt
  là heading cấp ổn định.
- **Keyboard path đầy đủ (definition of done)**:
  1. Map: Tab/arrow di chuyển focus giữa place hit-targets (roving), Enter =
     chọn; mỗi place là button thật có aria-label ("Vietnam — country in
     Southeast Asia").
  2. Locate: danh sách alternative (chips tên nơi) luôn hiện trong mission
     panel — chọn + Enter, không cần mô phỏng drag.
  3. Compare/Clue: option buttons tab-able, Enter chọn; clue reveal = button.
  4. Esc = thoát drag đang giữ / về atlas (từ trail).
- Mọi câu hỏi map có text equivalent đầy đủ (tên + quan hệ trong prompt);
  không "chỉ nhìn hình mới hiểu".
- Focus-visible luôn hiện; không trap; live region polite.
- Không color-only (§4), không hover-only, không time pressure, không âm thanh.
- localStorage chỉ progress ẩn danh (stop hoàn thành) + nút Reset rõ ràng.

## 15. Anti-patterns (cấm)

1. Claymorphism / vibrant block-based candy kids UI (mặc định của skill cho
   kids app) — **bị loại**, phá cartographic editorial (§15 bảng đối chiếu).
2. Gradient tím–xanh AI; gradient trang trí nói chung.
3. Card-inside-card soup; dashboard SaaS; lesson-select card grid đều tăm tắp.
4. Emoji làm icon/visual chính; raster làm UI/map.
5. Leaderboard, streak, timer, điểm trừ.
6. Feedback đỏ/x rung trừng phạt.
7. Bounce/elastic trang trí; ambient loop vô hạn; intro chặn input.
8. Hover-dependent interaction; touch target <48px; map không có keyboard path.
9. Map tile/imagery bên ngoài; runtime CDN (font, GSAP, ảnh).
10. Political-boundary claim: mọi plate có ghi chú "Boundaries simplified for
    learning — educational dataset only".

## 16. Đối chiếu UI UX Pro Max → giữ / loại

| Skill recommendation | Quyết định |
|---|---|
| Kids learning → Claymorphism + vibrant blocks, candy palette | **LOẠI** — mâu thuẫn cartographic editorial (§15.1) |
| Quiz → energetic blue + correct green + incorrect red + leaderboard | **LOẠI** red/leaderboard; giữ tinh thần "clear correct cue" bằng forest + icon + text |
| Geographic data → SVG <1000 regions, label regions directly, pair fill với boundary; a11y fallback sortable table + keyboard pan/zoom | **GIỮ** — SVG plates, label trực tiếp, list alternative = fallback; pan/zoom có nút + arrow keys |
| Choropleth single-color gradient per group | **LOẠI** — tint land luân phiên cố định theo plate, không encode dữ liệu bằng gradient |
| Touch ≥44pt/48dp, spacing ≥8px | **GIỮ + siết** ≥48px toàn bộ control |
| Keyboard nav full + focus ring mọi control | **GIỮ** (§14) |
| Focus Not Obscured; tab order theo visual order | **GIỮ** — bottom-sheet không che focus; DOM order = visual order |
| Serif display + sans pairing kiểu editorial | **GIỮ** → Fraunces + IBM Plex Sans (OFL) |
| Playfair/Inter "classic elegant" | **LOẠI** — quá luxury-fashion; Fraunces chuẩn atlas hơn |
| Handwriting fonts (Schoolbell/Permanent Marker) | **LOẠI** — không phải travel-journal scratch (đó là identity #05) |
| Page transition fade 200–300ms power1.inOut, exit nhanh hơn entrance | **GIỮ** cho screen switches |
| Reduced-motion: render final state immediately | **GIỮ** (§12) |
| Trust/social-proof landing patterns | **LOẠI** — đây là learning atlas |
