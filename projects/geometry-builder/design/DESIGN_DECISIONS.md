# DESIGN_DECISIONS — Geometry Builder (Showcase #03)

> Khóa design system cho showcase #03. Nguồn: spec `.showcase/03_geometry-builder.md`
> (visual thesis "Bauhaus workshop thân thiện / minimal architect's desk" đã khóa)
> + đối chiếu UI UX Pro Max (queries: `construction manipulative learning toy children geometry shapes building`,
> `technical drawing blueprint drafting typography architecture aesthetic`,
> `grotesk geometric sans display font pairing mono technical`,
> `drag and drop touch interaction children precision snapping forgiving targets`,
> `neutral precise color palette off-white cobalt vermilion mustard graphite bauhaus`,
> `undo redo destructive action kids education error feedback non punitive`,
> `gsap snap flip motion path stagger easing feedback`,
> `keyboard accessible alternative drag drop move rotate controls`,
> `bauhaus swiss brutalist geometric minimal style`,
> `prefers reduced motion respect accessibility animation`).
> Brief thắng recommendation: mọi gợi ý mâu thuẫn art direction đã khóa đều bị loại (§15).

## 1. Visual thesis

**Bàn kiến trúc sư tối giản (minimal architect's desk) theo ngôn ngữ Bauhaus workshop.**
Cả app là một **tấm bản vẽ kỹ thuật (drawing sheet)**: nền giấy off-white có lưới kỹ thuật
mảnh (graph paper 1 unit, trục đậm mỗi 4 unit), khung sheet viền kép kiểu ISO, và
**title block** góc dưới phải (tên project, mission, scale 1:1, số sheet, date) — đúng
quy ước bản vẽ thật. Các polygon là **mảng màu phẳng Bauhaus** (cobalt / vermilion /
mustard) viền graphite 2px + **hard offset shadow đặc 4px** (không blur — correct
quy ước in kỹ thuật, không phải bóng 3D). Đường đo (dimension lines) mảnh có mũi tên
2 đầu + chữ mono — ngôn ngữ annotate của bản vẽ. Ghost slot chưa dựng là outline
**dashed cobalt** trên giấy. Trạng thái hoàn thành đóng dấu **"CHECKED"** như con dấu
duyệt bản vẽ (xoay nhẹ −8°, mực vermilion).

Từ khóa: drafting sheet · graph paper · flat Bauhaus color blocks · hard offset shadow ·
dimension lines · mono annotations · title block · crop-mark brackets · crisp SVG.

Điểm phân biệt với #01 (paper-cut garden) và các showcase khác: #01 ấm/organic/bo góc
asymmetric; #03 là **hình học chuẩn xác, góc vuông, đối xứng, trắng-đen-nhấn 3 màu**,
chữ mono đo đạc — không bo góc tròn, không texture giấy, không bóng mờ.

## 2. Target age

7–11 tuổi (lớp 3–5), đang học shape properties: sides/angles, song song, đối xứng,
perimeter, composition/decomposition. Hệ quả thiết kế:

- Đọc trôi chảy câu ngắn; copy UI tiếng Anh, ≤ 12 từ/câu hướng dẫn.
- Số đo + tên hình luôn hiển thị bằng **chữ + ký hiệu hình học** (tick marks song song,
  ô vuông góc) — không color-only.
- Không time pressure; sai = "hình chưa khớp bản vẽ" (copy kỹ thuật, không đỏ trừng phạt).
- Tự khám phá: hint 3 cấp do trẻ chủ động bấm.

**Ngôn ngữ UI: tiếng Anh** (spec: JSON example `bridge-02`, `tri-right`, mission naming
tiếng Anh; subtitle tiếng Việt "Xưởng hình học" chỉ dùng làm tagline phụ một lần ở lobby).

## 3. Learning interaction principles

1. **Thuộc tính hình là công cụ, không là câu hỏi** — trẻ dùng sides/angles/symmetry để
   hoàn thành bản vẽ; inspector hiển thị properties của shape đang cầm như "spec sheet".
2. **Snap là affordance học** — grid snap 1 unit + rotation snap 15° giúp trẻ *cảm nhận*
   alignment/symmetry bằng tay (đúng spec: snap theo grid, rotate 15°/45°).
3. **Đối xứng là hành động nhìn thấy** — mirror mission: nửa in sẵn mờ, đường gương
   kéo được; ghost nửa phải chỉ xuất hiện sau hint (spec).
4. **Đo bằng cách đi vòng** — perimeter mode: click từng cạnh để "walk" quanh công trình,
   số đo cộng dần như thước dây (spec: click cạnh để walk).
5. **Lỗi = chưa khớp bản vẽ** — thả sai chỗ: piece về tray nhẹ nhàng + slot nhấp nháy
   dashed; không đỏ, không rung phạt, không âm báo lỗi.
6. **Mọi thao tác đảo ngược được** — undo/redo in-memory (acceptance checklist), kéo về
   tray để tháo, reset mission.
7. **Keyboard path đầu tiên** — select + move/rotate bằng phím và bằng nút thật (WCAG 2.2
  Dragging Movements: dragging không bao giờ là con đường duy nhất).

## 4. Color tokens

Palette khóa theo spec: off-white, cobalt, vermilion, mustard, graphite. Flat, no gradient.
Đối chiếu skill `bauhaus` (red #D02020 / blue #1040C0 / yellow #F0C020 / shadow 4px /
border 2px / radius 0 / mechanical press): **GIỮ** cơ cấu, chỉnh sắc độ cho đúng hedon
"architect's desk" (cobalt trầm hơn blue chuẩn, vermilion ấm hơn red chuẩn).

### Neutrals (giấy vẽ)

| Token | Hex | Vai trò |
|---|---|---|
| `--paper` | `#F4F1E8` | Nền sheet chính (drafting paper off-white ấm) |
| `--paper-raised` | `#FBF9F2` | Bề mặt nổi: tray, inspector, title block |
| `--paper-deep` | `#EAE5D6` | Well/recessed: tray bin, slot nền |
| `--ink` | `#211E19` | Text chính, viền shape, khung sheet (contrast ~13:1 trên paper) |
| `--ink-soft` | `#5A554A` | Text phụ (≥14px; chỉ dùng ≥18px thường cho body) |
| `--line` | `#D9D2BF` | Hairline, đường kẻ ngăn |
| `--grid-minor` | `#E4DECC` | Lưới kỹ thuật 1 unit |
| `--grid-major` | `#CFC7AE` | Lưới đậm 4 unit |

### Bauhaus accents (khối hình + hành động)

| Token | Hex | Vai trò |
|---|---|---|
| `--cobalt` | `#1A43BF` | Accent chính: rect/quadrilateral fills, ghost slot dashed, link, primary CTA fill (white text 7.4:1) |
| `--cobalt-deep` | `#12318F` | Pressed/hover đậm, focus halo |
| `--cobalt-wash` | `#E4E9F6` | Fill nhạt: dimension label nền, hint region |
| `--vermilion` | `#D9481E` | Accent nhấn: triangle fills, selection brackets, CHECKED stamp (ink text 4.9:1 trên wash; chỉ dùng text lớn/đậm) |
| `--vermilion-deep` | `#B03817` | Pressed vermilion |
| `--mustard` | `#E3A72F` | Accent ba: polygon đặc biệt (hexagon/trapezoid), nudge state (kèm icon + text) |
| `--mustard-deep` | `#C08A1D` | Pressed mustard |
| `--graphite-fill` | `#3A362E` | Khối graphite hiếm (robot body), hard shadow color |

### Trạng thái (không bao giờ color-only)

- **Fit/complete** = `--cobalt` + tick icon + text "CHECKED". **Nudge/chưa khớp** =
  `--mustard` + icon arrow-return + text hướng dẫn. **Selection** = crop-mark brackets
  `--vermilion` 4 góc (signature). **Focus-visible** = viền `--ink` 2px + offset gap 2px.
- Không dùng đỏ thuần cho "sai"; "sai" không tồn tại như màu — chỉ có "chưa khớp".

## 5. Typography

| Vai trò | Font | Weights | Ghi chú |
|---|---|---|---|
| Display / heading / mission title | **Space Grotesk** (OFL, Florian Karsten) | 500–700 | Grotesk có cá tính, kỹ thuật nhưng thân thiện — đúng "typography grotesk có cá tính" của spec |
| Body / UI / button | Space Grotesk | 400–500 | Một family duy nhất cho sans → cô đọng như bản vẽ |
| Số đo / dimension labels / microcopy kỹ thuật / title block | **IBM Plex Mono** (OFL, IBM) | 400–600 | Lettering kiểu drafting; tabular-nums |

- Self-host qua `@fontsource/space-grotesk` + `@fontsource/ibm-plex-mono` (bundle, không
  runtime Google Fonts — đúng font policy repo).
- **UI English-only → import subset `latin` + `latin-ext`** cho cả hai family (bài học
  pilot #01: luôn import `latin-*`; không ship text tiếng Việt nào nên không cần subset
  `vietnamese`).
- Scale (tablet-first): mission title `clamp(22px, 3.2vw, 34px)/1.1` SG 700 · section
  label 13–14px SG 600 uppercase tracking 0.08em · body 16–18/1.5 SG 400–500 ·
  dimension/mono 13–16px Plex Mono 500 (≥13px, kèm nền wash đủ contrast) ·
  số đo lớn (perimeter total) 40–64 Plex Mono 600 `tabular-nums`.

## 6. Spacing system

Base 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80`. Gutters: 16 (mobile) /
24 (tablet) / 32 (desktop). Touch spacing giữa 2 target kế tiếp ≥ 8px (skill: Touch
Spacing — Medium). Sheet padding trong khung: 16–24px; title block density cao nhưng
giữ ≥8px giữa các field.

## 7. Layout / grid

- **Toàn app = 1 drawing sheet** full-viewport: khung viền kép 2px ink + 1px cách 4px,
  title block là strip dưới-phải (desktop) / rút thành 1 dòng dưới (tablet hẹp).
- **Lobby = "Drawing Index"**: các mission là **sheet tabs** xếp theo track (HOUSES /
  BRIDGES / ROBOTS) — mỗi tab: số sheet lớn mono, tên mission SG 700, mini-SVG của
  công trình, stamp DONE nếu xong. KHÔNG card grid đều tăm tắp — tabs lệch nhau như
  chồng giấy bản vẽ xếp lớp (mỗi tab offset nhẹ, xen kẽ trái/phải 12px).
- **Workbench**: grid `12 × [canvas 1fr × tray]` — trái **PARTS BIN** (tray dọc desktop,
  ngang dưới tablet hẹp), giữa **canvas SVG** graph paper (đây là 70%+ diện tích),
  phải **SPECIFICATIONS inspector** (properties + move/rotate controls). Density vừa
  (spec: workspace density vừa phải), max-width 1360px desktop.
- **Review mode** = chính canvas workbench sau khi complete + overlay measurements;
  toolbar chuyển thành "walk mode".
- Overlay/error = một lớp giấy trắng phủ với stamp thông điệp — không modal tối.

## 8. Touch-target rules

- Primary CTA (CHECK FIT, NEXT BLUEPRINT): **≥56px** cao, full-width ở dock hẹp.
- Standard control (rotate/move/undo/tray piece): **≥48×48px** (skill khuyến nghị 44;
  siết vì đối tượng 7–11 cầm stylus/ngón to).
- Tray piece hit area ≥48px kể cả khi shape nhỏ; spacing ≥8px.
- Drop zone slot **phình +4px stroke khi đang kéo**; snap radius 1 unit quanh tâm —
  forgiving (spec: forgiving drag targets).
- Không hover-only; hover desktop chỉ là lift 1px + shadow.

## 9. Illustration language

- **SVG/CSS code-native 100% cho mọi hình** (spec: "Tạo SVG nguyên bản trong project").
  Polygon kit: rect, square, isoceles/right triangle, parallelogram, trapezoid, hexagon —
  tất cả render từ `points` trong `shapes.json`, không asset raster.
- **Không dùng Codex raster** cho showcase này: mọi chất liệu (graph grid, dimension
  arrows, stamp, title block) đều vẽ được bằng SVG/CSS chuẩn xác hơn ảnh; art direction
  = chuẩn xác (precision) — raster texture không materially improve (quyết định ở §C
  asset classification).
- Hard offset shadow: polygon SVG nhân bản offset (3,3) fill `rgba(33,30,25,0.16)` —
  không blur, không double.
- Dimension line: stroke 1px ink-soft + arrowhead marker 2 đầu + label mono nền wash.
- Right-angle mark: ô vuông nhỏ 8px ở đỉnh góc 90° (ký hiệu chuẩn bản vẽ).
- Parallel mark: số vạch gạch chéo (1 vạch / 2 vạch) trên cặp cạnh song song.
- Icon UI (undo/redo/rotate/close): SVG stroke 2px đơn giản tự vẽ — không emoji, không
  icon library ngoài (giữ deps tối thiểu, ngôn ngữ nhất quán).

## 10. Feedback states

| Trạng thái | Biểu hiện |
|---|---|
| Press | translate(1px,1px) + shadow collapse 0, **0ms instant** (mechanical press Bauhaus) |
| Hover (desktop) | lift −1px + shadow 4→5px, 150ms |
| Focus-visible | viền ink 2px + gap 2px, không bao giờ remove |
| Select piece | crop-mark brackets vermilion 4 góc + properties hiện ở inspector |
| Snap settle | piece scale 1.03→1 + shadow nhảy về 4px, 150ms |
| **Fit (đúng slot)** | slot dashed → solid cobalt + tick nhỏ, 180ms; live-region "Wall locked in place" |
| **Chưa khớp / thả sai** | piece tween về tray 300ms + slot nhấp dashes 2 nhịp; copy "Not quite on the blueprint — try the dashed outline" |
| Nudge hint (nút Hint) | level 1: slot kế tiếp pulse; level 2: ghost shape trong slot; level 3: + mũi tên rotation chỉ góc cần xoay |
| Complete | outline công trình vẽ nét đậm quanh silhouette (dashoffset 450ms) + stamp CHECKED đập xuống ~700ms + tick marks song song hiện ở các cặp cạnh |
| Perimeter walk | marker băng dải đo chạy dọc cạnh 280ms + length label cộng dần; cạnh đã đo đổi nét đậm |

Live region `aria-live="polite"` cho mọi feedback textual; mọi trạng thái có icon +
text kèm màu.

## 11. Motion budget

Từ spec (khóa): feedback 120–220ms · spatial 250–500ms · delight/reveal ≤900ms ·
không intro khóa thao tác · ease tự nhiên, không bounce/elastic mặc định.

Chỉ định GSAP (qua wrapper `src/app/lib/gsap.ts`, register một lần, cleanup destroy):
- Piece snap settle: 150ms `power2.out` (scale + drop shadow attr).
- Thả sai → về tray: 300ms `power2.inOut` (spatial).
- **Flip**: tray refill / lobby tab sắp xếp lại — 350–450ms.
- Blueprint reveal đầu mission: stroke-dashoffset outline 450ms `power2.out`, chạy
  sau khi input đã khả dụng (không khóa thao tác).
- Complete: outline flash 450ms + stamp 700ms (scale 1.6→1 + rotate −8°, `back.out(1.6)`
  — delight duy nhất được phép).
- Perimeter tracer: **MotionPath** marker dọc cạnh 280ms `power1.inOut`.
- Lobby tabs stagger 30ms (skill: 0.02–0.04s), tổng ≤500ms.
- Không ambient loop; không parallax.

**prefers-reduced-motion**: wrapper dùng `gsap.matchMedia` — reduced mode set trạng
thái cuối tức thì, chỉ giữ opacity transition ≤120ms; stamp/outline hiện ngay; app
chơi 100%.

## 12. Responsive strategy

- **Tablet 768–1199 = hero viewport** (spec + SCREENSHOTS: education → tablet là hero).
  Thiết kế tablet TRƯỚC: canvas chiếm phần lớn, tray chuyển dock ngang dưới, inspector
  chuyển thành panel dưới canvas (stack dọc), mọi nút ≥48px.
- **Desktop ≥1200**: ba cột đầy đủ (tray trái · canvas · inspector phải), thêm whitespace,
  max-width 1360px, title block đầy đủ field.
- **Mobile 360–767**: `limited` — stack dọc, canvas trước, tray cuộn ngang; drag vẫn
  hoạt động (pointer events) nhưng không gian hẹp; khai báo `mobileSupport: "limited"`
  + note; chỉ chụp mobile.webp nếu layout thật sự dùng được ở 390×844.
- Breakpoints: `480 / 768 / 1024 / 1200`. Không horizontal scroll ở mọi breakpoint;
  200% zoom reflow được (acceptance).
- Canvas SVG co giọng theo container (viewBox), không thu nhỏ touch target của nút.

## 13. Accessibility constraints

- Semantic HTML trước ARIA; `lang="en"`; landmarks header/main; mission title là heading.
- Mọi control là `<button>` thật; tray piece là button có aria-label đầy đủ properties
  ("Right triangle, 3 sides, one right angle"); slot có aria-label ("Dashed slot for
  rectangle 6 by 4").
- **Keyboard path đầy đủ (definition of done)**:
  1. Tab vào tray → arrow trái/phải chọn piece → Enter = cầm piece.
  2. Piece cầm đặt lên canvas ở vị trí focusabled; arrow keys = move 1 unit
     (Shift+arrow = 4 units); `R`/`E` = rotate ±15°; Delete/Backspace = về tray.
  3. Inspector có nút move ◀▶▲▼ + rotate CCW/CW **hiện luôn** (không chỉ keyboard) —
     dùng được bằng touch/mouse (WCAG 2.2 single-pointer alternative).
  4. Check Fit / Hint / Undo / Redo là button thường.
- Focus-visible luôn; roving tabindex trong tray; không focus trap; ESC = bỏ cầm/đóng.
- Live region polite cho feedback/snap/complete/perimeter count.
- Không color-only (mọi state kèm icon + text); không hover-only; không time pressure.
- localStorage chỉ anonymous: mission ids đã CHECKED + đã walk perimeter (reset button
  trong lobby). Không dữ liệu cá nhân.
- `prefers-reduced-motion` như §11. Screen reader text equivalent cho câu hỏi hình học
  (slot nào cần gì, công trình hiện có gì).

## 14. Anti-patterns (cấm)

1. Claymorphism / soft-3D / bóng mờ blur / glassmorphism / neon / 3D — recommendation
   mặc định của skill cho kids app, **bị loại** vì phá precision drafting (§15).
2. Gradient tím–xanh AI; gradient trang trí nói chung; rounded-card mọi thứ (radius 0
   là mặc định, chỉ pill cho stamp/CTA nhỏ).
3. Card-inside-card soup; dashboard SaaS; mission grid card đều tăm tắp.
4. Emoji icon; raster icon; text nhúng ảnh.
5. Điểm số/leaderboard/streak/timer áp lực trẻ.
6. Feedback đỏ/x rung trừng phạt; error copy tiêu cực.
7. Bounce/elastic trang trí; ambient loop; intro chặn input; motion là tín hiệu đúng/sai duy nhất.
8. Hover-dependent; touch target <48px; text quan trọng <14px tablet; số đo <13px.
9. Runtime CDN bất kỳ (font/GSAP/ảnh); API/backend (static-only showcase).
10. Canvas bitmap cho main canvas (spec: SVG crisp); history-route server fallback.

## 15. Đối chiếu UI UX Pro Max → giữ / loại

| Skill recommendation | Quyết định |
|---|---|
| Kids learning → Claymorphism + pastel candy | **LOẠI** — mâu thuẫn precision Bauhaus drafting (§14.1) |
| Style `bauhaus`: primary colors, hard shadow 4px, border 2px, radius 0, mechanical press, dot grid | **GIỮ** — khớp thesis; sắc độ chỉnh theo palette khóa spec (cobalt/vermilion/mustard/graphite) |
| Style `minimalism-swiss`: grid, whitespace, no shadow | **GIỮ một phần** — grid + hierarchy + radius 0; giữ hard shadow vì Bauhaus cần khối |
| Outfit 900 uppercase headlines (bauhaus preset) | **LOẠI** — khóa Space Grotesk + IBM Plex Mono (spec: grotesk cá tính + lettering đo đạc; Outfit 900 uppercase quá poster, không phải bản vẽ) |
| Kids Learning palette (#2563EB/#F59E0B/#EC4899) | **LOẠI** — palette khóa ở spec (§4); pink accent không thuộc thesis |
| Touch ≥44px + spacing ≥8px | **GIỮ + siết** ≥48px (đối tượng 7–11) |
| Touch Friendly (High) — mobile target lớn hơn desktop | **GIỮ** — nút full-width ở dock hẹp |
| Dragging Movements: single-pointer alternative + keyboard (WCAG 2.2, High) | **GIỮ** — nút move/rotate hiện luôn + keyboard path đầy đủ (§13) |
| Focus States visible mọi control (High) | **GIỮ** (§10) |
| Compact Control Semantics: button thật + aria-pressed (Critical) | **GIỮ** — mọi tray piece/control là button |
| Reduced Motion bắt buộc (High), matchMedia | **GIỮ** (§11) |
| Excessive Motion: 1–2 key element/view | **GIỮ** — mỗi screen một signature moment (reveal / stamp / tracer) |
| Stagger 0.02–0.04s, kill tween on unmount, pause khi hidden | **GIỮ** (§11 lobby + cleanup Angular destroy) |
| Haptic feedback (navigator.vibrate) | **LOẠI** — không cần thiết, thêm permission surface |
| Motion duration theo context, không cứng 150–300ms | **GIỮ** — dùng motion budget 3 tầng của spec |
