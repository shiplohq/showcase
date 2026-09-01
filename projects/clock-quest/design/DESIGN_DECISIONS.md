# DESIGN_DECISIONS — Clock Quest (Showcase #05)

> Khóa design system cho showcase #05. Nguồn: spec `.showcase/05_clock-quest.md`
> (visual thesis **travel journal + nautical map** đã khóa) + đối chiếu UI UX Pro Max
> (queries: `education kids learning game elementary telling time clock`,
> `nautical map travel journal paper texture vintage illustration style`,
> `friendly readable typography children 7-9 not childish serif slab`,
> `drag interaction touch targets forgiving error feedback children`,
> `gsap rotation draggable snap timeline scene transition`,
> `gamification education progress no leaderboard intrinsic motivation children`,
> `prefers reduced-motion accessible animation gsap matchMedia`,
> `navy seafoam cream parchment warm palette map illustration`).
> Brief thắng recommendation: mọi gợi ý của skill mâu thuẫn journal/flat-ink đều bị loại (§15).
> Huashu **không invoke** — art direction đã khóa trong brief (spec cho phép bỏ).

## 1. Visual thesis

**Travel journal + nautical chart.** Cả app là một trang nhật ký hải trình trải trên
giấy parchment: biển seafoam phẳng với các nét sóng khắc mảnh, đảo là mảng giấy
landmass viền **contour line navy** (2 vòng đếm độ cao), đường phà **nét đứt navy**
nối 5 trạm, compass rose + tem bưu điện vuông răng cưa làm phần thưởng. UI thật
sạch trên nền đó: mission card là một trang nhật ký có gáy lề đỏ, clock là đồng hồ
nhà ga mặt parchment viền brass. Không card-in-card, không shadow mờ — bóng duy nhất
là **offset print shadow** (2px đặc, same-hue) như dấu mực.

Từ khóa: parchment · navy ink contour · seafoam · buoy red · brass · dashed route ·
postage stamp · compass · timetable board · flat print.

Phân biệt với #01 (paper-cut botanical): #01 là collage giấy cắt organic-tròn, ấm đất;
#05 là **bản khắc hải đồ** — line-art mảnh, đối xứng trục, accent đỏ phao, không bóng
giấy chồng lớp.

## 2. Target age

6–9 tuổi, học giờ đúng / giờ rưỡu / quarter-hour, nối analog ↔ digital. Hệ quả:

- Copy tiếng Anh, ≤ 12 từ/câu, khôngidiom; mọi giờ viết dạng "quarter past two"
  đi kèm digital "2:15" — chữ và số luôn song song.
- Đọc chưa trôi chảy: prompt luôn kèm visual (đồng hồ + bảng giờ) — không câu hỏi
  thuần text.
- Không time pressure, không điểm số, không streak; phần thưởng = tem hộ chiếu
  (intrinsic: sưu tầm tem).
