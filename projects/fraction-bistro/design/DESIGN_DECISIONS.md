# DESIGN_DECISIONS — Fraction Bistro (Showcase #02)

> Khóa design system cho showcase #02. Nguồn: spec `.showcase/02_fraction-bistro.md`
> (editorial Italian bistro thesis đã khóa) + đối chiếu UI UX Pro Max
> (queries: `education learning tool product UX children math`,
> `editorial typography serif display pairing restaurant menu`,
> `warm high contrast palette tomato red olive editorial`,
> `tablet touch UX children drag drop targets`, `gsap flip drag transitions`,
> `fraction learning visual math manipulative` — query cuối không hit DB,
> không fallback mặc định). Brief thắng recommendation: mọi gợi ý của skill
> mâu thuẫn editorial-flat đều bị loại (§15). Giữ nguyên cấu trúc 15 mục
> proven bởi pilot #01 để các showcase đối chiếu được với nhau.

## 1. Visual thesis

**Editorial Italian bistro.** App là một sảnh trattoria in trên giấy menu:
nền kem bột mì phẳng có vân giấy procedural rất nhẹ (SVG feTurbulence,
0 dependency), các khối nội dung tách bằng **hairline đôi kiểu menu**
(đường kẻ mảnh 1px + khoảng trắng, không phải card bo tròn), tiêu đề masthead
serif đậm letterspacing rộng, tên món serif italic kèm **dotted leader**
dẫn tới phân số kiểu "giá tiền" trên menu. Order là **ticket giấy có răng cưa**
đóng dấu mực đỏ khi hoàn thành. Mọi hình món ăn là **SVG vector phẳng vẽ
net-ink** (đường mép 2px màu mực) — cảm giác poster in, không 3D, không shadow
mờ. Số lượng luôn hiện **đồng thời dạng hình (miếng cắt) + ký hiệu n/d +
lời đọc** ("five of eight equal parts").

Từ khóa: Italian poster · trattoria menu · tomato red · olive · flour cream ·
ink linework · flat vector · paper ticket · stamp · editorial grid.

Phân biệt với #01 (paper-cut botanical, Baloo 2/Nunito, земля palette): đây là
thế giới serif editorial, đường kẻ thẳng, hình học круг/rect tách miếng, không
có organic leaf/collage. 19 showcase sau không dùng lại ngôn ngữ này.

## 2. Target age

7–10 tuổi (lớp 3–4), đang học phân số: đơn vị phân số, tử/mẫu, so sánh phân số
khác mẫu, phân số tương đương. Hệ quả thiết kế:

- Copy tiếng Anh ngắn (đúng signals của spec — JSON example/explanation đều
  tiếng Anh), ≤ 12 từ/câu, không idiom.
- Phân số luôn có 3 dạng: hình cắt · ký hiệu · lời đọc; không bao giờ chỉ hình.
- Lỗi không trừng phạt: serve sai → ticket nhấp nháy nhẹ + lời gợi ý, slice
  giữ nguyên vị trí, thử lại không giới hạn.
- Không timer, không điểm, không streak. Motivation = stamp "SERVITO" trên
  ticket + recipe book dài thêm.

