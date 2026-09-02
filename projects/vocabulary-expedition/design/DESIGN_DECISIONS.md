# DESIGN_DECISIONS — Vocabulary Expedition (Showcase #07)

> Khóa design system cho showcase #07. Nguồn: spec `.showcase/07_vocabulary-expedition.md`
> (visual thesis đã khóa: children's editorial illustration — gouache số hoá, viền mềm,
> background nhiều khoảng thở, label như museum caption, KHÔNG flashcard grid làm màn chính)
> + đối chiếu UI UX Pro Max (queries: `children illustration editorial picture book gouache`,
> `early reader typography dyslexia friendly large text`, `word image matching drag drop kids education`,
> `scene exploration hidden object kids game UX`, `forgiving error feedback kids non punitive touch target 48px`,
> `gsap flip plugin shared element transition`, `rounded friendly children display font vietnamese subset`,
> `humanist sans body font children readability vietnamese`, `museum label caption typography`).
> Brief thắng recommendation: mọi gợi ý của skill mâu thuẫn gouache editorial đều bị loại (§15).

## 1. Visual thesis

**Naturalist's field journal — "expedition" theo đúng nghĩa chữ.** App là một cuốn
sổ thực địa của đoàn thám hiểm nhí: mỗi unit là một **mảng tranh gouache** (scene plate)
vẽ trên nền giấy kem ngả nắng, viền tranh mềm mại hơi không đều như nét cọ; từ vựng
hiện diện dưới dạng **tấm caption bảo tàng** (museum plate) — nền kem sáng, góc bo
một bên, chấm ghim — ghim cạnh vật thể trong tranh. World map là **bản đồ hành trình**
với đường chân mũi tên chấm gạch nối 6 trạm, không phải grid card. Nền trang nhiều
khoảng thở (canvas trống ≥ 35% ở desktop), texture giấy procedural rất nhẹ (SVG
feTurbulence ~3–4%, không dùng raster). Viền mềm + mảng gouache phẳng + caption plate
= ba tín hiệu nhận diện không trùng showcase nào đã ship.

Từ khóa: gouache storybook · sunlit cream · sepia ink · meadow & lake · museum caption ·
field-journal · soft painted edges · breathing space · calm expedition.

## 2. Target users

Trẻ **6–10 tuổi học English Pre-A1/A1** (Vietnamese-speaking learners). Hệ quả:

- **UI copy tiếng Anh đơn giản** (product là English-learning); bản dịch tiếng Việt là
  *layer hỗ trợ* đi kèm từ/câu, **tắt được** (acceptance: translation layer toggle).
- Câu lệnh ≤ 10 từ, từ học có phonetic respelling đơn giản (`/ˈket.l/`) thay vì audio
  TTS (acceptance: không phụ thuộc TTS online); mọi caption có kèm translation.
- Chữ đọc chính ≥ 17px (tablet ≥ 19px); từ học hiển thị HUGE (≥ 28px) lowercase-first.
- Không time pressure, không điểm số/sao/leaderboard; phần thưởng = **sticker plate**
  vào scrapbook + stamp lên bản đồ.
- Lỗi không trừng phạt: nhầm → gợi ý gần hơn, không đỏ, không buzz.

## 3. Learning interaction principles

1. **Scene trước, từ sau** — trẻ nhìn toàn cảnh gouache trước (Look around), từ vựng
   nảy sinh từ vật thể trẻ chạm, không phải từ danh sách.
2. **Clue là ngôn ngữ thật** — clue dùng câu tiếng Anh ngắn gợi ý chức năng
   ("It boils water for tea") — nghe/đọc hiểu thay vì dịch máy.
3. **Gắn nhãn là hành vi bảo tàng** — đúng từ → label thành annotation cố định trên
   tranh (kết quả học nằm trong tranh, không trong score).
4. **Từ được dùng ngay** — mỗi scene kết thúc bằng 3 câu ngắn child-composed
   (magnetic words), dịch kèm để phụ huynh cùng đọc.
5. **Lỗi = cơ hội nhìn lại** — sai object → plate ấm "Look again!" + sau 2 lần nhầm
   vùng tìm được sáng dần (soft spotlight); không bao giờ khóa.
6. **Mọi thứ đảo ngược được** — chip rời câu về khay, label rời object về tray,
   progress reset được; không trạng thái thua.
