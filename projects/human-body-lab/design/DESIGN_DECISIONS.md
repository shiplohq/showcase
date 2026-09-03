# DESIGN_DECISIONS — Human Body Lab (Showcase #12)

> Khóa design system cho showcase #12. Nguồn: spec `.showcase/12_human-body-lab.md`
> (medical-editorial thesis đã khóa: warm white, oxblood, blue slate, sage, line art
> simplified, no gore/photorealism) + đối chiếu UI UX Pro Max (queries:
> `science education anatomy explorer kids 9-14 interactive exhibit`,
> `medical editorial clean serif anatomical illustration journal`,
> `diagram callout label typography science poster`,
> `human body layer toggle interaction layered visualization progressive disclosure`,
> `warm white oxblood slate sage editorial palette`,
> `serif display font editorial friendly science journal`,
> `accessible touch targets children education interface guidelines`,
> `progressive disclosure complex information reduce cognitive load`,
> `gsap svg path draw animation stroke`).
> Brief thắng recommendation: mọi gợi ý skill mâu thuẫn medical-editorial line-art
> đều bị loại (bảng giữ/lại §15).

## 1. Visual thesis

**Anatomy atlas plate, brought to life.** App là một trang atlas giải phẫu in đẹp
được sống dậy: nền giấy trắng ấm, khung "plate" có rulers và số bản in
(`PLATE I`), cơ thể người vẽ line-art phía trước, từng hệ cơ quan là một lớp
overlay như tờ giấy trong (vellum) của sách atlas cũ — bật hệ nào, lớp đó hiện
lên với chiều sâu nhẹ. Nhãn cơ quan là specimen label mono HOA với leader line
đúng truyền thống minh họa y khoa. Không dashboard, không cartoon, không 3D,
không gore: mọi shape là simplified clean vector, màu mực in (oxblood / slate /
sage / bone) trên giấy ấm.

Từ khóa: warm white paper · anatomical atlas plate · vellum layer overlays ·
oxblood ink · blue slate · sage · leader-line callouts · mono specimen labels ·
clean line art · editorial science · calm, curious, precise.

## 2. Target users

9–14 tuổi đang học hệ cơ quan ở mức phổ thông (không nội dung chẩn đoán/y khoa
chuyên sâu). Hệ quả thiết kế:

- Copy tiếng Anh, câu ngắn, thuật ngữ khoa học đúng nhưng luôn kèm giải thích
  một dòng (function + 2–3 facts).
- Đọc thành thạo —但仍 giảm cognitive load: một hệ sáng một lúc, facts chọn lọc.
- Tò mò hệ thống: reward là hiểu (route hoàn chỉnh vẽ mượt, quiz trả lời đúng
  được giải thích why), không điểm số xếp hạng, không timer.
- Tablet là viewport chính (lớp học) — touch target ≥44px, không hover-only.

**Ngôn ngữ UI: tiếng Anh** (sản phẩm khoa học quốc tế, spec title/pitch tiếng
Anh, registry summary tiếng Anh).

## 3. Interaction model

1. **Một "plate" cơ thể, nhiều lớp vellum.** Layer explorer: segmented control
   bật/tắt từng hệ (skeletal/circulatory/respiratory/digestive/nervous). Chỉ
   hệ đang bật có organ click được. Tắt hết = body silhouette (overview).
   Nhiều hệ bật cùng lúc được (so sánh vị trí) — hệ sau chèn lên hệ trước.
2. **Hover/focus organ highlight cả shape lẫn label** (spec) — hai chiều: hover
   list item trong panel cũng highlight shape trên plate.
3. **Organ detail = side sheet** (spec IA): click organ → panel trượt vào từ
   phải (tablet trở xuống: bottom sheet) với name, system chip, function,
   facts, "part of … pathway" nếu có.
4. **Pathway game chọn next stop theo sequence** (spec): chọn đúng → đoạn path
   draw-on + pulse; sai → feedback nhẹ không trừng phạt (label nhấp nháy +
   copy hướng dẫn), được thử lại không giới hạn; hoàn thành → full route pulse
   + explanation recap.
5. **Review quiz**: câu hỏi chọn (organ → function / function → organ), đáp án
   sai được giải thích, không timer, retry / restart tự do.
6. **State 3 lớp** (spec): content = JSON; interaction = session (screen, active
   layers, open organ, pathway progress); personal = localStorage anonymous
  (organs đã khám phá, pathway đã hoàn thành, quiz best streak) + nút Reset.

## 4. Color tokens

Medical editorial trên giấy ấm. Flat ink colors, không gradient.

