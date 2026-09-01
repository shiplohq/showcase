# DESIGN_DECISIONS — Money Market Junior (Showcase #06)

> Khóa design system cho showcase #06. Nguồn: spec `.showcase/06_money-market-junior.md`
> (visual thesis "contemporary market signage: deep green, coral, butter yellow, cream,
> ink; price tags lớn; illustration flat hơi imperfect; fictional token currency" đã khóa)
> + đối chiếu UI UX Pro Max (queries: `market store shop pretend play UX children 7-11 learning`,
> `money currency budget learning app UX children counting coins`,
> `flat illustration grocery market playful sticker signage`, `deep green coral butter yellow cream palette`,
> `signage bold display font pairing grocery market poster`, `condensed grotesque bold numerals price tag display`
> (0 hit — no fallback), `friendly readable sans body UI children app open source`,
> `children education touch target drag drop tablet`, `gsap number counter tween stagger flip`).
> Brief thắng recommendation: mọi gợi ý skill mâu thuẫn market-signage flat đều bị loại (§15).
> Giữ nguyên cấu trúc 15 mục proven bởi pilot #01 để các showcase đối chiếu được với nhau.
> Huashu: KHÔNG invoke — art direction đã khóa trong brief (đúng tiêu chí bỏ qua của spec).

## 1. Visual thesis

**Contemporary market signage — biển hiệu chợ hiện đại.** Cả app là một hệ thống
wayfinding của một khu chợ hàng tươi: **dải biển hiệu deep-green** ở đầu trang với
tên chợ chữ display lớn, **mái che vải sọc** (awning stripes: deep green + cream,
mép scallop 1 hàng) phủ trên từng quầy hàng, **price tag butter-yellow** dạng
sticker giấy đục lỗ xỏ dây, xoay lệch 1.5–3° (flat hơi imperfect), và **biên lai
cashier** mép răng cưa khi checkout. Tiền là **token hư cấu** của chợ: coin tròn
vàng đồng/đồng cũ + note xanh — không quốc gia, không ký hiệu tiền thật. Điểm nhấn
học tập: mọi số tiền luôn hiện **cùng lúc dưới dạng numeral + token coins** (số 12
luôn kèm hàng coin minh họa cấu thành) — hình ảnh và ký hiệu đi cặp.

Từ khóa: market signage · deep green awning · butter price tag · coral accent ·
cream paper · flat vector · sticker tilt · scalloped canopy · till receipt ·
friendly contemporary.

**Phân biệt với các showcase khác** (yêu cầu 19 showcase khác nhau):
- #01 Number Garden: paper-cut organic collage, nền kem ấm, bóng giấy offset, Baloo 2.
- #02 Fraction Bistro: serif editorial trattoria, hairline menu, tomato/olive.
- #03 Geometry Builder: Bauhaus drafting sheet, graph paper, cobalt/vermilion/mustard.
- #06 (mình): hệ thống **biển hiệu + sticker tag + awning sọc** — typography
  grotesque display rất đậm, khối sign-band ngang lớn, tag xoay nhẹ, receipt
  ticket. Không organic collage (#01), không serif editorial (#02), không bản vẽ
  kỹ thuật (#03). Bóng: hard offset 2–3px chỉ dùng cho price tag + receipt
  (ngôn ngữ sticker in), không shadow nhựa, không blur.

## 2. Target age & users

7–11 tuổi (lớp 2–5) luyện: cộng/trừ tiền, đổi tiền, lập ngân sách cơ bản; giáo viên/
phụ huynh dùng kèm. Hệ quả thiết kế:

- Copy tiếng Anh ngắn (spec JSON example/learningGoal đều tiếng Anh), ≤ 12 từ/câu,
  từ vựng chợ thông thường (spend, left, change), không idiom.
- Số học đọc được ngay: numeral to tabular + token minh họa; không bắt đọc thành
  thạo trước khi thao tác được.
- Nhiều nghiệm đúng là chuẩn (scoring theo constraint, không ép một basket).
- Không time pressure, không leaderboard, không streak.
- Giáo viên đọc được learningGoal của từng mission ngay trên UI (microcopy).

**Ngôn ngữ UI: tiếng Anh** (signals của spec). Không dấu tiếng Việt → font subset
`latin` + `latin-ext` là đủ (không cần vietnamese — không text VN nào ship).

## 3. Learning interaction principles

1. **Budget là vật thấy được** — wallet strip + budget bar luôn hiện trong lúc mua;
   mỗi lần thêm/bớt, bar và tổng cập nhật tức thì; số dư đọc thành câu
   ("You have 12 tokens left").
2. **Total là phép cộng đang sống** — basket tổng animate digit-roll ngắn; mỗi
   line có giá × qty rõ ràng; receipt liệt kê lại từng dòng (cùng cấu trúc phép
   cộng) — arithmetic không bị che bởi animation.
3. **Trả tiền là hành động vật lý** — kéo/đặt token vào cashier tray; tổng đã trả
   count-up theo từng token; exact vs over luôn có nhãn chữ.
4. **Change có nhiều cách đúng** — change-mode: learner tự ghép số tiền thừa từ
   coin tray bằng bất kỳ tổ hợp nào đúng; app chỉ nudge thân thiện khi sai số.
5. **Lỗi dạy, không trừng phạt** — over-budget: tag "X over" + icon + gợi ý đặt lại
   món (không đỏ chói, không shake, không kêu lỗi); sai change: hiện chênh lệch
   bằng lời ("That's 7 — you need 6").
6. **Mọi thứ đảo ngược được** — bớt món, rút token khỏi tray, quay lại chợ từ
   checkout; không đồng hồ, không mất progress giữa các màn.
7. **Nhiều nghiệm đúng** — mission pass khi requirements met + total ≤ budget;
   không so sánh basket "optimal".

## 4. Color tokens

Market-signage palette — deep green chủ đạo, butter tag, coral accent, cream giấy.
Flat, không gradient trang trí.

### Neutrals (giấy & mực)

| Token | Hex | Vai trò |
|---|---|---|
| `--paper` | `#FBF5E9` | Nền chính (cream) |
| `--paper-raised` | `#FFFDF4` | Bề mặt nổi (receipt, tray) |
| `--paper-deep` | `#F1E7D2` | Rãnh/recessed (shelf gutter, tray empty) |
| `--ink` | `#262B21` | Text chính, outline illustration (≈12.9:1 trên paper) |
| `--ink-soft` | `#5A614F` | Text phụ (≥16px; 5.5:1) |
| `--line` | `#DCD2B8` | Hairline kẻ kệ |

### Greens (sign band & awning)

| Token | Hex | Vai trò |
|---|---|---|
| `--green` | `#1E5B3E` | Sign band, awning stripe, primary button (white text 8.0:1) |
| `--green-deep` | `#14402C` | Pressed/hover đậm, focus ring thứ 2 |
| `--green-soft` | `#9DC0A5` | Fill illustration, requirement chip met |
| `--green-mist` | `#E5EEDD` | Nền chip/nhãn nhạt |

### Butter & coral

| Token | Hex | Vai trò |
|---|---|---|
| `--butter` | `#F7C64B` | Price tag, highlight, coin vàng (ink text 9.1:1) |
| `--butter-deep` | `#E0A72E` | Tag edge, pressed |
| `--coral` | `#E45C3F` | Accent: awning stripe phụ, over-budget tag, stamp (ink/large text ≥3:1; không text nhỏ) |
| `--coral-deep` | `#C24830` | Pressed coral |
| `--coral-text` | `#A33A22` | Text cảnh báo thân thiện trên paper (6.1:1) |
| `--coin-copper` | `#C98A4B` | Coin đồng (mệnh giá nhỏ) |
| `--sky` | `#7FB6C6` | Illustration only (milk, lemonade) |

### Trạng thái (không bao giờ color-only)

- **Ok/met** = `--green` + icon check + text ("2 of 2 fruit"). **Over-budget** =
  coral tag + icon mũi tên lên + text "4 tokens over". **Focus** = ring `--ink` 2px
  + gap 2px. **Nudge change** = `--coral-text` + icon + câu chênh lệch.
- Không dùng đỏ thuần làm "sai"; không state nào chỉ phân biệt bằng màu.

## 5. Typography

| Vai trò | Font | Weights | Ghi chú |
|---|---|---|---|
| Display / sign band / **price tag / numerals** | **Bricolage Grotesque** (OFL, Omnibus-Type) | 600–800 | Grotesque đậm chất biển hiệu, numerals rõ, có personality; `latin`, `latin-ext` |
| Body / UI / microcopy | **Figtree** (OFL, Erik Kennedy) | 400–700 | Humanist sạch, dễ đọc 16–19px; `latin`, `latin-ext` |

- Self-host qua `@fontsource/bricolage-grotesque` + `@fontsource/figtree` (bundle —
  không Google Fonts runtime, đúng font policy). English-only UI → subset
  `latin` + `latin-ext` là đủ; chạy `font-check` (latin + digits) trước deploy.
- Scale (tablet-first): sign-band title `clamp(30px, 4.5vw, 46px)/1.05` Bricolage
  700 · price tag numeral 22–26 Bricolage 700 (`tabular-nums`) · budget total /
  checkout numeral 34–56 Bricolage 800 tabular · section/stall name 20–24
  Bricolage 700 · body 16–18/1.5 Figtree 500 · microcopy ≥14 (tablet ≥16).
- Numerals luôn `font-variant-numeric: tabular-nums` (digit roll không nhảy width).

## 6. Spacing system

Base 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80`. Screen gutter
16 (mobile) / 24 (tablet) / 32 (desktop). Khoảng cách giữa 2 touch target kế
nhau ≥ 8px (skill: Touch Spacing — Medium).

## 7. Layout / grid

- **Header = sign band** full-width deep green: tên chợ + mission tabs (từ
  challenges.json) + wallet strip (budget còn lại dạng bar + numeral) — luôn
  hiện ở mọi screen.
- **Market screen**: cột trái = 4 stall band xếp dọc (FRUIT / BAKERY / DRINKS /
  SNACKS), mỗi band: awning sọc + scallop mép dưới + 2 product card trên "kệ"
  (shelf line hairline); cột phải (≥1024px) = **basket panel** sticky ("basket
  drawer"); <1024px basket thành panel dưới cùng mở/closed bằng button thật.
- **Checkout screen** (thay thế market view, không modal overlay che chợ):
  cashier counter — wallet tokens hàng trên, cashier tray giữa, pay/change
  status + receipt bên; ESC/button "Back to market" quay lại (giữ basket).
- Content max-width **1160px** desktop; **tablet 1024×768 là hero viewport**.
- Không grid card đều tăm tắp: stall band full-width với items bên trong, price
  tag xoay lệch ngẫu nhiên nhẹ theo item (imperfect), shelf line liên tục —
  ngôn ngữ kệ chợ, không phải dashboard grid.

## 8. Touch-target rules

- Primary CTA (Pay, Add to basket, Confirm change): **≥56px** cao.
- Standard control (stepper +/-, remove, mission tab): **≥48×48px**.
- Coin/note token: hình **≥52px** (coin tròn 52px, note 64×36 bo góc) + hit area
  ≥56px (padding trong suốt); spacing ≥8px.
- Drag token → tray: drop zone tray **phình +16px khi đang kéo** và nhận drop
  trong bán kính rộng (forgiving); tap-to-add button luôn tồn tại song song
  (drag là enhancement — skill: Dragging Alternatives severity High).
- Không interaction nào phụ thuộc hover.

## 9. Illustration language

- **SVG code-native 100%** cho mọi illustration (spec asset strategy): produce
  (apple, banana, strawberries, roll, bun, lemonade, milk, crackers), coin/note
  token, basket đan, awning, price tag, receipt, stamp — inline SVG vector phẳng
  **viền ink 2px + hard offset shadow 2px** (sticker language), mép hơi lệch
  (ellipse/đường không đối xứng tuyệt đối) = flat hơi imperfect theo thesis.
- Registry art trong component (`svg` key JSON → renderer), content 100% JSON.
- Không emoji làm visual; không raster cho icon/UI; không text nhúng trong ảnh.
- **Không dùng Codex raster** cho project này: mọi hình là SVG original — texture
  nền nếu cần dùng procedural CSS (repeating-linear-gradient sọc rất nhạt cho
  awning; paper phẳng không grain). Đơn giản, 0 asset ngoài.
- Màu illustration khóa theo tokens §4; mỗi món 1–2 accent + ink outline.

## 10. Feedback states

| Trạng thái | Biểu hiện |
|---|---|
| Press | scale 0.97 + hard shadow collapse, 120ms |
| Hover (desktop) | lift 2px + tag thẳng lại 0°, 160ms |
| Focus-visible | ring ink 2px + gap paper, không bao giờ remove |
| Add to basket | ghost item bay shelf→basket 300ms + total digit-roll 200ms + bump basket icon |
| Over-budget | coral tag "N over" + icon ↑ + copy gợi ý; Pay button disabled kèm lý do bằng chữ |
| Pay token | token bay vào tray 300ms; paid total count-up từng token |
| Exact pay | nhãn "Exact amount!" + icon ✓ (kể cả khi change = 0) |
| Change wrong | chênh lệch bằng lời ("That's 7 — you need 6"), KHÔNG shake, KHÔNG đỏ chói |
| Mission complete | receipt in trượt lên ≤500ms + stamp delight ≤900ms + live-region text |

Live region `aria-live="polite"` cho total/feedback; số luôn đọc kèm đơn vị
("18 of 30 tokens").

## 11. Motion budget

Từ spec (khóa): feedback 120–220ms · spatial 250–500ms · delight ≤900ms · không
intro khóa thao tác · ease tự nhiên (`power2.out`, `expo.out`; `back.out(1.6)` chỉ
cho coin pop/stamp delight) · không bounce/elastic trang trí, không slot-machine.

Chỉ định GSAP (wrapper `src/app/lib/gsap.ts` register 1 lần + matchMedia
reduced-motion):
- item ghost shelf→basket: tween arc (x,y + scale 0.6) 300ms expo.out.
- basket total: digit roll strip translateY 200ms power2.out (tabular nums).
- budget bar fill: width tween 180ms power2.out; over→coral hatch 200ms.
- paid total / change count-up: gsap.to({val}) snap 1, 400–700ms power2.out —
  hỗ trợ comprehension (đếm theo từng token), KHÔNG slot-machine.
- coin/note vào tray: fly 300ms + settle pop `back.out(1.6)` ≤450ms tổng.
- receipt: y+opacity slide 450ms expo.out; stamp scale-in 500ms delay 150ms
  (tổng ≤900ms, không khóa nút).
- stall reveal load: stagger 40ms, mỗi band ≤400ms opacity+y; input không bị chặn.

**prefers-reduced-motion** (gsap.matchMedia): count/total hiện tức thì, ghost fly
bỏ, giữ opacity fade ≤150ms, stamp/reveal hiện final state. App chơi 100% không
motion.

## 12. Responsive strategy

- **Tablet 768–1199 = hero viewport** (spec: learning sample ưu tiên tablet):
  thiết kế trước ở 1024×768 — sign band + stall bands + basket panel dưới
  (portrait) hoặc phải (landscape ≥1024).
- **Desktop ≥1200**: thêm không khí (stall rộng hơn, max-width 1160), đồng thời
  thấy chợ + basket + budget; không scale mọi thứ lên vô nghĩa.
- **Mobile 390–844**: `supported` — target ≥48px giữ nguyên, basket thành panel
  cuộn dưới cùng, checkout stack dọc; token tap-to-add (drag optional trên touch);
  test thật 390×844 trước khi chốt `mobile.webp`; không horizontal scroll.
- Breakpoints: `480 / 768 / 1024 / 1200`. 200% zoom reflow (không 2 chiều scroll).

## 13. Accessibility constraints

- Semantic HTML trước ARIA; `lang="en"`; landmarks header/main; mission là tab
  list thật (`role="tablist"` + arrow keys) hoặc buttons; total là heading/aria
  output.
- Mọi control là `<button>` thật; product card = button "Add"; basket stepper
  +/-/remove button; token = button (drag enhancement riêng, không thay button).
- **Keyboard path đầy đủ (definition of done)**: Tab qua mission tabs → stall
  items (Enter = add) → basket steppers → "Go to checkout" → tokens (Enter =
  put in tray) → tray tokens (Enter/Backspace = take out) → Pay → change build
  → Confirm → New mission. ESC ở checkout quay lại chợ. Không bắt keyboard user
  mô phỏng kéo pixel.
- Focus-visible luôn hiện, không trap; focus moves vào screen mới khi đổi screen.
- Live region polite cho total/paid/feedback; không assertive.
- Không color-only; không hover-only; không time pressure; copy không trừng phạt.
- localStorage: chỉ mission completion ẩn danh + reset button trong footer.
  Không dữ liệu cá nhân.

## 14. Anti-patterns (cấm)

1. Claymorphism / soft-3D / double shadow nhựa / glassmorphism / neon / 3D —
   mâu thuẫn flat sticker (loại theo pilot).
2. Gradient tím–xanh AI; gradient trang trí (chỉ sọc awning repeating phẳng).
3. Card-inside-card soup; dashboard SaaS; ecommerce conversion patterns (cart
   badge đỏ, upsell, promo) — skill ecommerce pattern bị loại theo spec.
4. Emoji làm icon/visual chính; icon raster.
5. Đỏ chói trừng phạt / shake / buzz âm lỗi.
6. Bounce/elastic trang trí; slot-machine motion; ambient loop vô hạn; intro
   chặn input.
7. Hover-dependent; touch target <48px; text quan trọng <16px trên tablet.
8. Tiền thật / ký hiệu tiền quốc gia / checkout thật / quảng cáo.
9. Hard-code content trong component (mọi giá/mission từ JSON).
10. Runtime CDN (font, GSAP, ảnh); absolute path `/assets/...` (dùng `./` base).

## 15. Đối chiếu UI UX Pro Max → giữ / loại

| Skill recommendation | Quyết định |
|---|---|
| Flat Design (bold colors, clean lines, 150–200ms transitions) | **GIỮ** — trùng thesis flat; thêm sticker shadow 2px cho tag |
| Neubrutalism (hard border 3px + shadow 4px everywhere) | **LOẠI phần lớn** — chỉ giữ hard offset shadow cho price tag/receipt (signage sticker), không border đen khắp nơi |
| Claymorphism cho educational app | **LOẠI** — phá flat imperfect (§14.1) |
| Palette "Plant Care" nature green + sun yellow | **THAM KHẢO** — nhưng khóa theo thesis: deep green #1E5B3E + butter #F7C64B + coral (spec thắng) |
| Touch target 44/48 + spacing ≥8px | **GIỮ + siết** ≥48px, coin ≥52px (đối tượng 7–11, thao tác token) |
| Dragging Alternatives (non-drag path bắt buộc, severity High) | **GIỮ** — tap-to-add button song song mọi drag (§8) |
| Error messages announced (aria-live/role=alert, High) | **GIỮ** — live region polite cho mọi feedback tiền |
| Alt text (High), contrast 4.5:1 (High) | **GIỮ** — mọi SVG có aria-label/alt; palette đã check contrast §4 |
| Number formatting (thousand separator) | **LOẠI** — số ≤60 units, trẻ 7–11 đếm thẳng; giữ numeral + coins minh họa |
| Loading skeleton (High) | **GIỮ (dùng dạng signage)** — stall band skeleton nhạt khi fetch JSON, error state có message + retry |
| Continuous animation chỉ cho loading | **GIỮ** — không ambient loop |
| Stagger list 0.02–0.04s, expo/power out, back.out chỉ delight | **GIỮ** (§11) |
| gsap.matchMedia reduced-motion → final state ngay | **GIỮ** (§11) |
| GSAP SplitText headline | **LOẠI** — không cần; signage type đủ mạnh không char-split |
| Ecommerce checkout conversion patterns | **LOẠI** — đây là learning simulation (spec choreography) |