7. **Bảng đồ mở dần** — scene sau không khóa cứng scene trước (trẻ tự chọn trạm),
   nhưng stamp chỉ đến khi đủ 3 nhiệm vụ của scene đó.

## 4. Color tokens

Gouache storybook — giấy kem ngả nắng, mực nâu sepia, xanh đồng cỏ + xanh hồ,
mứt cam, berry, hướng dương. Flat fills, không gradient.

### Neutrals (giấy & mực)

| Token | Hex | Vai trò |
|---|---|---|
| `--canvas` | `#FFF7E4` | Nền trang — kem ngả nắng (journal page) |
| `--canvas-deep` | `#F7ECD3` | Vùng recessed: dock, tray well |
| `--plate` | `#FFFDF4` | Caption plate / sticker nền sáng |
| `--ink` | `#4A3527` | Text chính, viền tranh (sepia; contrast ~10.5:1 trên canvas) |
| `--ink-soft` | `#7A6450` | Text phụ (≥18.66px bold / ≥24px thường = 4.5:1) |
| `--line` | `#E3D2AE` | Hairline, khung journal, đường khâu |

### Gouache accents

| Token | Hex | Vai trò |
|---|---|---|
| `--meadow` | `#5F8F3E` | Xanh đồng cỏ — correct states, lá (trắng 4.6:1) |
| `--meadow-deep` | `#436B2A` | Pressed/đậm |
| `--lake` | `#3F7E8C` | Xanh hồ — primary interactive, link-ish, map route |
| `--lake-deep` | `#2D5E6A` | Pressed |
| `--marmalade` | `#E08A3C` | Cam mứt — active clue, nudge (kèm icon+text) |
| `--berry` | `#C0504A` | Berry — stamp/complete badge (không phải màu "sai") |
| `--sunflower` | `#F2C14E` | Vàng hướng dương — primary CTA (ink text 7:1) |
| `--bark` | `#8A6B4F` | Nâu vỏ cây — chi tiết tranh phụ |

Scene art được tự do dùng các accent mở rộng (gouache palette mở rộng: sky
`#BCD9E8`, wall `#F3E2C3`, wood `#C89A66`…) nhưng UI chrome chỉ dùng tokens trên.

### Trạng thái (không bao giờ color-only)

- **Correct** = `--meadow` + icon lá/check + text ("Great find!"). **Nudge** =
  `--marmalade` + icon kính lúp + text ("Look again — it is near the window.").
- **Focus** = viền `--ink` 2.5px + offset trắng 2px, thấy rõ trên mọi nền (kể cả trên tranh).
- Không dùng đỏ thuần làm trạng thái; "sai" không tồn tại như một màu.

## 5. Typography

| Vai trò | Font | Weights | Ghi chú |
|---|---|---|---|
| Reading layer — từ học, body, UI, câu | **Andika** (SIL OFL) | 400/700 | Thiết kế riêng cho beginning readers: x-height cao, khoảng hở mở, b/d/p/q phân biệt rõ; subsets `latin` + `vietnamese` |
| Journal layer — tiêu đề màn, field notes, ghi chú tay | **Caveat** (OFL, ImpallariType) | 600/700 | Handwriting dày — giọng "sổ thực địa"; KHÔNG dùng cho từ đang học hay câu dài; **chỉ latin/latin-ext** (package không có subset vietnamese) → KHÔNG BAO GIỜ render chữ tiếng Việt bằng Caveat — mọi string tiếng Việt luôn Andika |