### Neutrals (giấy & mực)

| Token | Hex | Vai trò |
|---|---|---|
| `--paper` | `#FBF7EF` | Nền chính (warm white) |
| `--paper-raised` | `#FFFCF6` | Bề mặt nổi (panel, sheet, chips) |
| `--paper-deep` | `#F1E9DA` | Recessed well, plate mat |
| `--ink` | `#312A24` | Text chính, line art chính (contrast ~12:1) |
| `--ink-soft` | `#6B6156` | Text phụ (≥18px hoặc 14px bold) |
| `--line` | `#E2D8C6` | Hairline, rulers, khung plate |
| `--bone` | `#EDE4D2` | Fill xương (skeletal layer) |
| `--bone-edge` | `#B5A789` | Stroke xương |

### Ink accents (hệ cơ quan — luôn kèm glyph + label, không color-only)

| Token | Hex | Hệ | Text-on |
|---|---|---|---|
| `--oxblood` | `#843838` | Circulatory (máu, tim) + primary actions | white 5.5:1 |
| `--oxblood-deep` | `#67282A` | Pressed, route active | white |
| `--slate` | `#40607E` | Respiratory (khí, phổi) | white 5.6:1 |
| `--slate-deep` | `#2F4A63` | Pressed | white |
| `--sage` | `#5F7A50` | Digestive (tiêu hoá) | white 4.8:1 |
| `--sage-deep` | `#485D3B` | Pressed | white |
| `--nerve` | `#7D5BA6` | Nervous (thần kinh) | white 5.3:1 |
| `--nerve-deep` | `#604487` | Pressed | white |

Purple `--nerve` KHÔNG phải gradient AI — là màu mực in tối, dùng duy nhất cho
nervous system, luôn kèm glyph brain + label.

### Feedback

| Token | Hex | Vai trò |
|---|---|---|
| `--ok` | `#3F6B43` | Correct route/quiz (+ check icon) |
| `--warn` | `#7A4F1D` | Gentle wrong-path (+ arrow icon, không đỏ chói) — darkened from #9A6A2F during the impeccable pass for ≥4.5:1 on its tint backgrounds |
| `--focus` | `#843838` | 2px focus ring offset 2px (ink ở nền tối) |

## 5. Typography