- **Ngôn ngữ UI: English** — spec cho example tiếng Anh ("Minute hand points to 6
  at half past."), aria-label tiếng Anh theo cùng nội dung.

## 3. Learning interaction principles

1. **Hai kim là hai vật thể riêng biệt** — kéo phút → giờ đi theo tỉ lệ thật
   (1 phút = 6° phút, 0.5° giờ); kéo giờ → snap nguyên giờ. Trẻ cảm nhận quan hệ
   hai kim bằng tay, không chỉ bằng mắt.
2. **Analog ↔ digital luôn cạnh nhau** — mọi thay đổi kim cập nhật readout digital
   ngay dưới mặt số (và ngược lại khi đọc bảng giờ).
3. **Hint là phép đo, không phải đáp án** — hint vẽ cung arcade từ 12 đến vị trí
   kim phút hiện tại + nhãn đếm 5-10-15…, trẻ tự đếm tiếp tới đích (spec: hint
   animate cung góc, không đưa đáp án).
4. **Lỗi không trừng phạt** — sai giờ → phà/kim "chưa tới trạm" copy thân thiện +
   hint gợi ý; không đỏ lỗi, không shake, không mất lượt.
5. **Bảng giờ là bài đọc thật** — timetable board dạng nhà ga (hàng: giờ · điểm đến),
   nhiệm vụ đọc = chọn đúng hàng; sai → hàng đó nhấp nháy nhịp nhàng amber rồi mở lại.
6. **Day recap: pick-up → pin** — chạm thẻ để "cầm" (aria-pressed), chạm slot để
   ghim; thẻ ghim đúng khoá lại, ghim sai nhẹ nhàng trở về khay. *Điều chỉnh so
   với spec "kéo":* tap-to-place được chọn sau khi cân nhắc — forgiving hơn cho
   6–9 tuổi trên mọi input, và là con đường keyboard tự nhiên (thẻ = button,
   slot = button). Drag vẫn có thể thêm sau; quyết định ghi ở đây làm bằng chứng.
7. **Kết thúc bằng nhật ký** — hoàn thành 5 trạm = trang nhật ký đầy tem + dòng
   tóm tắt ngày của chính trẻ (dùng kết quả recap), không leaderboard.

## 4. Color tokens

Nautical journal palette — flat, no gradient (trừ ánh sáng day-phase là tint đồng
thức, xem §11).

### Neutrals (giấy & mực)

| Token | Hex | Vai trò |
|---|---|---|
| `--paper` | `#F5EEDC` | Nền chính (parchment) |
| `--paper-raised` | `#FBF6E9` | Mission card, bảng giờ (trang nhật ký) |
| `--paper-deep` | `#EAE0C4` | Rãnh/khay thẻ, slot recap recessed |
| `--ink` | `#22374E` | Text chính + mọi nét khắc (contrast 10.4:1 trên paper) |
| `--ink-soft` | `#51677F` | Text phụ (≥18px bold / ≥24px thường) |
| `--line` | `#D5C7A1` | Hairline giấy, viền tem nhạt |
| `--brass` | `#B98A2E` | Viền đồng hồ, kim cap, compass; pressed `--brass-deep #9A6F1F` |

### Sea & land (scene)

| Token | Hex | Vai trò |
|---|---|---|
| `--sea` | `#C7DAD5` | Biển seafoam phẳng — giá trị dawn; GSAP tween theo phase (map.js `PHASES`) |
| `--wave` | `#A6C6C0` | Nét sóng khắc (pattern `wavepat`) |
| `--land` | `#EFE5C3` | Landmass đảo (tween theo phase) |
| `--ink-soft` | `#4A5E75` | Text phụ — tối lại từ #51677F để ≥4.5:1 cả trên `--paper-deep` (audit) |

### Accent & trạng thái (không bao giờ color-only)

| Token | Hex | Vai trò |
|---|---|---|
| `--buoy` | `#BF4A32` | Đỏ phao — CTA chính (text trắng 4.9:1), tem, cờ marker; KHÔNG dùng làm màu "sai" |
| `--buoy-deep` | `#9E3A26` | Pressed CTA |
| `--signal` | `#2E6E5E` | Correct/arrival — teal signal + icon anchor + text (5.55:1 trên paper-raised) |
| `--amber` | `#8F5A15` | Nudge/hint — amber + compass icon + text (4.98:1 trên paper; giá trị đầu #A66A1C chỉ đạt 3.86:1 — audit contrast bắt, đã tối lại) |

- **Correct** = `--signal` teal + icon + copy. **Nudge** = `--amber` + icon + copy gợi ý.
  **Focus** = ring `--ink` 2px + 2px paper gap. Không đỏ lỗi; đỏ phao chỉ là brand accent.
- Màu trạng thái luôn kèm shape (icon tem/la bàn) + text — không color-only.

## 5. Typography

| Vai trò | Font | Weights | Ghi chú |
|---|---|---|---|
| Display / prompt / **numerals clock + bảng giờ** | **Hepta Slab** (OFL, Mike LaGattuta) | 700–800 | Slab nautical journal, numerals đậm rất rõ; latin subset |
| Body / UI / microcopy / digital readout | **Lexend** (OFL, Bonny / Type-Network) | 400–700 | Thiết kế riêng cho early readers; latin subset |

- Self-host **woff2 commit trong `fonts/`** + `@font-face` `font-display: swap` —
  không runtime CDN, không Google Fonts request (no-build project, font policy cách 2).
- UI 100% tiếng Anh (không dấu) → subset `latin` là đủ; fallback stack:
  Hepta Slab → `Georgia, 'Times New Roman', serif`; Lexend →
  `'Trebuchet MS', Verdana, system-ui, sans-serif`. Nếu sau này thêm chuỗi tiếng Việt
  phải bổ sung subset `vietnamese` + chạy `check:fonts` (bài học pilot #01).
- Scale (tablet-first): prompt `clamp(22px, 3.4vw, 32px)/1.25` Hepta 700 ·
  heading app 30–40 Hepta 800 · body 17–19/1.5 Lexend 500 · clock numerals 34–40
  Hepta 700 (tabular) · digital readout 28–34 Hepta 800 · microcopy ≥15 (tablet ≥16).
- `font-variant-numeric: tabular-nums` cho mọi số giờ; letter-spacing 0 display.

## 6. Spacing system

Base 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80`.
Gutters: 16 (mobile) / 24 (tablet) / 40 (desktop). Khoảng cách giữa 2 control
kề nhau ≥ 8px (skill: Touch Spacing — Medium). Mission card padding 20–28.

## 7. Layout / grid

- App = 1 stage full-viewport: header journal band (title + passport strip + reset)
  cao ~72px; dưới là **2 cột desktop** (map trái ~58%, mission/journal panel phải ~42%);
  **tablet portrait = map trên (~55vh) + mission panel dưới** (hero viewport);
  mobile = map co + panel thành section cuộn dưới (limited, xem §12).
- Content max-width **1240px** desktop; map SVG `viewBox="0 0 1000 700"`
  `preserveAspectRatio="xMidYMid meet"`.
- Quest mở như **overlay ticket** giữa stage (max-width 640, dialog thật, ESC đóng,
  không mất tiến độ mission); map vẫn thấy quanh viền trên desktop.
- Lesson select = chính map: 5 marker trạm trên route — KHÔNG grid card. Marker
  trạng thái: next (ring pulse nhẹ + cờ), done (tem dấu ink), locked (đenet đứt,
  vẫn xem tên).
- Timetable board = bảng nhà ga: hàng giả gỗ giấy `--paper-raised`, mỗi hàng là
  button full-width (giờ Hepta 700 + điểm đến Lexend).
- Day recap = timeline ngang 3 slot (Morning / Midday / Evening) với khay thẻ
  activities phía dưới; slot recessed `--paper-deep`.

## 8. Touch-target rules

- Primary CTA (Check / board the boat): cao **≥56px**, full-width trong panel hẹp.
- Standard control + marker trạm + hàng bảng giờ: **≥48×48px** (siết hơn 44 vì 6–9 tuổi).
- Kim giờ/kim phút: vùng drag = cả mặt số (pointer event bắt trên clock face, không
  chỉ trên line mảnh) — hit radius 48 quanh tâm; kim đang chọn phình đầu +2px.
- Steppers − / +: 56×56. Spacing ≥8px. Slot recap phình +12px khi đang kéo thẻ.
- Không interaction nào phụ thuộc hover; hover chỉ enhancement desktop.

## 9. Illustration language

- **100% SVG code-native** trong `js/` (map, 5 scene trạm, clock, tem, compass,
  activity icons) — không raster, không emoji (spec: SVG nguyên bản; icons =
  SVG không dùng raster generation).
- Ngôn ngữ nét: **line-art khắc 2–3px** màu `--ink`, fill phẳng tối đa 3 màu/
  object, contour đôi cho landmass, nét đứt cho route; chữ trong ảnh = KHÔNG
  (riêng mặt clock là SVG text thật — accessible, không phải ảnh).
- Tem postage: khung răng cưa (dashed stamp border) + icon trạm + giá "9Ꞓ"…
  đậm chất sưu tầm.
- Compass rose góc map, bán kính ~70, đôi nét navy + brass — decorative, `aria-hidden`.
- Day-phase: dải trời trên map + scene tint bằng fill SVG đổi màu qua GSAP (§11).
- Bóng in: `0 2px 0 rgba(34,55,78,.14)` — offset đặc, không blur, không multi-layer.
- **Không Codex raster** cho project này: mọi texture cần (vân giấy) làm bằng
  SVG `feTurbulence` opacity 3% hoặc bỏ — texture là enhancement không phải
  dependency (quyết định ghi rõ ở HANDOFF; `design/generated-manifest.json`
  không cần vì không asset nào sinh ra).

## 10. Feedback states

| Trạng thái | Biểu hiện |
|---|---|
| Press | scale 0.97 + offset shadow collapse, 120ms |
| Hover (desktop) | marker ring +2px, 160ms — enhancement only |
| Focus-visible | ring ink 2px + paper gap 2px, không bao giờ bỏ |
| Đang kéo kim | kim phình nhẹ (stroke +2), digital readout live, tick sound off mặc định |
| **Arrival (đúng giờ)** | tem đáp xuống hộ chiếu (scale 1.5→1, rotate −8°, ~450ms) + copy "Right on time!" teal + live-region |
| **Nudge (chưa đúng)** | cung amber mảnh từ vị trí kim về phía target + copy "Not yet — the minute hand has a little way to go." — KHÔNG đỏ, KHÔNG shake |
| Hint (trẻ bấm) | cung đo từ 12 đến kim hiện tại + nhãn 5·10·15… vẽ ~600ms rồi mờ |
| Board pick sai | hàng bảng **nhấp nháy amber 2 nhịp** (blink `row-blink`, không shake) + copy cụ thể "leaves at …" ngay tại hàng, mở lại ngay |
| Progress | passport strip: 1 tem/trạm; journey bar nói theo **số trạm** ("2 of 5 stops") — đơn vị của trẻ; aria-label giữ chi tiết mission |

Live region `aria-live="polite"` cho mọi feedback; copy mô tả thời gian
("Right on time! The clock shows 9:00.").

## 11. Motion budget

Từ spec (khóa): feedback 120–220ms · spatial 250–500ms · delight ≤900ms ·
intro không khóa thao tác · ease tự nhiên (`power1.inOut`, `power2.out`;
`back.out(1.2)` CHỈ cho tem đáp xuống) · không bounce/elastic trang trí.

Chỉ định GSAP (register một lần trong `js/motion.js`, plugin chỉ load cái dùng:
Draggable + MotionPathPlugin):

- Kim sau khi thả/tick stepper: `gsap.to` rotation snap 160–200ms `power2.out` (feedback).
- Hint arc: draw arc + fade label ≤650ms, chạy đúng 1 lần/lần bấm (delight).
- Phà sang trạm kế: MotionPathPlugin dọc route 420–500ms `power1.inOut` (spatial).
- Day-phase tint: `gsap.to` fill 350–400ms (spatial, màu đồng thức).
- Tem đáp: 450ms `back.out(1.2)` + ink settle (delight).
- Đóng/mở overlay: fade+rise 200ms vào / 150ms ra.

**prefers-reduced-motion**: `gsap.matchMedia()` một nơi — reduced mode: mọi tween
thành state change tức thì, chỉ giữ fade ≤150ms; phà nhảy đến trạm (không travel);
hint hiển thị cung tĩnh; tem hiện luôn. App chơi 100% (pilot pattern).

## 12. Responsive strategy

- **Tablet 768–1199 = hero viewport** (spec: educational): map ~55vh trên,
  mission panel dưới, mọi control ≥48px, không hover. Thiết kế tablet TRƯỚC.
- **Desktop ≥1200**: 2 cột (map + journal panel), map lớn hơn, whitespace tăng,
  overlay ticket giữa stage; line-length prompt ≤ 48ch.
- **Mobile 360–479**: `limited` — map co còn scroll được, panel thành section
  cuộn dọc, clock 260px, steppers là input chính (drag precision thấp hơn),
  recap chuyển tap-to-place. Test thật 390×844; nếu đạt mới chụp mobile.webp.
- Breakpoints: `480 / 768 / 1024 / 1200`; 200% zoom = reflow dọc không horizontal
  scroll (grid 2 cột → 1 cột).
- Overlay ticket max-height 92vh scroll bên trong.

## 13. Accessibility constraints

- Semantic HTML trước ARIA; `lang="en"`; landmarks header/main; prompt là heading;
  overlay = `role="dialog"` + focus trap + ESC.
- Clock là `role="group"` `aria-label` mô tả ("Analog clock showing 9:00…");
  digital readout là text thật; bảng giờ là `<button>` hàng với aria-label
  "Train to Gullwing Cape, 2:45 PM".
- **Keyboard path đầy đủ (definition of done)** cho kéo kim:
  1. Segmented control chọn kim **Hour / Minute** (radio thật).
  2. Steppers **− / +** bước theo snap (giờ ±1h, phút ±snapMinutes).
  3. Arrow Up/Right = +, Down/Left = − khi focus trong vùng clock.
  → keyboard user không phải mô phỏng kéo pixel.
- Recap keyboard: focus thẻ → Left/Right chuyển slot đích (aria-live báo tên
  slot) → Enter đặt; Backspace rút thẻ ra.
- Focus-visible luôn hiện; không trap ngoài overlay; ESC luôn thoát overlay.
- Live region polite; không assertive. Không motion-only meaning (đúng/sai luôn
  có text). Không color-only. Không time pressure.
- localStorage chỉ progress ẩn danh (trạm đã xong, mute) + nút Reset hiển thị.

## 14. Anti-patterns (cấm)

1. Claymorphism / 3D / glassmorphism / neon / bóng mờ multi-layer — recommendation
   mặc định của skill cho kids app, **bị loại** vì phá line-art print.
2. Gradient tím–xanh AI; gradient trang trí (day-phase tint là fill đổi, không gradient).
3. Card-inside-card soup; dashboard SaaS; lesson grid card đều tăm tắp (map là menu).
4. Emoji làm icon/visual chính; icon UI làm bằng raster.
5. Leaderboard, điểm, streak, timer, buzz.
6. Feedback đỏ/x rung trừng phạt; nudge đỏ.
7. Bounce/elastic trang trí; ambient loop vô hạn; intro khóa input.
8. Hover-dependent; touch target <48px; text quan trọng <16px tablet.
9. Text nhúng ảnh; bảng giờ là ảnh (phải là DOM thật).
10. Runtime CDN (font/GSAP/ảnh); absolute path `/assets/...` (dùng relative).

## 15. Đối chiếu UI UX Pro Max → giữ / loại

| Skill recommendation | Quyết định |
|---|---|
| Kids learning → Claymorphism + vibrant block-based | **LOẠI** — 3D/plastic mâu thuẫn journal line-art (§14.1) |
| Storytelling-Driven pattern (educational app) | **GIỮ** — narrative voyage 5 trạm, tem hộ chiếu |
| Trust/social-proof landing patterns | **LOẠI** — đây là game, không phải landing |
| Hepta Slab / Montagu Slab (slab serif, display, latin) | **GIỮ** → Hepta Slab display + numerals |
| Touch ≥44px, spacing ≥8px | **GIỮ + siết** ≥48px (đối tượng 6–9) |
| Error feedback rõ gần vấn đề (severity High) | **GIỮ** — nudge amber tại chỗ + recovery path (§10) |
| Reduced motion bắt buộc (severity High), gsap.matchMedia | **GIỮ** (§11) |
| Animate 1–2 key elements/view | **GIỮ** — mỗi view 1 motion chủ đạo (kim / phà / tem) |
| Page transition 200–300ms power1.inOut, exit nhanh hơn vào | **GIỮ** — overlay 150/200ms |
| Haptic navigator.vibrate | **LOẠI** — không cần, child-facing giữ đơn giản |
| Palette "warm ink + amber on cream" (notes app) | **GIỮ một phần** — tham chiếu contrast; khóa nautical palette riêng (§4) |
| E-Ink/Paper style no-motion | **LOẠI phần cứng** — giữ paper texture cảm giác, giữ motion budget của spec |

## 16. Content model khóa (JSON contract theo spec)

- `data/lessons.json` — progression: 5 stops × missions
  `{id, mode: set-clock|read-schedule|day-recap, targetTime, snapMinutes,
  toleranceMinutes, prompt, hint, options?}` (đúng contract spec
  `{"id":"ferry-0730","targetTime":"07:30","mode":"set-clock","snapMinutes":5,"hint":…}`).
- `data/schedule.json` — places (tên, icon, toạ độ map), timetable entries
  (places·times·event labels·icons), recap activities (label·time·icon·slot).
- Engine validate schema ở dev-time (`scripts/engine-sim.mjs` chạy toàn bộ mission
  headless qua cùng engine UI dùng); runtime fetch fail → error screen rõ + retry,
  không trắng trang.