**Ngôn ngữ UI: tiếng Anh** (spec examples: "Five of eight equal slices are
5/8."). Vẫn bundle subset `vietnamese` cho mọi font (policy repo) — an toàn
cho fork thêm bản dịch.

## 3. Learning interaction principles

1. **Mẫu số là hành động cắt** — chọn 2/3/4/6/8 → đường cắt radial/grid vẽ ra,
   bánh tách nhẹ: denominator được *làm* trước khi được đọc.
2. **Tử số là hành động phục vụ** — kéo/đặt miếng lên đĩa: numerator là số
   miếng phục vụ, đếm được từng miếng một.
3. **Equivalent = cùng diện tích, khác cách cắt** — hai đĩa chồng overlay cho
   thấy 2/4 phủ đúng vùng 4/8; recipe book ghi lại cặp phát hiện.
4. **So sánh = đặt cạnh nhau rồi kết luận** — học sinh tự xây cả hai phân số
   rồi chọn > = <; app không phán xét trước.
5. **Lỗi là thông tin, không trừng phạt** — serve sai → lời nhắc hướng tới
  chi tiết đang sai (số phần cắt / số miếng), giữ nguyên thao tác đã làm.
6. **Mọi thao tác đảo ngược được** — bấm miếng trên đĩa = trả về bánh;
   đổi số phần cắt = bính hợp lại cắt lại; không trạng thái khoá.
7. **Đọc được bằng tai** — mọi phân số/feedback có text-equivalent trong
   live region cho screen reader.

## 4. Color tokens

Editorial bistro palette — tomato / olive / flour / ink, flat, không gradient.

### Neutrals (giấy / mực)

| Token | Hex | Vai trò |
|---|---|---|
| `--flour` | `#F7F0E3` | Nền chính (kem bột mì) |
| `--paper-raised` | `#FDFAF1` | Ticket, surface nổi |
| `--paper-deep` | `#EFE5CF` | Well/recessed (tray, dock) |
| `--ink` | `#221B10` | Text chính, net-line SVG (15:1 trên flour) |
| `--ink-soft` | `#5C5140` | Text phụ (4.9:1 trên flour; chỉ dùng ≥16px) |
| `--line` | `#D8CBAD` | Hairline menu |

### Brand

| Token | Hex | Vai trò |
|---|---|---|
| `--tomato` | `#BE3A26` | Primary CTA, stamp, accent chính (trắng 5.5:1) |
| `--tomato-deep` | `#9E2E1D` | Pressed, tomato text nhỏ trên flour (6.4:1) |
| `--olive` | `#5A6B3B` | Secondary CTA, success (trắng 5.8:1) |
| `--olive-deep` | `#46532C` | Pressed olive |
| `--basil` | `#557F3D` | Lá basil/rosemary trong minh hoạ |
| `--hint` | `#7A5D16` | Nudge/hint text (5.4:1 trên flour) |

### Dish tokens (trong `dishes.json`, không phải UI)

crust `#E8C88F` · sauce `#C1442A` · mozzarella `#FBF3DF` · pastry `#D9A45B` ·
custard `#F2D48F` · berry-red `#C8402E` · berry-ink `#3E4570` ·
focaccia-top `#E2B36A` · dimple `#C99751` · salt `#FFFDF4`.

### Trạng thái (không bao giờ color-only)

- **Servito (đúng)** = `--olive` + icon dấu cộng mép + chữ "Servito!" +
  stamp đỏ trên ticket (stamp là brand, không phải màu trạng thái).
- **Nudge (chưa đúng)** = `--hint` + icon muỗng + lời gợi ý cụ thể
  ("The ticket asks for eighths — cut the tart into 8.").
- **Focus** = vành `--ink` 2px + offset 2px trên mọi surface; không bao giờ bỏ.
- Không đỏ error thuần (tomato là brand CTA, không phải màu "sai").

## 5. Typography

| Vai trò | Font | Weights | Ghi chú |
|---|---|---|---|
| Masthead / display / **phân số lớn** | **Fraunces** (OFL, Undercase Type) | 600, 900, 600-italic | Serif wonk-edgy, rất editorial; subset latin+vietnamese ✓ |
| Body / UI / nút / microcopy | **Source Sans 3** (OFL, Adobe) | 400, 600, 700 | Humanist sans, neutral, dễ đọc; subset latin+vietnamese ✓ |

- Self-host qua `@fontsource/fraunces` + `@fontsource/source-sans-3`; import
  **cả `latin-*` lẫn `vietnamese-*`** cho mọi weight dùng (rule repo sau
  pilot #01 — thiếu latin làm chữ số rơi system font).
- Scale (tablet-first): masthead `clamp(34px, 5vw, 56px)/1.05` Fraunces 900,
  letterspacing 0.01em · section label 13px uppercase 0.14em SS3 700 ·
  tên món Fraunces 600-italic `clamp(20px, 2.6vw, 28px)` · body 17–19/1.5
  SS3 400 · **phân số lớn 40–64px Fraunces 600** (numerals thẳng, slash mảnh)
  · microcopy ≥14 (tablet ≥15).
- Dotted leader giữa tên món và phân số: `border-bottom: 2px dotted --line`.

## 6. Spacing system

Base 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`.
Gutters: 16 (mobile) / 24 (tablet) / 40 (desktop). Khoảng cách giữa 2 touch
target kế tiếp ≥ 8px. Hairline đôi menu = 1px line + 4px gap + 1px line.

## 7. Layout / grid

- Single-page state machine: `board → cut | compare → board · book` (không
  router, đúng spec).
- **Order board** = sảnh: masthead menu (double-rule) → 2 cột (menu sticky
  trái + rail ticket phải; ≥1200px rail 3 cột, 640–1199 2 cột, mobile 1 cột)
  → footer hairline với progress + Reset hai bước ("Clear all stamps?").
  Ticket so le như ghim lên ràng, ticket đã serve có stamp đỏ góc trên phải.
- **Cutting table** = grid 2 cột (tablet: dish trên/tray dưới khi hẹp):
  trái = bánh SVG lớn + partition picker; phải = đĩa khách + fraction
  readout + Serve + feedback. Mini-ticket (request = h3) sticky top trên
  màn hẹp để target luôn nhìn thấy.
- **Compare counter** = 2 trạm cạnh nhau (stack dọc khi hẹp), giữa là
  sign picker (< = >) 3 nút lớn + nút Overlay; sai sign lần đầu → overlay
  tự bật làm scaffold so sánh diện tích.
- **Recipe book** = trang menu: entry kiểu dòng menu "1/2 … 2/4" kèm dish
  mini; empty state có lời mời.
- Content max-width **1240px**; tablet landscape là hero layout.

## 8. Touch-target rules

- Primary CTA (Serve, sign buttons): **≥56px** cao.
- Standard control / partition chip: **≥48×48px**.
- Slice (trên bánh và trên đĩa): hình ≥44px trên tablet + **hit area ≥48px**
  (padding trong suốt); spacing ≥8px.
- Plate là drop zone **phình +12px khi đang kéo** (forgiving target), thêm
  nút "Move to plate"/"Return" cho select-then-move (WCAG 2.2 dragging
  movements — tap-to-move cũng là single-pointer path đầy đủ).
- Không hover-only; hover chỉ enhancement desktop.

## 9. Illustration language

- **100% SVG/CSS code-native** (spec: pizza/tart/focaccia PHẢI SVG gốc, cấm
  raster internet). `DishSvg.vue` là renderer data-driven: đọc `dishes.json`
  (shape, màu, topping list) vẽ net-ink phẳng — mép topping stroke `--ink`
  1.5–2px, fill phẳng, không blur, không gradient.
- Focaccia là **rectangle grid-cut** (2=1×2, 3=1×3, 4=2×2, 6=2×3, 8=2×4):
  phân số trên hình không tròn — mở rộng schema "phân số = phần bằng nhau của
  ANY whole".
- Cut line: nét đứt mực (stroke-dasharray) vẽ theo partition; slice tách
  outward 5–7px dọc trục bisector.
- Icon UI (knife, ticket, book, plate, spoon): inline SVG stroke 2px
  `currentColor`, 24px grid, vẽ trong project.
- **Không raster nào** — kể cả texture: dùng procedural SVG feTurbulence
  data-URI 3% opacity (spec cho phép procedural; loại rủi ro Codex và giữ
  artifact lean). Codex: **không dùng** cho showcase này.

## 10. Feedback states

| Trạng thái | Biểu hiện |
|---|---|
| Press | translateY 2px + solid shadow collapse, 120ms |
| Hover (desktop) | net-line đậm hơn / lift 1px, 140ms |
| Focus-visible | vành ink 2px offset 2px, luôn hiện |
| Slice picked (keyboard) | net-line tomato 2.5px + label "picked" |
| **Servito** | stamp đỏ "SERVITO" scale-in 450ms + ticket settle + live-region "Servito! 5 of 8 equal slices are 5/8." |
| **Nudge** | ticket viền hint + spoon icon + copy cụ thể (partition sai → "cut into eighths"; count sai → "the ticket wants 5 slices, you plated N"); KHÔNG shake, KHÔNG đỏ, KHÔNG xoá slice |
| Progress | "Orders served N/16" trong footer, ink-soft |
| Cut change | cut-line vẽ 260ms + slice tách 300ms, đọc lại "Cut into 8 equal parts" |

Live region `aria-live="polite"` (không assertive) cho mọi feedback;
phân số luôn đọc dạng "N of D equal parts".

## 11. Motion budget

Từ spec (khóa): feedback 120–220ms · spatial 250–500ms · delight ≤900ms ·
không intro chặn input · ease tự nhiên (`power2.out`, `power3.out`;
`back.out(1.5)` CHỈ cho stamp). GSAP wrapper `src/lib/gsap.ts` (register một
lần, cleanup lifecycle Vue qua `onBeforeUnmount`, mọi tween qua wrapper).

- Cut line draw: 260ms power2.out (stroke-dashoffset).
- Slice separation: 300ms power2.out, stagger 18ms, translate 6px.
- Slice drag: `gsap.quickTo` theo pointer (không tween), scale 1.05 khi cầm.
- Drop → plate slot: 320ms power3.out (spatial continuity).
- Serve đúng: stamp scale 1.6→1 + rotate settle `back.out(1.5)` 450ms +
  explanation fade-rise 220ms. Tổng ≤ 900ms.
- Screen change: fade + rise 8px 240ms; KHÔNG FLIP toàn màn.

**prefers-reduced-motion**: wrapper set trạng thái cuối tức thì; giữ
opacity/focus; stamp xuất hiện tĩnh; drag vẫn hoạt động (pointer-follow là
direct manipulation, không phải animation) nhưng không scale/tween phụ.

## 12. Responsive strategy

- **Tablet 768–1199 = hero viewport** (education showcase): cutting table
  2 cột tới ~1024, dưới đó stack dish-above-plate; touch target ≥48px.
- **Desktop ≥1200**: ticket rail 3 cột + menu sticky, dish lớn hơn
  (min(52vh, 520px)); không scale mọi thứ vô nghĩa.
- **Mobile 360–479**: `supported (tap-first)` — single column, tap-to-move là
  đường chính (nút + wedge hit area ≥44px), drag pointer vẫn hoạt động nhưng
  precision thấp trên màn nhỏ; partition chip wrap. Không horizontal scroll;
  đã verify full flow thật ở 390×844.
- Breakpoints: `480 / 640 / 768 / 900 / 1024 / 1200`. Text reflow ổn ở 200% zoom.

## 13. Accessibility constraints

- Semantic HTML trước ARIA; `lang="en"`; landmarks header/main/footer;
  request của order là heading.
- Mọi control là `<button>` thật; slice là `<button>` overlay trên SVG
  (aria-label "Slice 3 of 8 — add to plate"); plate slice: "Slice on plate —
  return to dish".
- **Keyboard path đầy đủ (definition of done)**:
  1. Tab vào bánh → roving focus từng slice (arrow keys).
  2. Enter/Space = đặt miếng lên đĩa (tương đương drag).
  3. Tab vào đĩa → Enter/Space trên miếng = trả về.
  4. Partition chip, Serve, sign, Overlay, Reset đều là button thật.
- Fraction readout là text thật + `aria-label` dạng lời đọc; screen reader
  không phụ thuộc hình.
- Không color-only, không hover-only, không time pressure; error copy
  mô tả cách sửa.
- localStorage: CHỈ list order id đã serve + recipe đã mở (anonymous) +
  nút "New shift" reset.

## 14. Anti-patterns (cấm)

1. Rounded-card soup / card-inside-card — layout là menu hairline, không card.
2. Gradient tím-xanh AI; gradient trang trí bất kỳ.
3. Glassmorphism / neon / 3D / shadow blur mượt — chỉ solid offset 0 3px 0.
4. Dashboard SaaS; leaderboard; fake data table.
5. Emoji làm icon/visual chính.
6. Confetti toàn màn hình (spec: ticket stamp thay thế).
7. Bounce/elastic trang trí; ambient loop; intro chặn input.
8. Hover-dependent interaction; touch target <48px.
9. Hình bánh raster tải từ internet; emoji pizza.
10. Runtime CDN bất kỳ (font/GSAP/ảnh); eval/dynamic execution.
11. Đỏ error trừng phạt / shake / buzz.

## 15. Đối chiếu UI UX Pro Max → giữ / loại

| Skill recommendation | Quyết định |
|---|---|
| Alt text cho mọi meaningful image; error announce bằng live region; contrast ≥4.5 | **GIỮ** (§13; mọi token đã tính ratio) |
| WCAG 2.2 dragging movements: drag phải có single-pointer + keyboard alternative | **GIữ + siết** — tap-to-move là primary, drag là enhancement, select + Move buttons cho keyboard (§8, §13) |
| Touch spacing ≥8px, touch-friendly mobile, targets lớn | **GIỮ** ≥48px (§8) |
| prefers-reduced-motion bắt buộc; gsap.matchMedia / kill loop | **GIỮ** (§11 wrapper) |
| Palette "Digital Signage" navy/đỏ hiệu năng cao; Magazine/Blog dark | **LOẠI** — palette tomato/olive/flour/ink đã khóa trong spec (§4) |
| Font pairing gợi ý Josefin Slab / Ibarra Real Nova (chỉ latin) | **LOẠI** — chọn Fraunces + Source Sans 3 (OFL, latin+vietnamese subsets, editorial hơn) |
| Skeleton shimmer / loader loop pattern | **LOẠI** — không async UI nào chờ >1s; JSON load có error state tĩnh |
| Carousel auto-rotation pattern | **LOẠI** — không carousel |
| "fraction learning visual math manipulative" | không có data trong DB — tự quyết theo spec (no fallback mặc định) |

### 15b. Impeccable pass (trước deploy) — findings & disposition

| Finding (assessment A 33/40 + detector) | Disposition |
|---|---|
| Back-nav phá trạng thái đang cắt; re-cut trả slice không báo; reset một chạm | **FIX** — session store per order (`lib/session.ts`), re-cut announce, reset 2 bước "Clear all stamps?" |
| Focus không chuyển màn; SR không nghe thấy navigation | **FIX** — App watch screen → focus heading (tabindex=-1) |
| Plate slice target ~30px; hứa "Move/Return" control mà không có nút | **FIX** — wedge hit area +10 stroke units + nút "Return last slice" ≥48px |
| Board: cột ticket 210% viewport vs menu 42% (fold sâu trong ticket) | **FIX** — rail 3 cột ≥1200px + menu column sticky + ticket compact |
| Compare: sign sai không scaffold | **FIX** — overlay tự bật sau sign-mismatch + caption hướng dẫn |
| Target fraction trôi khỏi màn khi plating (mobile) | **FIX** — mini-ticket sticky top <900px, request là h3 |
| Peak-end: không có continuation | **FIX** — nút "Next order" sau khi serve |
| Em-dash overuse (11) trong copy hiển thị | **FIX** — giảm xuống ~2 (comments không tính) |
| side-tab: feedback border-left 6px (AI-tell) | **FIX** — hairline 1.5px toàn vòng màu trạng thái + icon + chữ |
| ink-soft ở label 11–13px (vi phạm rule ≥16px của chính DD) | **FIX** — micro-labels chuyển sang --ink |
| Stamp che text ticket; duplicate sr-only; Math.random uid; curly/straight quote trộn; dead anchor id; title bilingual | **FIX** hết |
| cream-palette; Fraunces 41% board (tên món serif); overline tracked-caps; SVG dish "shape-assembled" | **CHẤP NHẬN theo brief** — palette + serif-name + menu-cover overline + SVG dish là thesis đã khóa (§1, §4, §5, §9); overline đã rút ngắn "TRATTORIA ARITMETICA" (20 ký tự) |
| woff+woff2 duplication (fonts 325KB/62% dist) | **CHẤP NHẬN** — 526KB total way under budget; woff2-only đòi custom fontsource CSS |
| monotonous-spacing 4px cut screen | **FIX nhẹ** — station gap sp-4→sp-5, explainer-actions spacing |
