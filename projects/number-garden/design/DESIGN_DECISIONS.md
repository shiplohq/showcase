# DESIGN_DECISIONS — Number Garden (Showcase #01)

> Khóa design system cho showcase #01. Nguồn: spec `.showcase/01_number-garden.md`
> (paper-cut botanical thesis đã khóa) + đối chiếu UI UX Pro Max
> (queries: `education kids learning game elementary math`, `playful organic paper cut craft children`,
> `children touch targets forgiving interaction error feedback`, `rounded friendly playful children display font`,
> `earthy warm terracotta moss green cream garden nature`, domain `gsap`, `ux`).
> Brief thắng recommendation: mọi gợi ý của skill mâu thuẫn paper-cut flat đều bị loại (ghi ở §15).

## 1. Visual thesis

**Paper-cut botanical playground.** Cả app là một tấm collage giấy cắt thủ công:
nền giấy kem ấm có vân giấy rất nhẹ, các lớp cảnh (đồi, luống đất, cây) là mảng
màu phẳng cắt bằng tay với **bóng giấy SolidOffset** (shadow đặc, lệch 2–4px,
không blur — cảm giác hai lớp giấy chồng nhau), không viền bo-card quanh mọi thứ.
Cây cối là vector phẳng organic xây từ leaf/flower parts lặp lại. Số lượng luôn
hiện **cùng lúc bằng chữ số và dot-pattern (ten-frame)** — phần hình ảnh và ký hiệu
không tách rời.

Từ khóa: hand-cut paper · warm cream · moss & apple greens · terracotta soil ·
sunny yellow · flat vector · organic edges · tactile · calm.

## 2. Target age

5–7 tuổi (lớp 1), đang hình thành number sense: đếm 1–1, part–whole trong 10,
cộng/trừ trong 20. Hệ quả thiết kế:

- Copy ≤ 8 từ/câu, tiếng Việt, không chữ nhỏ hơn 16px trên tablet.
- Không yêu cầu đọc trôi chảy — câu hỏi luôn kèm visual (số + dots + hình).
- Không chữ trong ảnh; mọi quantity có text alternative.
- Motivation nội tại (trồng cây nở hoa), không điểm số, không xếp hạng.

**Ngôn ngữ UI: tiếng Việt.** Product concept trong spec viết cho trẻ Việt Nam
("Trồng 5 hạt", "Khu vườn số học"). Number words tiếng Việt dùng cho aria-label.

## 3. Learning interaction principles

1. **Đếm là hành động vật lý** — 1 tap = 1 hạt = 1 bước đếm; numeral + dot pattern
   cập nhật theo từng hạt, không nhảy cóc.
2. **Manipulate trước, symbol sau** — trẻ sắp xếp vật thể trước, chữ số/flashcard sau.
3. **Part–whole luôn nhìn thấy** — two plots + ten-frame; "Why it works" giải thích
   bond bằng cành cây tách nhánh sau mỗi 3 câu.
4. **Lỗi không trừng phạt** — sai bố trí → vật thể về vị trí nhẹ nhàng + highlight
   số lượng cần thiết; không đỏ, không rung, không âm báo lỗi.
5. **Trẻ tự kết luận** — nút "Kiểm tra" lớn do trẻ bấm; không auto-judge khi đang làm.
6. **Mọi thứ đảo ngược được** — bấm hạt đã trồng = trả về túi; không timer, no lose state.
7. **Chấm dứt bằng hình ảnh, không bằng số** — hoàn thành = vườn nở hoa theo số câu
   đúng; không leaderboard, không streak.

## 4. Color tokens

Paper-cut botanical palette — đất ấm, lá xanh, nắng vàng. Flat, no gradient.

### Neutrals (giấy)

