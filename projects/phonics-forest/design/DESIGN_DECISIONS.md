# DESIGN_DECISIONS — Phonics Forest (Showcase #08)

> Khóa design system cho showcase #08. Nguồn: spec `.showcase/08_phonics-forest.md`
> (Nordic storybook forest thesis đã khóa: "moss, fog blue, berry red, warm ivory;
> woodcut-inspired SVG texture; rất ít chrome UI") + đối chiếu UI UX Pro Max
> (queries: `phonics early literacy learning game children reading`,
> `audio sound symbol association matching quiz children`,
> `drag and drop card sorting accessibility keyboard alternative`,
> `children dyslexia friendly font generous letterforms literacy`,
> `education children rounded readable display font pairing`,
> `nature forest moss green deep blue palette calm`,
> `folk woodcut rustic vintage texture flat illustration`,
> `children touch target size minimum 44px forgiving`,
> `gsap flip motionpath feedback microinteraction stagger`).
> Domain woodcut/folk: **không có match trong styles.csv** (skill chỉ ra
> vintage-analog/film và flat-design) — art direction đi theo thesis khóa của
> spec, không theo fallback. Brief thắng recommendation: mọi gợi ý mâu thuẫn
> woodcut Nordic đều bị loại (ghi §15).

## 1. Visual thesis

**Nordic storybook woodcut forest.** Cả app là một trang sách tranh cổ tích
Bắc Âu: nền **ivory ấm** như giấy sách cũ, cảnh rừng ghép từ các mảng phẳng
màu **moss / pine / fog blue** với **hatch carve** — kết cấu mộc in (SVG pattern
đường kẻ chéo) đổ bóng thay vì drop-shadow; viền **mực nâu-đen dày, đều tay**
(2.5–4px) như nét khắc gỗ; chữ mực nghiêng về serif sách tranh. Mỗi cây thông
là một âm: bảng hiệu gỗ trước thân cây khắc **grapheme** (chữ trẻ học), dưới là
ký hiệu IPA nhỏ (cho người lớn). Rất ít chrome: không top bar, không card grid —
câu hỏi và feedback là một **dải chú thích sách tranh (caption band)** dưới
trang, như caption dưới tranh minh hoạ.

Từ khóa: nordic storybook · woodcut · carved ink lines · moss & pine · fog blue
· berry red · warm ivory · hatch texture · picture-book caption · calm, misty,
hushed.

**Phân biệt bắt buộc với #01 number-garden** (paper-cut pastel botanical —
hàng xóm khái niệm gần nhất): garden = giấy kem sáng + bóng giấy offset đặc +
bo tròn organic + display font tròn Baloo 2 + nudges vàng đất/terracotta.
forest = **ivory trung tính + khắc mực thẳng góc/hatch chéo, không offset shadow**,
silhouette cây thông góc cạnh (tam giác tầng, không blob tròn), serif sách tranh
Fraunces, dư âm lạnh của fog blue mà garden không có. Không dùng lại bất kỳ
token màu hay hình tiếng nào của garden.

## 2. Target age

Trẻ **Pre-A1** (mới bắt đầu tiếng Anh, ~5–8 tuổi) đang hình thành
phoneme–grapheme correspondence: nhận sound đầu/cuối của từ, ghép âm–chữ,
phân biệt cặp âm gần nhau. Hệ quả:

- Copy tiếng Anh đơn giản, ≤ 8 từ/câu, luôn kèm visual (grapheme + IPA + word).
- Grapheme là "đồ dạy học" — cỡ lớn (≥48px tablet), font đúng letterform
  dạy đọc, không trang trí.
- Không yêu cầu đọc trôi chảy để vận hành app: mọi audio đều có đường đọc
  chữ (nút "Read it").
- Không điểm số/xếp hạng/timer; tiến bộ = đom đóm sáng dần trên cây.
- **Ngôn ngữ UI: tiếng Anh** (product dạy phonics tiếng Anh; copy nhất quán).

## 3. Learning interaction principles

1. **Âm gắn với chỗ trên bản đồ** — mỗi phoneme có một cây, một chỗ đứng cố
   định; nghe lại = quay lại cây đó (spatial memory thay vì menu).
2. **Nghe → thấy → chọn**: sound stone phát audio; grapheme hiện trên lá;
   trẻ chọn. Nghe bao nhiêu lần cũng được (replay miễn phí, không penalize).