- Self-host qua `@fontsource/andika` + `@fontsource/caveat` (bundle — không Google
  Fonts runtime). **Import cả `latin-*` LẪN `vietnamese-*` cho cả hai family**
  (bài học pilot #01). Fallback stack: Andika → `'Trebuchet MS', Verdana, sans-serif`;
  Caveat → `'Segoe Print', 'Comic Sans MS', cursive`.
- Scale (tablet-first): scene title Caveat 700 `clamp(30px, 4.5vw, 44px)/1.1` ·
  target word Andika 700 `clamp(26px, 4vw, 38px)` · body 17–19/1.5 Andika 400 ·
  caption translation 15–17 Andika 400 italic? — không italic (early readers):
  translation phân biệt bằng màu `--ink-soft` + cờ nhỏ "VI" · microcopy ≥ 14
  (tablet ≥ 16) Caveat 600.
- Lowercase-first cho từ học (trẻ Pre-A1 học chữ thường trước); sentence giữ capitalization chuẩn.

## 6. Spacing system

Base 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80`.
Gutters: 16 (mobile) / 24 (tablet) / 40 (desktop). Khoảng cách giữa 2 target ≥ 8px
(skill: Touch Spacing — Medium). Caption plate padding 10–14px; dock padding 16–20px.

## 7. Layout / grid

- **Map screen** (màn chính): dải tranh phong cảnh ngang (SVG landscape band, chính
  giữa), đường hành trình chấm gạch uốn lượn qua 6 **trạm** đặt so le (không grid):
  mỗi trạm = vignette mini + tên scene + stamp khi hoàn thành. Header journal
  (tên expedition + nút Scrapbook + settings). KHÔNG card grid đều tăm tắp.
- **Scene screen** = journal spread dọc: rail trên (tên scene Caveat + 3 task stamps:
  Clues / Labels / Sentences — stamp sáng dần theo tiến độ) · **art plate** chiếm
  ~55–65% chiều cao (SVG viewBox 1200×800, object hotspots là nút HTML overlay theo
  bbox %) · **activity dock** dưới cùng (~220–280px) đổi nội dung theo task.
- **Scrapbook** = trang journal riêng: sticker plates xếp theo scene theo dòng chảy
  ngang từng nhóm (flex wrap, không card grid đều), chạm sticker → caption card lớn.
- Content max-width **1240px** desktop; tablet portrait là hero layout.
- Overlay (caption detail, confirm reset) = lớp giấy phủ giữa màn, ESC/back đóng.

## 8. Component primitives

| Primitive | Mô tả |
|---|---|
| **Caption plate** | Nền `--plate`, viền `--line` 1.5px, bo 10px một góc nhọn một góc (dáng thẻ bảo tàng), chấm ghim tròn `--berry` phía trên-trái; chứa word (Andika 700), say, translation |
| **Word chip** (tray/sentence) | Nền `--plate` viền `--ink` 1.5px bo 8px, min-height 48px; picked state = viền `--lake` 2.5px + nhấc 2px |
| **Clue card** | Plate ngang trong dock: kính lúp icon (SVG) + câu clue Andika 19px + số thứ tự "2 of 4" |
| **Task stamp** | Con dấu tròn 44px viền kép; hoàn thành = fill `--berry` + icon check + text label bên cạnh |
| **Hotspot** | Nút trong suốt trên art (bbox %), focus ring ink; sau khi label → hiển thị chấm ghim nhỏ; hover (desktop) = halo mềm |
| **Primary CTA** | `--sunflower` nền, chữ ink Andika 700, bo 10px, min-height 56px, shadow offset mềm 2px cùng tông |
| **Journal button** | Ghost: viền ink 1.5px, nền trong suốt |
| **Feedback strip** | Trong dock: plate màu trạng thái + icon SVG + text; aria-live polite |

## 9. Illustration language

- **Mọi tranh là SVG code-native trong project** (không raster, không Codex —
  scene cần hotspot chính xác theo bbox và zoom-safe; classification xem
  `design/ASSET_PLAN.md` reasoning trong IMAGE_BRIEF.md).
- 6 scene × viewBox 1200×800: nền phòng/cảnh bằng mảng gouache phẳng (**viền mềm**:
  path hơi lượn ±2–4px, không geometric hoàn hảo), chi tiết bằng 2–3 lớp "paint dab"
  (mảng tối hơn 8–12% cùng hue tạo chất gouache), KHÔNG gradient, KHÔNG bóng đổ --
  chỉ contact shadow ellipse mờ 8% khi vật thể cần đứng trên mặt.
- Mỗi item là `<g id="item-<id>">` đặt trùng vùng bbox khai báo trong `units.json`
  (bbox = [x, y, w, h] theo % viewBox 0–100); đồ vật vẽ nhận diện được ở 80% zoom-out
  (silhouette-first: hình khối tổng thể trước, chi tiết tối thiểu 3–4 nét).
- Nhân vật dẫn dắt: **Pip — chú chim sẻ đội nón explorer** (SVG tái dùng, xuất hiện
  ở map header, cạnh clue card như người dẫn tour, không nói quá nhiều).
- Texture giấy: `feTurbulence` fractalNoise baseFrequency ~0.9, opacity 3–4% phủ
  toàn trang + nhẹ hơn trên art plate — procedural, không asset file.
- Icon UI (kính lúp, lá, ghim, loa, cờ VI) — SVG stroke 2px vẽ trong project.

## 10. Feedback states

| Trạng thái | Biểu hiện |
|---|---|
| Press | scale 0.97, 120ms |
| Hover (desktop enhancement) | halo mềm quanh hotspot, chip nhấc 2px, 160ms |
| Focus-visible | viền ink 2.5px + offset trắng 2px — luôn hiện, không bao giờ remove |
| **Correct (clue/match)** | spotlight ring mềm 2 vòng ~600ms + caption plate pop (scale 0.9→1, 220ms) + live-region "Great find! kettle — ấm đun nước" |
| **Nudge (nhầm object)** | object chạm nghiêng nhẹ 2–3° 1 lần + strip marmalade "Look again! It is near the window." — KHÔNG đỏ, KHÔNG shake liên tục, KHÔNG âm lỗi |
| Nudge lần 2+ | vùng mục tiêu sáng dần (halo pulse chậm 2 vòng) — giúp chứ không phạt |
| **Match đúng** | chip FLIP từ tray về vị trí object → thành annotation plate cố định 350–450ms |
| **Sentence đúng** | chip FLIP vào blank + sentence card hiện translation, chime nhẹ (nếu sound bật) |
| Progress | 3 task stamp trên rail; scrapbook sticker count ở header |
| Sound | mặc định TẮT; WebAudio synth (click/chime) tự sinh, không file; nút loa luôn hiển thị |

Live region `aria-live="polite"` cho mọi feedback; copy feedback luôn gọi tên từ
("Great find! kettle") — reinforcement ngôn ngữ.

## 11. Motion budget

Từ spec (khóa): feedback 120–220ms · spatial 250–500ms · delight ≤900ms · không intro
khóa thao tác · ease tự nhiên (`power2.out`, `expo.out`; `back.out(1.4)` chỉ cho pop
reward) · KHÔNG bounce/elastic trang trí.

Chỉ định GSAP (tất cả qua wrapper `src/lib/gsap.ts` — register 1 lần, cleanup đúng lifecycle):
- Scene enter: settle pan nhẹ (x/y ±12px → 0) + fade 380ms power2.out — spatial
  memory cho "bức tranh này nằm đâu".
- **Flip cho label**: match đúng — `Flip` chip tray → annotation plate 350–450ms
  expo.out (spec: "Flip cho label").
- Stagger annotations: các plate đã ghim hiện lại theo stagger 40ms.
- Clue found: spotlight ring scale-in 500ms + plate pop 220ms `back.out(1.4)`.
- Scene↔map: exit fade+slide 200ms, enter settle 380ms (exit nhanh hơn enter — skill note).
- Sentence chip → blank: Flip 300ms.
- **prefers-reduced-motion** (wrapper bắt buộc): mọi tween → set trạng thái cuối tức
  thì; chỉ giữ opacity fade ≤150ms; không pan/parallax/pulse; app chơi 100%.

## 12. Responsive strategy

- **Tablet 768–1199 = hero viewport**: art plate ~58vh trên, dock dưới; hotspots
  chạm chuẩn; thiết kế tablet TRƯỚC.
- **Desktop ≥1200**: art plate max-width 1240 center, thêm khoảng trắng journal
  (margin lớn, caption số trang), dock cùng chiều rộng content.
- **Mobile 360–479**: `supported` với lưu ý — art plate co ~40vh, hotspots vẫn ≥44px
  nhờ bbox lớn; drag label chuyển thành **pick-and-place** (chạm từ → chạm object)
  làm path chính; dock thành bottom stack. Test thật 390×844; không horizontal scroll.
- Breakpoints: `360 / 480 / 768 / 1024 / 1200`. Text reflow an toàn ở 200% zoom
  (dock + caption wrap, không fixed-width text).

## 13. Accessibility constraints

- Semantic HTML trước ARIA; `lang="en"` (product tiếng Anh; translation layer là
  nội dung song ngữ bên trong) · landmarks header/main/nav.
- Hotspot là `<button>` thật với `aria-label="kettle — ấm đun nước"`; art SVG có
  `role="img"` + `aria-label` mô tả cảnh; mọi visual question có text equivalent.
- **Keyboard path đầy đủ (definition of done)**:
  1. Map: Tab qua 6 trạm (focus ring trên marker) + Scrapbook/settings.
  2. Explore: Tab qua hotspot theo thứ tự đọc; Enter = mở caption plate.
  3. Clue hunt: Tab + Enter chọn object (giống chuột).
  4. Label match *không cần kéo pixel*: Enter trên chip = cầm (chip "in hand"),
     Tab/Arrow qua objects, Enter = đặt, Esc = trả chip về tray; trạng thái "đang cầm"
     công bố qua live region.
  5. Sentence builder: Tab chip, Enter chọn; Tab lại blank, Enter gỡ; Enter trên
     Check để chấm.
- Focus-visible luôn hiện (kể cả trên art); không trap; ESC đóng overlay/bỏ cầm chip.
- Live region polite; không assertive.
- Không color-only (mọi trạng thái kèm icon + text); không hover-only; không time pressure.
- `prefers-reduced-motion` qua gsap.matchMedia + CSS `@media` fallback.
- localStorage: chỉ progress ẩn danh (từ đã tìm, scene đã xong, settings sound/
  translation) + nút **Reset expedition** trong settings; không dữ liệu cá nhân.

## 14. Anti-patterns (cấm)

1. Claymorphism / soft-3D / double shadow / glassmorphism / neon — recommendation
   mặc định của skill cho kids app, **bị loại** (phá gouache editorial).
2. Gradient tím–xanh AI; gradient trang trí nói chung (gouache = flat fills).
3. **Flashcard grid làm màn chính** (spec cấm trực tiếp) — map là bản đồ hành trình.
4. Card-inside-card soup; dashboard SaaS; lesson-select dạng card grid đều nhau.
5. Emoji làm icon/visual chính; text nhúng trong ảnh raster.
6. Leaderboard, streak, điểm số, timer, buzz lỗi.
7. Feedback đỏ/x rung trừng phạt.
8. Bounce/elastic vì GSAP có; ambient loop vô hạn; intro chặn input.
9. Hover-dependent interaction; touch target <48px; chữ quan trọng <16px trên tablet.
10. Runtime CDN (font/GSAP/ảnh) — mọi thứ bundle; TTS online.
11. Serif display kiểu menu nhà hàng (lãnh thổ #02) hay stamp mono trên graphite
    (#03) — caption plate phải là plate dáng bảo tàng, không phải kiểu chữ hiệu ứng.

## 15. Đối chiếu UI UX Pro Max → giữ / loại

| Skill recommendation | Quyết định |
|---|---|
| Kids Learning → Claymorphism + vibrant block-based + parent dashboard | **LOẠI** — 3D plastic mâu thuẫn gouache editorial (§14.1); đây là game không phải SaaS |
| Fredoka+Nunito / rounded display pairing | **LOẠI** — trùng họ ronded của #01 (Baloo 2); chọn Andika+Caveat vì early-reader + journal voice (§5) |
| Touch ≥44px (iOS) / ≥48dp (Android), spacing ≥8px, WCAG 2.5.8 note | **GIỮ + siết** ≥48px mọi control (đối tượng 6–10) |
| Error feedback rõ gần vấn đề + recovery path (severity High) | **GIỮ** — nudge strip trong dock + hint vùng sau 2 lần nhầm (§10) |
| prefers-reduced-motion bắt buộc (High), gsap.matchMedia, revert SplitText | **GIỮ** (§11, §13) — wrapper bắt mọi tween |
| Flip shared-element transition 500–800ms | **GIỮ nhưng siết** về 350–450ms theo motion budget spec; 1 cặp element mỗi lần Flip |
| Stagger 0.02–0.04s, expo/power out, back.out chỉ delight | **GIỮ** |
| Organic Biophilic / Nature Distilled (earthy, terracotta, flowing SVG) | **GIỮ một phần** — chất organic/earth giữ cho tranh; không import整套 wellness aesthetic |
| Bright primary + candy pastel palette | **LOẠI** — khóa palette gouache kem-nắng (§4) |
| Z-index scale 10/20/30 (High) | **GIỮ** — tokens z: art 10, hotspot 20, caption 30, dock 40, overlay 50 |
| Overflow hidden clipping content (Medium) | **GIỮ** — caption plate được position trong art bounds, test 200% zoom |
| Vietnamese Friendly pairing (Be Vietnam Pro + Noto Sans) | **LOẠI cho display** — Andika thắng vì thiết kế cho beginning readers; nguyên tắc "vietnamese subset bắt buộc" thì **GIỮ** |