| Token | Hex | Vai trò |
|---|---|---|
| `--paper` | `#FAF3E3` | Nền chính (giấy kem ấm) |
| `--paper-raised` | `#FFFBEF` | Bề mặt nổi (chip, banner) |
| `--paper-deep` | `#F0E3C6` | Well/dock/tr recessed |
| `--ink` | `#3D3425` | Text chính, chi tiết cắt giấy (contrast ~11:1 trên paper) |
| `--ink-soft` | `#6E5F47` | Text phụ (chỉ ≥18px bold / ≥24px thường) |
| `--line` | `#DCCB9F` | Hairline, đường kẻ giấy |

### Greens (lá)

| Token | Hex | Vai trò |
|---|---|---|
| `--leaf` | `#4E7A3A` | Green chính — buttons confirm, leaf (white text 5.0:1) |
| `--leaf-deep` | `#37582A` | Pressed/dark green, focus halo đậm |
| `--apple` | `#7FA84B` | Fill lá cây, đồi |
| `--sprout` | `#9DC36B` | Mầm non, dot-pattern |
| `--moss` | `#6B7F3F` | Lớp đồi sau |

### Soil & warm

| Token | Hex | Vai trò |
|---|---|---|
| `--soil` | `#9C6B44` | Đất luống |
| `--soil-deep` | `#7A4E30` | Đất bóng/lỗ trồng |
| `--terra` | `#C96F4A` | Accent terracotta — chậu, marker, nudge (không dùng làm màu "sai") |
| `--sun` | `#F2B33D` | Nắng vàng — primary CTA (text ink trên sun ~6.3:1) |
| `--sun-deep` | `#D99A26` | Pressed CTA |
| `--petal` | `#E98FA4` | Hoa hồng — reward |
| `--petal-deep` | `#D06A85` | Hoa đậm |
| `--sky` | `#E7EFD4` | Bầu trời sage nhạt trong scene |

### Trạng thái (không bao giờ color-only)

- **Correct** = `--leaf` + icon mầm + text. **Nudge** = `--terra` + icon lá ngả +
  text gợi ý. **Focus** = vành `--ink` 2px + gap giấy 2px (nhìn rõ trên mọi surface).
- Không dùng đỏ thuần; "sai" không tồn tại như một màu.

## 5. Typography

| Vai trò | Font | Weights | Ghi chú |
|---|---|---|---|
| Display / câu hỏi / **chữ số** | **Baloo 2** (OFL, Ek Type) | 600–800 | Rounded đậm, numerals rất rõ; subset `vietnamese` ✓ |
| Body / UI / microcopy | **Nunito** (OFL) | 400–800 | Rounded terminals, dễ đọc; subset `vietnamese` ✓ |

- Self-host qua `@fontsource/baloo-2` + `@fontsource/nunito` (bundle vào build —
  **không Google Fonts runtime**, đúng font policy của repo).
- Scale (tablet-first): question `clamp(26px, 4vw, 40px)/1.15` Baloo 700 ·
  section 28–32 Baloo 700 · body 17–19/1.5 Nunito 600 · numerals lớn 44–72 Baloo 800
  (tabular padding) · microcopy ≥14 (tablet ≥16).
- Letter-spacing 0 cho display; numerals dùng `font-variant-numeric: tabular-nums`.

## 6. Spacing system