3. **Phân biệt cặp âm gần nhau** (minimal pairs: ship/chip, sheep/ship,
   win/wing, boot/book) là vòng lõi thứ hai — nghe kĩ hơn, không nhanh hơn.
4. **Phân loại = cho sinh vật về đúng cây**: word creature mang từ; đúng cây
   thì đom đóm sáng, cây "thức giấc".
5. **Sai chỉ được phép nhẹ**: chọn sai → "Almost — listen once more", audio
   tự phát lại, không đỏ, không rung, không trừ điểm; lần sai thứ hai mở
   hint (đáp án sáng dần). Không bao giờ khoá thao tác.
6. **Text equivalent cho mọi audio** (spec checklist): phoneme rounds hiển thị
   sẵn word text; minimal-pair rounds có nút "Read it" lộ chữ sau khi trả lời
   hoặc khi trẻ chủ động mở (không âm-thì-mới-biết-được gì cả).
7. **Mọi thứ đảo ngược được**: nhặt sinh vật ra khỏi nest, reset progress.

## 4. Color tokens

Nordic storybook palette — ivory giấy sách, xanh rừng lạnh, berry đỏ dệt
truyền thống. Flat màu mảng; gradient chỉ dùng dạng *fog band mờ rất nhẹ*
trong scene (không dùng cho UI chrome).

### Neutrals (giấy & mực)

| Token | Hex | Vai trò |
|---|---|---|
| `--ivory` | `#F3EDDE` | Nền chính (giấy sách ấm) |
| `--ivory-raised` | `#FBF7EC` | Bề mặt nổi (caption band, sign) |
| `--ivory-deep` | `#E7DFC8` | Recessed well (tray, nest floor) |
| `--ink` | `#2E2A22` | Mực chính, outline khắc (contrast ~11.5:1 trên ivory) |
| `--ink-soft` | `#655D4C` | Text phụ (≥18px bold / ≥24px) |
| `--line` | `#C9BE9F` | Hairline giấy |

### Forest (rừng)

| Token | Hex | Vai trò |
|---|---|---|
| `--pine` | `#3D5A46` | Green đậm chính — confirm, canopy nền (white text 6.1:1) |
| `--pine-deep` | `#2C4234` | Canopy tầng sau, pressed |
| `--moss` | `#71875C` | Green vừa — fill chính canopy, leaf đúng |
| `--moss-deep` | `#55693F` | Hatch carve trên moss |
| `--lichen` | `#A9B48A` | Green nhạt — tầng đồi xa |
| `--fog` | `#A7B8B5` | Fog blue vừa — hill xa, tray chrome |
| `--fog-deep` | `#7E938F` | Fog đậm — outline phụ, viền dọc |
| `--fog-pale` | `#D5DDDA` | Dải sương phủ scene |
| `--bark` | `#7A5A3E` | Gốc cây, khung bảng hiệu |
| `--bark-deep` | `#5C422C` | Chữ khắc trên gỗ |

### Warm & state (không bao giờ color-only)

| Token | Hex | Vai trò |
|---|---|---|
| `--berry` | `#A6442E` | Berry đỏ — accent thương hiệu: title, creature mark, CTA chính (white 5.9:1) |
| `--berry-deep` | `#8A3624` | Pressed berry |
| `--lantern` | `#D9A03F` | Vàng đèn lồng — đom đóm/reward, nudge copy (ink trên lantern 6.8:1) |
| `--lantern-glow` | `#F2CE84` | Đốm sáng đom đóm |
| `--stone` | `#8E8A7C` | Sound stone |

- **Correct** = `--pine` + icon đom đóm + text. **Nudge** = `--lantern`/`--bark`
  + icon lá nghiêng + text "listen once more" — KHÔNG có màu "sai", không đỏ
  phạt (berry không bao giờ dùng cho feedback sai).
- **Focus** = vành `--ink` 3px + offset 2px (nhìn rõ trên mọi surface kể cả
  moss/pine).

## 5. Typography

| Vai trò | Font | Weights | Ghi chú |
|---|---|---|---|
| Display / prompt / title | **Fraunces** (OFL, Undercase Type / Google Fonts) | 600, 900 | Serif sách tranh "wonky old-style" — chất khắc/in; subsets latin+latin-ext+vietnamese ✓ |
| **Grapheme / IPA / body / UI** | **Andika** (OFL, SIL) | 400, 700 | Font thiết kế riêng cho beginning readers: single-story 'a', letterform sạch, **phủ đầy đủ IPA** (ʃ ŋ ː…) + vietnamese ✓ |