Bộ ba "atlas in":"' Source Serif 4 (display, organ names) · Work Sans (body/UI)
· IBM Plex Mono (specimen labels, rulers, microcopy). Không font nào trùng
showcase đã ship (#01 Baloo 2/Nunito, #02 Fraunces/Source Sans 3).

| Role | Font | Size/weight (desktop) | Notes |
|---|---|---|---|
| Display / screen title | Source Serif 4 600 | 40–56px, -0.01em | "Human Body Lab", tên screen |
| Organ name (sheet, label callout) | Source Serif 4 600 | 24px / 13px | |
| Section heading | Work Sans 600 | 15px, 0.08em uppercase tracking | |
| Body / facts | Work Sans 400 | 16–17px/1.6, max 62ch | |
| Specimen label | IBM Plex Mono 500 | 12–13px, 0.06em uppercase | "ORGAN 04 — LUNGS" |
| Microcopy/rulers | IBM Plex Mono 400 | 11px, `--ink-soft` | |

Import `@fontsource/*`: **latin** subset cho đúng weights dùng (UI tiếng Anh,
không dấu) — 400/400i/600 serif; 400/500/600 sans; 400/500 mono. Font-check
bắt buộc trước deploy.

## 6. Spacing & grid

- Scale 4px: 4/8/12/16/24/32/48/64.
- Plate frame: 20px mat (`--paper-deep`) + 1px `--line` + ruler ticks; corner
  plate number mono.
- App shell: header 64px (logo wordmark + nav tabs + reset), content max-width
  1200px center, padding 24 (tablet) / 32–48 (desktop).
- Explore layout: plate trái (55–60%), control panel phải (40–45%) — tablet
  portrait: plate trên, controls dưới; sheet overlay toàn bộ.

## 7. Layout & screens

Single-page state (không router — spec): `Overview → Explore → Pathways → Quiz`
qua nav tabs (segmented, text + glyph, ≥44px).

- **Overview**: hero plate với body silhouette + intro copy + 3 "entry cards"
  (Explore systems / Route oxygen & food / Review quiz) + principle strip
  ("Look inside · Follow the flow · Check yourself"). Đây là landing state cho
  desktop/tablet screenshots.
- **Explore**: layer toggles (system chips với glyph + name + count organs),
  plate với layers, organ list của hệ đang chọn, side sheet organ detail.
- **Pathways**: chọn pathway (oxygen/food/blood) → plate với numbered stops,
  next-stop choices (organ buttons lớn), progress dots, step explanation,
  completion recap.
- **Quiz**: câu hỏi card, 4 lựa chọn lớn, feedback explain, progress, restart.

## 8. Illustration language

- **Body model = layered original SVG** (đúng spec core mechanic): 1 silhouette
  layer + 5 system layers, mỗi system một `<g>` riêng với id (`layer-skeletal`…),
  organs là shape có `pathId` khớp JSON.
- Vẽ front view, simplified: đường nét 2–2.5px `--ink`/system ink, fill thấp
  độ (12–18% opacity của system color) — line art trước, màu là nhấn.
- Không photorealism, không gore: tất cả hình dạng đơn giản hoá, thân thiện
  (mặt silhouette trơn, không chi tiết bệnh lý).
- Callout: leader line 1px `--ink-soft` + dot 3px tại organ, label mono ở
  lề trái/phải (vị trí authored trong JSON: `labelSide`, `labelY` — tránh
  chồng lấn, harden label collision).
- Glyph icons hệ (bone/heart/lungs/stomach/brain): mini SVG stroke 24×24 vẽ
  tay trong project, cùng line-weight với body — không icon emoji, không icon
  library ngoài (giảm third-party surface).
- Texture giấy: không raster — chỉ 1 lớp CSS rất nhẹ (repeat radial dot quá
  mờ) nếu cần; mặc định paper phẳng sạch.

## 9. Component primitives

- System chip (toggle): glyph + name + organ count; state: off (outline) /
  on (fill system ink, white text) / focus ring; min-height 44px.
- Segmented nav tab: text + underline ink 2px active; keyboard arrows.
- Organ hit-target: shape SVG (focusable, `role="button"`, aria-label organ
  name + system); focus = outline ink 2px + label bold.
- Side sheet (organ detail): heading serif, system chip, function para,
  facts list (dot markers), close button 44px, focus trap + Esc.
- Stop button (pathway): number + organ name + glyph; correct/wrong states.
- Progress dots: mono numerals `01 02 03`, trạng thái done = ink fill + check.
- Reset button: ghost, confirm qua inline "Sure? Reset / Keep" (không confirm()).
- Error card: nếu JSON fail → panel rõ ràng "Content failed to load — retry",
  không white screen (spec).

## 10. Feedback states

- Wrong path: stop label nhấp nhanh 2 lần (motion ≤200ms) + message
  "Not this stop — oxygen goes to the lungs first." (gợi ý hướng, không trách
  mắng); nút thử lại luôn sẵn.
- Correct: segment path draw-on + dot fill + soft pulse 1 lần.
- Completion: full path pulse 1 vòng + recap panel; không confetti/flash.
- Quiz wrong: hiện đáp án đúng + 1 câu explain; đúng: check + explain.
- Toast không dùng; mọi feedback inline cạnh control liên quan.
- Mọi state màu đều kèm icon/label (check/arrow glyph + text).

## 11. Motion budget (GSAP, purposeful)

| Motion | Khi nào | Duration | Loại |
|---|---|---|---|
| Layer fade-in + rise 6px | bật system layer | 260–320ms | spatial (chiều sâu lớp) |
| Layer separation (nhẹ 4–6px translate khi ≥2 lớp) | nhiều lớp cùng lúc | 300–400ms | spatial |
| Organ highlight (stroke width + fill opacity) | hover/focus | 140ms | feedback |
| Side sheet slide-in | mở organ | 280ms | spatial |
| Route segment draw-on (strokeDash) | chọn stop đúng | 420ms | comprehension (flow) |
| Pulse dọc path khi hoàn thành | pathway done | ≤900ms, 1 lần | delight |
| Quiz feedback pop | đáp án | 160ms | feedback |

`src/lib/gsap.ts` wrapper 1 chỗ: mọi tween qua `tween()`; reduced-motion →
final state ngay (≤150ms fade cho panel, không draw-on travel, không pulse).
Không intro animation khoá thao tác; nav luôn available ngay.

## 12. Responsive

- **Desktop ≥1200**: plate ~58% + panel ~42%, sheet 420px phải; whitespace
  tăng, body copy max 62ch. **Viewport-fit policy (đã xác nhận bằng đo
  thực tế)**: Overview (landing) và Quiz fit trong 1440×900 không scroll
  dọc. Explore và Pathways **scroll dọc theo thiết kế** ở mọi viewport —
  figure cơ thể là portrait 560×780 units; giữ đủ cỡ đọc callout labels
  quan hơn ép vừa khung. Không bao giờ scroll ngang.
- **Tablet 768–1199 (hero viewport)**: 1024×768 landscape xếp chồng
  (plate trước, controls sau) — scroll dọc theo thiết kế; touch ≥44px, gap
  ≥8px; sheet thành bottom sheet 70% height.
- **Mobile 390–767 (supported, secondary)**: plate full-width, controls
  stack dưới; nav tabs rút thành chữ ngắn; vẫn đủ 44px targets. Body
  diagram không thu nhỏ dưới 280px rộng.
- 200% zoom: reflow 1 cột, không crop ngang.

## 13. Accessibility

- Semantic HTML: `<nav> <main> <section> <button> <ul>`; ARIA chỉ khi cần
  (sheet `role="dialog" aria-modal`, organ shape `role="button"` + name).
- Body diagram có text equivalents: organ list song song luôn đọc được bằng
  SR; mỗi organ shape có `aria-label` "Lungs — respiratory system. Activate
  to inspect." Facts hiển thị dạng text trong sheet.
- Focus ring 2px `--focus` offset 2px mọi interactive; tab order: nav →
  layers → organ list → plate organs → sheet.
- Keyboard: layer toggles Enter/Space; organ shapes là focusable buttons
  (Enter mở sheet); pathway stops là buttons; sheet Esc đóng, focus trả về
  trigger; nav arrows left/right.
- Không hover-only (list hover ↔ shape highlight chỉ là supplement).
- Không color-only: system chips có glyph + name; correct/wrong có icon + text.
- Không timer, không punitive copy; `prefers-reduced-motion` honored.

## 14. Forbidden patterns (anti-goals)

- Clinical dashboard/SaaS admin vibes, card-in-card soup, glassmorphism,
  neon, 3D, photoreal anatomy, gore.
- Gradient tím-xanh AI mặc định; purple chỉ là `--nerve` ink cho nervous system.
- Emoji làm visual chính; rounded-card bọc mọi thứ (chỉ panel/sheet có surface,
  radius 10px max, hairline border).
- Shadow đậm; chỉ 1 shadow mềm duy nhất cho sheet overlay.
- Intro animation chặn thao tác; infinite decorative animation; pulsating
  everything; bounce/elastic easing.
- localStorage chứa dữ liệu cá nhân; bất kỳ network request runtime nào.

## 15. Keep/drop vs UI UX Pro Max recommendations

| Skill recommendation | Decision | Lý do |
|---|---|---|
| Kids Learning → Claymorphism + vibrant pastels | **DROP** | Spec khóa medical-editorial line-art; claymorphism là identity #01-adjacent |
| Citizen Science → Biophilic greens | **DROP** | Palette bị spec khóa (oxblood/slate/sage ink, không earth-green theme) |
| Educational App → playful colors + analytics dashboard | **DROP** (dashboard), **KEEP** clear hierarchy | Không parent/behavior dashboard cho learning game (CLAUDE.md) |
| Touch targets 44px+ (iOS)/48dp (Android), gap ≥8px | **KEEP** | Đúng spec tablet + lead prompt ≥44px @1024×768 |
| Reduced-motion media query bắt buộc | **KEEP** | Spec + repo rule |
| Loading/skeleton feedback | **KEEP** (dạng error card + retry) | JSON fail phải degrade rõ, không white screen |
| Progressive disclosure | **KEEP** — chính là layer toggles | Đúng core mechanic của spec |
| Infinite animation chỉ cho loading | **KEEP** | Không có loading state dài; mọi pulse là 1 lần |
| Parallax storytelling style | **DROP** | A11y risk cao, không phục vụ comprehension ở đây |
| Data-dense dashboard style | **DROP** | Trùng forbidden patterns |
| Font: Science Gothic/Josefin Slab từ query | **DROP** | Chọn Source Serif 4 + Work Sans + IBM Plex Mono (đúng editorial ink hơn, không trùng showcase đã ship) |
| Palette query results (editorial black+pink, bakery browns) | **DROP** | Spec khóa warm white/oxblood/slate/sage |

## 16. Locked decisions (không reopen)

1. Palette + typography như §4–5; UI copy tiếng Anh; latin-only font subsets.
2. 5 system layers: skeletal, circulatory, respiratory, digestive, nervous.
3. 3 pathways: oxygen (air → blood), food (digestion → blood), blood
   (pulmonary + systemic loop).
4. Single-page state nav, `base: './'`, no router, no runtime CDN.
5. Layered SVG body model là original vector work — không raster, không
   third-party anatomy art (license risk), Codex không dùng cho anatomy.