Base 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80`.
Gutters trong screen: 16 (mobile) / 24 (tablet) / 32 (desktop).
Khoảng cách touch giữa 2 target kế tiếp ≥ 8px (skill: Touch Spacing — Medium).

## 7. Layout / grid

- App = 1 stage full-viewport, CSS grid rows: `[header · garden · dock]` —
  garden chiếm ~70% (spec), dock công cụ thấp ở đáy, question banner trên cùng.
- Content max-width **1200px** desktop; tablet portrait là hero layout.
- **Lesson select = 4 luống cây** (garden beds) xếp ngang từng hàng full-width —
  mỗi luống một unit với cây đặc trưng; KHÔNG grid card đều tăm tắp.
- Play screen: plots là mảng đất organic (border-radius bất đối xứng kiểu
  `48% 52% 45% 55% / …`), tray + check ở dock.
- Overlay screens (Why-it-works, End) là lớp giấy phủ toàn màn, tôn trọng ESC/back.

## 8. Touch-target rules

- Primary CTA (Kiểm tra, túi hạt): **≥64px** cao, full-width ở dock trên hẹp.
- Standard control: **≥48×48px** (vượt khuyến nghị 44px của skill vì đối tượng 5–7).
- Seed: hình ≥40px nhưng **hit area ≥48px** (padding trong suốt).
- Spacing ≥8px; drop zones **phình to khi đang kéo** (+24px), snap radius 48px —
  forgiving targets (spec: forgiving drag targets).
- Không có interaction nào phụ thuộc hover; hover chỉ là enhancement desktop.

## 9. Illustration language

- **SVG/CSS code-native là mặc định** (spec: "Tạo SVG nguyên bản cho illustration chính").
  Hạt, mầm 3 stage, hoa, bond tree, mây, nắng, túi hạt — tất cả inline SVG xây từ
  leaf/petal primitives dùng chung.
- Bóng: **solid offset paper shadow** (`0 3px 0` cùng-hue-darker / alpha ink 10–14%),
  không blur, không double-shadow plastic.
- Organic edges: border-radius bất đối xứng; đường cắt giấy là cạnh shape, không viền.
- **Paper grain**: overlay texture 3–5% opacity trên toàn app — 1 asset raster
  duy nhất qua Codex (tileable paper texture, xem `IMAGE_BRIEF.md`); nếu không đạt
  chất lượng → fallback procedural (SVG feTurbulence), texture là enhancement chứ
  không phải dependency của layout.
- Màu illustration khóa theo tokens §4; mỗi plant species dùng đúng 1 accent + greens.

## 10. Feedback states

| Trạng thái | Biểu hiện |
|---|---|
| Press | scale 0.97 + paper shadow collapse, 120ms |
| Hover (desktop) | lift 2px, 160ms |
| Focus-visible | vành ink 2px + gap giấy, không bao giờ remove |
| **Correct** | mầm mọc 3 stage ~700ms + petal burst nhỏ + live-region "Đúng rồi!…" |
| **Nudge (sai)** | nhóm hạt ngả nhẹ 2–3°, plot highlight dot-pattern thiếu, copy "Đếm lại nhé!" — KHÔNG đỏ, KHÔNG shake-x, KHÔNG âm lỗi |
| Progress | 10 lá pip trên header; mỗi câu đúng 1 lá xanh |
| Counting | mỗi hạt vào plot → numeral + ten-frame tick-up 120ms + click âm nhẹ |

Live region `aria-live="polite"` cho mọi feedback; copy feedback ngắn, miêu tả
số lượng ("Đúng rồi! 6 và 4 là 10").

## 11. Motion budget

Từ spec (khóa): feedback 120–220ms · spatial 250–500ms · delight/reveal ≤900ms ·
không intro khóa thao tác · ease tự nhiên (`power2.out`, `expo.out`; `back.out(1.4)`
CHỈ cho grow/pop reward) · **không bounce/elastic trang trí**.

Chỉ định GSAP:
- seed → plot: tween arc (y + scale) 280–350ms expo.out (spatial continuity).
- group re-layout / tách nhóm: **FLIP** (gsap Flip plugin) 350–450ms.
- seed → sprout → flower reward: 3 stage ~700ms, growth ease `back.out(1.4)` scale
  + opacity, staggered khi nhiều cây.
- sai → trả về: tween về vị trí 300ms power2.out, không rung.
- end screen bloom: stagger 40ms/cây, mỗi cây ≤900ms.

**prefers-reduced-motion**: mọi tween qua wrapper → reduced mode set trạng thái
cuối tức thì; chỉ giữ opacity/focus cues; không ambient loop; app vẫn chơi được
100%. (gsap.matchMedia theo khuyến nghị skill.)

## 12. Responsive strategy

- **Tablet 768–1199 = hero viewport** (spec: educational → ưu tiên tablet): 2 plots
  cạnh nhau, dock dưới, question banner trên. Thiết kế tablet TRƯỚC.
- **Desktop ≥1200**: thêm không khí (scene rộng hơn, max-width 1200), không scale
  mọi thứ to lên vô nghĩa.
- **Mobile 360–479**: `limited` — layout stack dọc (plots xếp chồng), tap-primary
  interaction vẫn đầy đủ; drag precision giảm → note trong metadata. Test thật ở
  390×844 trước khi quyết screenshots.mobile. Không thu nhỏ touch target dưới 48.
- Breakpoints: `360 / 480 / 768 / 1024 / 1200`. Không horizontal scroll ở mọi breakpoint.

## 13. Accessibility constraints

- Semantic HTML trước ARIA; `lang="vi"`; landmarks header/main; question là heading.
- Mọi control là `<button>` thật; plots có aria-label ("Ô đất A: 6 hạt");
  seed group có text alternative ("nhóm 6 hạt"); ten-frame có mô tả sr-only.
- **Keyboard path đầy đủ (definition of done)**:
  1. Tab tới plot/tray → roving focus.
  2. Stepper `+1 / −1` trên mỗi plot (cũng hiện trên touch — nút thật cho trẻ).
  3. Chế độ "cầm": Enter trên nhóm = nhặt → Tab tới đích → Enter = đặt; Esc = trả.
  → không bắt keyboard user mô phỏng kéo pixel.
- Focus-visible luôn hiện; không trap; ESC đóng overlay.
- Live region polite cho count/feedback; không aria-live="assertive".
- Không color-only; không hover-only; không time pressure.
- Audio (WebAudio, không asset file): mặc định TẮT, nút mute luôn hiển thị;
  âm thanh chỉ là reinforcement — mọi thông tin có ở visual.
- localStorage chỉ progress ẩn danh (unit hoàn thành, sao, mute pref) + nút reset.

## 14. Anti-patterns (cấm)

1. Claymorphism / soft-3D / bóng nhựa double-shadow / glassmorphism / neon —
   recommendation mặc định của skill cho kids app, **bị loại** vì phá paper-cut.
2. Gradient tím–xanh AI; gradient trang trí nói chung.
3. Card-inside-card soup; dashboard SaaS; lesson-select dạng card grid đều nhau.
4. Emoji làm icon/visual chính.
5. Leaderboard, streak, điểm số, time pressure, buzz dự phòng.
6. Feedback đỏ/x rung trừng phạt.
7. Bounce/elastic vì GSAP có; ambient loop vô hạn; intro chặn input.
8. Hover-dependent interaction; touch target <48px; text <16px quan trọng trên tablet.
9. Text nhúng trong ảnh; icon UI làm bằng raster.
10. Runtime CDN (font, GSAP, ảnh) — mọi thứ bundle.

## 15. Đối chiếu UI UX Pro Max → giữ / loại

| Skill recommendation | Quyết định |
|---|---|
| Kids learning → Claymorphism + vibrant block-based | **LOẠI** — 3D/plastic mâu thuẫn paper-cut flat (§14.1) |
| Fredoka+Nunito / Baloo 2 pairings, rounded display + Nunito body | **GIỮ** → Baloo 2 + Nunito (OFL, Vietnamese ✓) |
| Touch ≥44px, spacing ≥8px, touch-friendly mobile | **GIỮ + siết** ≥48px (đối tượng 5–7) |
| Error feedback rõ gần vấn đề + recovery path | **GIỮ** — nudge quantity-highlight + copy hướng dẫn (§10) |
| prefers-reduced-motion bắt buộc (severity High), gsap.matchMedia | **GIỮ** (§11) |
| Animate 1–2 key elements/view; motion tokens dùng chung | **GIỮ** (§11 budget) |
| Stagger nhỏ (0.02–0.04s), expo/power out, back.out chỉ cho delight | **GIỮ** |
| Bright primary/candy palette | **LOẠI** — khóa palette đất ấm paper-cut (§4) |
| Trust/social-proof landing patterns | **LOẠI** — đây là game, không phải landing |
| Organic Biophilic (nature, greens, earthy) | **GIỮ** — trùng hướng thesis |