- Self-host qua `@fontsource/fraunces` + `@fontsource/andika` (bundle; không
  Google Fonts runtime). Import **đủ cả ba subset** `latin`, `latin-ext`,
  `vietnamese` cho mỗi weight (rule pilot #01 + `check:fonts` đo mẫu tiếng
  Việt).
- **IPA chỉ render bằng Andika** (Fraunces không phủ IPA) — mọi chuỗi có ký
  hiệu IPA nằm trong element dùng Andika; grapheme cards cũng Andika để đúng
  letterform dạy đọc.
- Scale (tablet-first): prompt `clamp(22px, 3.4vw, 34px)/1.2` Fraunces 600 ·
  section 26–30 Fraunces 600 · **grapheme 56–96 Andika 700** · body 17–19/1.5
  Andika 400 · IPA caption ≥15 Andika 700 · microcopy ≥14 (tablet ≥16).
- `font-variant-numeric: tabular-nums` cho số đếm vòng.

## 6. Spacing system

Base 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`.
Gutters: 16 (mobile) / 24 (tablet) / 40 (desktop). Caption band padding
dọc 20–24. Khoảng cách giữa 2 touch target kế tiếp ≥ 8px (skill: Touch
Spacing — Medium).

## 7. Layout / grid

- App = 1 sân khấu full-viewport chia 3 lớp chồng: **scene (rừng, ~64%) ·
  tray/nest layer · caption band đáy (~24%, min 132px)**. Header mảnh 8px-high
  chỉ có mute + reset + home (icon-only, 48px hit, ẩn chữ).
- Grove (map): 5 cây thông đứng **so le trên triền đồi 3 tầng sâu**
  (fog-pale hill xa → moss hill giữa → ivory ground trước); KHÔNG xếp hàng
  ngang đều, KHÔNG card grid. Mỗi cây: sign grapheme + IPA + 3 đom đóm progress.
- Clearing (listen): cây chiếm giữa-trái, sound stone trước gốc; lá grapheme
  xoè quanh như mo đất (2×2–3×2 tuỳ viewport); caption band đặt prompt.
- Roundup (sort): tray sinh vật ngang dưới scene (scroll ngang khi chật),
  5 nest = 5 gốc cây với sign nhỏ; caption band hướng dẫn + feedback.
- Desktop ≥1200: scene max-width 1280 giữa, thêm trời sương 2 bên; tablet
  portrait = hero. Không horizontal scroll ở mọi breakpoint (trừ tray chủ đích).

## 8. Touch-target rules

- Grapheme leaf: **≥72×80px** tablet, ≥64 mobile (chữ lớn + hit lớn).
- Sound stone / creature card / nest: **≥48×48px**, creature card ≥88×72.
- Primary CTA ( berry): cao ≥56px.
- Spacing ≥8px; nest **phình +12px khi đang kéo hoặc đang cầm (carry)**; snap radius
  56px — forgiving targets.
- Không hover-only; hover chỉ enhancement desktop (lift 1px + hatch đậm).

## 9. Illustration language

- **SVG code-native 100%** — quyết định tài sản: **không dùng raster/Codex**
  cho showcase này. Woodcut là ngôn ngữ nét: hatch = `<pattern>` đường kẻ
  chéo SVG, carve = stroke dày đều, silhouette tầng phẳng. Một texture raster
  chỉ làm mềm nét khắc (mâu thuẫn thesis) và kéo artifact nặng;SVG giữ nét in
  sắc ở mọi DPI và artifact nhỏ. (`design/IMAGE_BRIEF.md` không cần tạo.)
- Cây thông: 1 generator TS vẽ từ params (số tầng, height, hue, hatch angle)
  → 5 cây cùng "loài" khác cá tính; sign gỗ 4-mép-viên-bark.
- Word creature: sprite "seed-pod sprite" nhỏ (thân oval + tai/cánh/sừng biến
  thể theo phoneme) **mang tấm lá khắc word text** — nghĩa nằm ở CHỮ, hình
  chỉ là bạn đồng hành; không vẽ pictogram 20 từ.
- Sound stone: đá tròn carved tai-nghe motif; firefly = đốm lantern-glow có
  thân ink nhỏ.
- Không emoji làm visual; icon UI (mute, reset, home, replay, eye) = SVG
  stroke 2.5px tự vẽ cùng ngôn ngữ khắc.
- Màu illustration khóa theo tokens §4; mỗi cây 1 hue canopy + bark chung.

## 10. Feedback states

| Trạng thái | Biểu hiện |
|---|---|
| Press | scale 0.97, hatch đậm lên, 120ms |
| Hover (desktop) | lift 1px + ink outline rõ, 150ms |
| Focus-visible | vành ink 3px offset 2px — không bao giờ remove |
| Replay sound | stone sáng lantern-glow pulse 1 lần 180ms + ripple vòng (motion §11) |
| **Correct** | đom đóm bay stone→sign (MotionPath) 380ms + chime nhẹ + copy "Yes! *ship* starts with **sh**." |
| **Nudge (sai #1)** | leaf nghiêng 2° + copy "Almost — listen once more." + audio tự replay; không đỏ, không shake |
| **Hint (sai #2)** | leaf đúng sáng dần (pulse 2 nhịp) + copy chỉ dẫn trực tiếp |
| Sort đúng | creature bay về nest (Flip) 420ms + đom đóm nest +1 + chime |
| Sort sai | creature trượt về tray 300ms + copy "Listen again — *king* ends with **ng**." |
| Tree mastered | cây "thức giấc": canopy sway + lantern sáng + chim nhỏ, ≤900ms (timeline) |
| Progress | 3 đom đóm/cây trên sign; hoàn thành roundup = một vòng sáng lan trên triền đồi |

Live region `aria-live="polite"` cho mọi feedback; copy mô tả âm/chữ thật
("Yes! ship starts with sh"), không generic "Great job".

## 11. Motion budget

Từ spec (khóa): feedback 120–220ms · spatial 250–500ms · delight/reveal
≤900ms · không intro khóa thao tác · ease tự nhiên (`power2.out`, `power3.out`;
`back.out(1.3)` CHỈ cho đom đóm hatch-pop reward) · không bounce/elastic
trang trí.

Chỉ định GSAP (qua wrapper `src/lib/gsap.ts`, register 1 lần):
- **Sound ripple**: vòng tròn nở ra từ stone khi phát âm (feedback 180ms).
- **Firefly → sign**: MotionPathPlugin, đường cong nhẹ, 380ms power2.out —
  dẫn mắt từ nguồn âm đến grapheme đúng (purposeful: sound→symbol).
- **Creature → nest**: FlipPlugin (tray reflow) + tween bay theo arc 420ms
  (spatial continuity); tray tự đóng lại bằng Flip 350ms.
- **Tree wake-up**: timeline sway (rotation ±1.2°) + lantern glow + stagger
  chim/đom đóm, tổng ≤900ms, chạy 1 lần khi mastered.
- Sort sai: creature về tray 300ms power2.out.
- Reduced motion: `gsap.matchMedia` — bỏ ripple/path/flight/sway; trạng thái
  cuối tức thì; chỉ fade ≤150ms; app chơi 100%.

## 12. Responsive strategy

- **Tablet 768–1199 = hero viewport** (spec: educational → tablet): thiết kế
  tablet trước; clearing 2×2 leaves, roundup tray dưới.
- **Desktop ≥1200**: thêm khí trời (sương 2 bên, scene max 1280), đồng thời
  caption giữ max-width 62ch.
- **Mobile 390–479**: `limited` — cây xếp dọc 2 cột so le, tray scroll ngang,
  tap-tap là đường chính (drag không bắt buộc); leaves full-width xếp chồng.
  Test thật 390×844 trước khi quyết `screenshots.mobile`; không thu target
  dưới 48px.
- Breakpoints: `360 / 480 / 768 / 1024 / 1200`. Reflow 200%: layout dùng
  clamp/fluid, không khung cố định chặn zoom.

## 13. Accessibility constraints

- Semantic HTML trước ARIA; `lang="en"`; landmark header/main; prompt là
  heading cấp màn hình.
- Mọi control là `<button>` thật; tree/leaf/nest/creature đều có aria-label
  ("Tree sh — sound /ʃ/, 1 of 3 fireflies").
- **Keyboard path đầy đủ (definition of done)**:
  1. Grove: roving focus bằng mũi tên giữa các cây, Enter mở clearing.
  2. Listen: Tab vòng lá; Enter chọn; phím `R` phát lại âm (nút replay cũng
     focus được).
  3. Sort: Enter trên creature = cầm (mode "carrying" hiện rõ + Esc trả lại);
     Tab đến nest; Enter thả. Không bắt keyboard user mô phỏng kéo pixel.
  4. Escape: đóng dialog / về grove.
- WCAG 2.2 dragging: drag luôn có **tap-tap alternative** (skill severity
  High — single-pointer alternative).
- Focus-visible luôn hiện; không trap; live region polite; không
  assertive.
- **Audio**: mặc định BẬT sau gesture đầu (spec: không autoplay khi load);
  nút mute luôn hiện, lưu localStorage; speechSynthesis không có voice →
  hiện notice nhẹ + nút "Read it" vẫn đầy đủ (deaf-friendly by design).
- Không color-only, không hover-only, không time pressure, không âm lỗi.
- localStorage chỉ progress ẩn danh (fireflies, rounds, mute) + nút
  "Start over" reset.

## 14. Anti-patterns (cấm)

1. Claymorphism / soft-3D / bóng nhựa / glassmorphism / neon (recommendation
   mặc định của skill cho kids app — **bị loại**, phá woodcut phẳng).
2. Gradient tím–xanh AI; gradient trang trí (fog band mờ trong scene là duy
   nhất, và không phải UI chrome).
3. Card-inside-card soup; dashboard SaaS; lesson grid đều tăm tắp.
4. Emoji làm icon/visual chính.
5. Đỏ phạt / shake / buzz / timer / điểm số / streak.
6. Bounce/elastic trang trí; ambient loop vô hạn; intro chặn input.
7. Hover-only; target <48px; text quan trọng <16px trên tablet.
8. Text nhúng trong ảnh; icon raster.
9. Runtime CDN (font/GSAP/ảnh) — mọi thứ bundle local.
10. Trùng ngôn ngữ hình của #01: bóng offset giấy, blob bo tròn pastel,
    palette terracotta/đất nắng, font tròn.

## 15. Đối chiếu UI UX Pro Max → giữ / loại

| Skill recommendation | Quyết định |
|---|---|
| Kids education → Claymorphism + pastel candy, double shadow | **LOẠI** — 3D/nhựa/pastel mâu thuẫn woodcut khắc mực (§14.1) |
| Touch ≥44px (iOS 44/Android 48), spacing ≥8px | **GIỮ + siết** ≥48px mọi target, grapheme leaf ≥72px (§8) |
| WCAG 2.2: drag cần single-pointer + keyboard alternative (severity High) | **GIỮ** — tap-tap + carrying mode (§13) |
| Keyboard navigation đầy đủ + visible focus (severity High) | **GIỮ** (§13) |
| Skip link, tab order theo visual | **GIỮ** — app 1 màn hình/màn, DOM order = visual order |
| prefers-reduced-motion bắt buộc, gsap.matchMedia | **GIỮ** (§11) |
| Stagger 0.02–0.04s, expo/power out; microinteraction <2px displacement | **GIỮ** (§11) |
| Audio icon context: interactive control phải có accessible name + state | **GIỮ** — mute/replay là button có aria-pressed/label (§13) |
| Rounded friendly kids font pairing (Baloo/Nunito kiểu) | **LOẠI** — trùng giọng #01; thay bằng Fraunces + Andika (§5) |
| Font beginning-reader (dyslexia-friendly line of thinking) | **GIỮ + cụ thể hoá** → Andika (SIL, thiết kế cho beginning readers, phủ IPA) |
| Nature green palette (Plant Care #15803D…) | **LOẠI** bảng cụ thể — giữ *định hướng* rừng nhưng khóa palette Nordic ivory/moss/fog/berry tự định nghĩa (§4); bảng skill quá sáng/saturated cho fog |
| Woodcut/folk style | **KHÔNG có match trong styles.csv** (skill xác nhận 0 kết quả) — theo thesis spec, tự xây token hatch/carve (§9) |
| Vintage-analog film grain/leak | **LOẠI** — nhiễu ảnh, không phải khắc in |
| E-ink/paper minimal, no animation | **GIỮ một phần** — chất giấy mực; nhưng motion budget của spec giữ lại animation purposeful |
