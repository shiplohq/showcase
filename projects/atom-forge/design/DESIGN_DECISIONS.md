# DESIGN_DECISIONS — Atom Forge (Showcase #14)

> Khóa design system cho showcase #14. Nguồn: spec `.showcase/14_atom-forge.md`
> (visual thesis **Swiss scientific poster + kinetic particles** đã khóa) + đối chiếu
> UI UX Pro Max (queries: `swiss international typographic poster`,
> `drag and drop interaction touch targets forgiving`, `reduced motion prefers-reduced-motion`,
> `color contrast accessibility text legibility`, `font pairing grotesque geometric sans numerals`,
> `technical grotesque monospace display font scientific data`, `mission based progression levels education game`,
> `particle model atom electrons shells visualization`, domain `gsap`).
> Brief thắng recommendation: mọi gợi ý của skill mâu thuẫn Swiss-poster flat đều bị loại (§15).
> Huashu **không invoke** — art direction đã khóa trong spec.

## 1. Visual thesis

**Swiss scientific poster + kinetic particles.** Cả app là một tờ poster khoa
học in trên giấy off-white: lưới chặt, hairline rules, khối số lớn, chú thích
mono như nhãn instrument. Nguyên tử là hình vẽ kỹ thuật vector rõ nét — nucleus
là chùm đĩa phẳng, shell là vòng tròn nét mảnh kèm nhãn sức chứa. Particle
"sống" bằng vi chuyển động cực nhẹ (thermal jitter ≤2px, luôn chết khi
reduced-motion) — poster vẫn là **poster in**, không phải sci-fi neon.

Từ khóa: swiss grid · off-white warm paper · ultramarine · safety orange ·
charcoal ink · hairline rules · oversized numerals · mono annotations ·
flat vector particles · instrument readouts · calm precision.

Không giống 13 identity đã ship (đặc biệt #03 Bauhaus blueprint dùng primary
red/blue/yellow + hard 4px shadows, #04 vintage star chart dùng serif celestial
map): Atom Forge là **grotesque poster trắng** — không hard-shadow block, không
serif, không texture giấy vintage; màu chỉ ultramarine/orange/charcoal trên
giấy,.shadow gần như không tồn tại (nếu có là 1px pressed line).

## 2. Target users

11–15 tuổi, mới học proton/neutron/electron, atomic number, isotope, ion ở mức
nhập môn. Hệ quả thiết kế:

- Đọc tốt nhưng vẫn cần copy ngắn, thuật ngữ luôn kèm định nghĩa 1 dòng
  ("proton — positively charged particle in the nucleus").
- Số lớn là ngôn ngữ chính: Z, N, e, charge luôn hiện dạng numeral lớn + label mono.
- Không time pressure, không điểm số; progression = missions đã forge.
- UI copy **English**, nhất quán (quyết định của orchestrator; spec cho phép
  vì sample là educational showcase tiếng Anh cho 11–15).

## 3. Interaction model

1. **Build bằng particle, không phải bởi nút "đáp án"** — mỗi particle đặt vào
   nucleus/shell là một hành động vật lý; counters cập nhật từng bước.
2. **Identity luôn hiện live** — đặt bao nhiêu proton, readout hiện element
   đó ngay (6 protons = Carbon) — Z định nghĩa element, dạy qua phản hồi trực tiếp.
3. **Shell là khái niệm có sức chứa** — ring hiển thị `n/capacity` (vd `4/8`);
   đầy → ring "seals" một nhịp; đặt electron vào shell trong khi shell trong
   còn chỗ → readout nhắc quy tắc fill-inner-first (không chặn, dạy).
4. **Mission auto-forge khi build khớp** — đúng element + isotope + charge →
   element name reveal typographic (≤900ms) + explanation panel. Không có nút
   "check" tách rời — bản build đúng tự nó là câu trả lời (spec: "When valid,
   element name reveal bằng typographic transition").
5. **Lỗi không trừng phạt** — build sai là thông tin, không phải lỗi: readout
   giải thích đang có gì, thiếu gì ("That's 7 protons — Nitrogen. This mission
   asks for Carbon (6).").
6. **Mọi thứ đảo ngược được** — bấm particle đã đặt = trả về tray; không mất
   tiến độ, không reset cưỡng bức.
7. **Simplified model được khai báo** — mọi forge screen có ghi chú cố định:
  "Simplified shell model — real atoms are more complex" (spec acceptance).

## 4. Color tokens

Swiss scientific palette — 4 màu chính + trạng thái shape/text cue, không bao
giờ color-only. Flat, không gradient (trừ khi CSS procedural hairline).

### Paper & ink (neutrals)

| Token | Hex | Vai trò |
|---|---|---|
| `--paper` | `#F3F0E8` | Nền chính — giấy off-white ấm |
| `--paper-dim` | `#EAE6DA` | Vùng recessed (tray rail, shell field nền nhạt hơn) |
| `--ink` | `#23262B` | Text chính, rules, nucleus neutron (contrast 13.6:1 trên paper) |
| `--ink-soft` | `#565B63` | Text phụ, neutron particle (7.2:1) |
| `--line` | `#C9C3B4` | Hairline nhạt (không mang nghĩa) |
| `--rule` | `#23262B` | Rules cấu trúc 1px (đậm, mang nghĩa cấu trúc) |

### Signal colors (khoá bởi spec thesis)

| Token | Hex | Vai trò |
|---|---|---|
| `--ultramarine` | `#2C39C9` | Electron · primary action · "forged" state (7.9:1 text trên paper) |
| `--ultramarine-deep` | `#1F2AA6` | Pressed/focus-halo |
| `--orange` | `#E8501A` | Proton · safety accent (graphics + large text ≥24px only: 3.7:1) |
| `--orange-deep` | `#B93D10` | Proton ở cỡ text nhỏ (4.9:1) |
| `--orange-wash` | `#FBE3D6` | Nền highlight proton/nudge |
| `--neutron` | `#4A5057` | Neutron disc (đậm hơn ink-soft một bậc để đồng cấp với p/e; cập nhật từ assessment) |

### Trạng thái (luôn kèm shape + text)

- **Forged/complete** = `--ultramarine` fill + stamp mark (✓ hình học SVG) + chữ "FORGED".
- **Nudge/teach** = `--orange-wash` nền + icon mũi tên vòng + câu copy hướng dẫn.
- **Focus-visible** = outline 2px `--ink` offset 2px, mọi surface; không bao giờ remove.
- **Particle colors là danh tính cố định**: proton=orange `+`, neutron=ink-gray,
  electron=ultramarine — dùng shape ký hiệu (p+: đĩa có dấu +, n: đĩa trơn,
  e⁻: đĩa có dấu −) để không phụ thuộc màu (color-blind safe).

## 5. Typography

| Vai trò | Font | Weights | Ghi chú |
|---|---|---|---|
| Display / element name reveal / số lớn | **Archivo** (OFL, Omnibus-Type) | 600–800 | Grotesque poster đúng chất Swiss; numerals rõ, tabular |
| Body / UI | **Archivo** | 400–600 | Một họ grotesce duy nhất cho mạch chữ |
| Data labels / annotation / counters phụ | **Spline Sans Mono** (OFL, Sharp Type) | 400–600 | Chất instrument readout cho Z/N/e/charge, tracking rộng |

- Self-host qua `@fontsource/archivo` + `@fontsource/spline-sans-mono` (bundle —
  **không Google Fonts runtime**, đúng repo font policy).
- Subsets: UI tiếng Anh → import `latin-*` + `latin-ext`; Archivo thêm
  `vietnamese-*` (phòng备 copy có dấu, chi phí nhỏ). Font gate `check:fonts`
  chạy trên live trước khi coi xong.
- Scale (tablet-first): element reveal `clamp(56px, 9vw, 112px)/0.95` Archivo 800
  tracking −0.02em · screen title 34–44 Archivo 800 · section label 13–14 mono
  600 uppercase +0.12em · body 16–18/1.5 Archivo 400 · counters lớn 40–64
  Archivo 800 `tabular-nums` · microcopy ≥13 (≥15 tablet).
- Conformance pass (assessment #14): mọi HTML microcopy ≥13px (mono-label,
  zone title/count, tray hint/label, strip readout, model-note, stamp, tag,
  teach lead, reveal note); SVG canvas annotation 22 viewBox units (≥13px
  rendered ở mọi viewport có canvas); numeral Z trong strip tile 13px.
- Khác biệt với neighbors: không dùng Space Grotesk/IBM Plex Mono (#03/#04),
  Fraunces (#02/#08/#09), Bricolage (#06), Baloo (#01/#08).

## 6. Spacing system

Base 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`.
Gutters: 16 (mobile) / 24 (tablet) / 40 (desktop). Khoảng cách giữa 2 control
kề nhau ≥ 8px (skill: Touch Spacing — Medium).

## 7. Layout / grid

- App = single-page state (không router — spec static-hosting rule). 2 screen:
  **Ledger** (mission list) và **Forge** (builder); Reveal là overlay trên Forge.
- **Ledger = bảng danh sách kiểu poster, KHÔNG card grid**: mỗi mission là một
  hàng ngang full-width với số thứ tự lớn (mono), target isotope notation
  (²³Na), tên element, trạng thái FORGED/OPEN/LOCKED — như bảng chỉ mục cuối
  poster khoa học. Periodic mini-strip chạy ngang dưới header như dải chất liệu.
- **Forge = grid 3 cột** (desktop ≥1200): trái = mission brief + counters
  (Z/N/e/charge cột số lớn); giữa = atom canvas (nucleus + shells, chiếm cao
  nhất); phải/phải-dưới = particle tray (3 particle token + nguồn vô hạn theo
  loại — tray là "nguồn", không phải inventory đếm dần) + controls.
- Tablet 768–1199 (hero): mission brief thu thành header strip phía trên,
  counters dưới canvas thành hàng ngang, tray thành dock ngang dưới đáy.
- Mobile <768: stack dọc: brief → canvas → counters → tray dock; canvas thu
  vừa, KHÔNG thu touch target.
- Content max-width 1360px; hairline rules chia vùng (không card border-radius).
- Atom canvas: nucleus ở tâm, shell rings đồng tâm; ring i bán kính tăng đều;
  mỗi ring có nhãn mono `SHELL 2 · 4/8` đặt ở góc 45°.

## 8. Touch-target rules

- Mọi control ≥ **48×48px** (activity screens; vượt khuyến nghị 44 vì đối
  tượng 11–15 dùng touch tablet nhiều). Stepper dùng `var(--touch)` = 48px —
  conformance pass assessment #14 siết về đúng token (trước đó 44px).
- Drop zone "phình" khi drag: ring halo +16px & nucleus halo r+16 khi hover
  (assessment #14 bổ sung §8).
- Particle token trong tray: đĩa ≥52px + hit area ≥56px.
- Stepper add/remove cạnh nucleus & mỗi shell: nút ≥48px, icon +/- rõ + sr text.
- Drop zone phình +16px khi drag đang hoạt động; snap radius lớn (hit trong
  vành ring là đủ, không cần chính xác từng điểm).
- Không hover-only: mọi hover enhancement đều có trạng thái focus/active tương đương.

## 9. Illustration language

- **SVG/CSS code-native 100%** — không raster, không Codex asset (dự kiến
  NONE; texture giấy không cần — poster flat là chủ ý). Mọi hình là inline SVG
  built từ primitives: đĩa particle, vòng ring, dấu +/− ký hiệu.
- Particle primitives (dùng lại mọi nơi — tray, canvas, legend):
  - proton: đĩa orange + dấu "+" trắng ở tâm;
  - neutron: đĩa ink-soft trơn (chấm nhỏ ở tâm);
  - electron: đĩa ultramarine nhỏ hơn + dấu "−" trắng.
- Nucleus: các đĩa p/n pack gần tâm theo vòng spiral phẳng (positioned by
  engine, không physics simulation — spec cấm dùng animation mô phỏng vật lý thật).
- Shell ring: stroke 1.5px ink ở 55% opacity + tick marks 12 cung; electron
  đứng trên ring phân bố đều.
- Rules & khung: hairline 1px; không rounded card; bo góc tối đa 2px (chỉ nút).
- Số lớn là đồ họa: Z counter 64px Archivo 800 + label mono dọc bên cạnh.

## 10. Component primitives

| Primitive | Mô tả |
|---|---|
| `ParticleDisc` | SVG disc p/n/e với sign glyph; prop size; dùng ở tray/canvas/legend |
| `AtomCanvas` | SVG đồng tâm: nucleus cluster + shell rings + electrons + labels |
| `ParticleTray` | 3 token kéo được + hướng dẫn "or use the buttons" |
| `ZoneStepper` | Cặp nút +/− (≥48px) gắn nucleus/shell — keyboard/touch path thật |
| `CounterStack` | Z / N / e / charge: numeral lớn + mono label + live region |
| `IdentityReadout` | "6 protons → Carbon" live; isotope notation ᴬZ X; charge signed |
| `MissionRow` | Hàng ledger: index mono, notation, tên, status stamp |
| `PeriodicStrip` | 20 tile đầu bảng tuần hoàn; target highlight, forged stamp |
| `RevealOverlay` | Element name typographic reveal + giải thích isotope/charge/shell |
| `ShellCapacityTag` | `4/8` mono trên ring; full → seal mark |

## 11. Feedback states

| Trạng thái | Biểu hiện |
|---|---|
| Press | nút lún 1px (pressed line), 120ms |
| Hover (desktop) | đĩa particle lift 1px + rule đậm hơn — enhancement only |
| Focus-visible | outline 2px ink offset 2 — luôn hiện |
| Particle placed | bay tray→zone 280ms + pop scale 0.85→1 160ms |
| Shell full | ring pulse 1 nhịp 450ms + tag `8/8` chuyển seal mark |
| Wrong-ish build | readout dạy: hiện element thực tế + câu "mission asks for…" |
| Blocked add | inline note mono cạnh zone ("Shell 2 holds 8 — it's full"), không shake |
| **Forged** | element name reveal ≤900ms + stamp trên periodic strip + arrow next |
| Drag active | token ghost theo pointer; zone hợp lệ sáng lên (thêm stroke); zone sai im lặng không nhấp nháy đỏ |

Live region `aria-live="polite"` cho counters và teaching copy. Không âm thanh
(không audio trong scope này — spec: audio optional).

## 12. Motion budget (GSAP, purposeful only)

Khóa bởi spec: feedback 120–220ms · spatial 250–500ms · delight ≤900ms ·
không intro khóa thao tác · ease tự nhiên (`power2.out`, `expo.out`); không
bounce/elastic. Không dùng animation để mô phỏng vật lý thật (electron orbit
KHÔNG quay khi thao tác; orbit minh hoạ chỉ hiện ở Reveal như diagram tĩnh —
spec GSAP note).

- Particle fly tray→zone: 280ms `power2.out` (spatial continuity).
- Placed pop: 160ms scale (feedback).
- Shell full pulse: 450ms opacity+stroke (comprehension — capacity).
- Element reveal: chữ Archivo 800 rise 24px + tracking tightening, 700ms
  `expo.out` + stagger 30ms/layer (delight).
- Ledger row → Forge: crossfade 250ms, không parallax.
- Thermal jitter particle (nucleus): ≤2px random 1.2s loop, CHỈ khi
  `prefers-reduced-motion: no-preference`, pause khi offscreen — poster "sống"
  đúng mức kinetic particles của thesis.

**prefers-reduced-motion**: mọi tween qua wrapper `lib/gsap.ts` → set final
state tức thì; jitter/loop bị kill; chỉ còn opacity/focus cues ≤150ms.

## 13. Responsive strategy

- **Tablet 768–1199 = hero viewport** (spec: learning sample): canvas lớn,
  tray dock dưới, counters hàng ngang. Thiết kế tablet TRƯỚC.
- **Desktop ≥1200**: 3 cột đầy đủ, thêm whitespace, max-width 1360.
- **Mobile 360–479**: `limited` dự kiến — stack dọc, tap-path (token → nút
  zone) là primary; drag pointer vẫn hoạt động nhưng màn nhỏ; quyết định
  screenshot thật ở 390×844, khai `mobileSupport` đúng thực tế. Không ép
  thiết kế gãy; nếu không đạt → `unsupported` + note (spec cho phép).
- Breakpoints: `480 / 768 / 1024 / 1200`. Không horizontal scroll ở mọi BP;
  200% zoom reflow được (không layout cứng px lớn).

## 14. Accessibility constraints

- Semantic HTML trước ARIA; `lang="en"`; landmarks header/main; mission là
  heading; counters là `<output>`/text thật.
- **Keyboard path đầy đủ (definition of done)**: mỗi zone (nucleus, shell i)
  có `ZoneStepper` nút thật `+ proton / + neutron / + electron / −` — thêm và
  bớt particle hoàn toàn bằng bàn phím/tap; drag pointer là enhancement.
  Không bắt keyboard user mô phỏng kéo pixel.
- Focus-visible luôn; tab order: brief → counters → canvas zones (nucleus →
  shell ngoài vào) → tray → strip; ESC đóng Reveal.
- Live region polite cho identity/teach copy; không assertive.
- Không color-only (particle có sign glyph + label chữ); không hover-only;
  không time pressure; error copy dạy, không trừng phạt.
- Particle counts luôn text: mỗi zone có count text thật (`Nucleus: 6p · 6n`),
  screen reader đọc được; canvas SVG có `role="img"` + aria-label mô tả build.
- localStorage: chỉ `atom-forge.progress` (danh sách mission đã forge) + reset
  nút ở Ledger — anonymous, không dữ liệu cá nhân.

## 15. Đối chiếu UI UX Pro Max → giữ / loại

| Skill recommendation | Quyết định |
|---|---|
| Minimalism & Swiss Style (grid, high contrast, no decoration, geometric sans) | **GIỮ** — trùng thesis; siết thêm bởi spec |
| Bauhaus style (hard 4px offset shadows, primary red/blue/yellow, 0ms transitions) | **LOẠI** — đã là identity #03; shadows phá poster in (spec: tránh shadow dày) |
| Touch ≥44px + spacing ≥8px + touch-friendly resize | **GIỮ + siết** ≥48px (§8) |
| Contrast ≥4.5:1, no color-only (High severity) | **GIỮ** (§4) — orange chỉ large-text/graphics, text nhỏ dùng orange-deep |
| Focus ring 3–4px accessible-and-ethical | **GIỮ** dạng 2px offset 2px (đủ rõ trên paper, không phá hairline aesthetic) |
| prefers-reduced-motion kill loops + final state (skill GSAP notes) | **GIỮ** (§12) |
| Outfit/Work Sans, Plus Jakarta pairings | **LOẠI** — chọn Archivo + Spline Sans Mono (đúng chất hơn & chưa dùng ở #01–#10) |
| Word-cloud/sentiment chart rec (query particle model) | **LOẠI** — không phải data-viz app |
| Claymorphism/vibrant block-based (casual puzzle game rec) | **LOẠI** — phá flat poster |
| Haptic feedback navigator.vibrate | **LOẠI** — tablet web, không đáng tin; feedback visual là chính |
| Kinetic typography style (typing effects, SplitText) | **GIỬ một nửa** — chỉ element-name reveal; không typing loop |

## 16. Bản bổ sung assessment cuối (pre-live, 2026-09-09)

Kết quả của critique kép (design review 36/40 + deterministic detector) —
các quyết định dưới đây giờ là một phần của design system đã khóa:

- **Callout = top-rule, không bao giờ side-tab**: `.identity`, `.teach`,
  `.reveal__concept` dùng `border-top: 2px` màu signal (ultramarine/orange)
  thay vì `border-left: 3px` — rule ngang là thiết bị cấu trúc của hệ thống
  (app-header, mission-rows, counters, strip đều dùng rule ngang); side-tab
  accent là tell UI AI-generic (3 finding detector, đã fix, detector sạch).
- **Tray = dock ngang 3-across** ở mọi viewport (§7 "dock ngang"); token
  vertical chip ≥768 (đĩa trên, label dưới), hit area ≥56px. Tray dọc 3 hàng
  cũ cao 247px — nguyên nhân trực tiếp viewport tablet tràn.
- **Tablet band 768–1199**: periodic strip ẩn trên Forge (chỉ ledger và
  desktop ≥1200) — strip là tư liệu tham khảo, có ở ledger một chạm; nhường
  chỗ cho canvas + readout + teach note vừa 1024×768 không scrollbar.
- **Mission brief = disclosure**: copy bị clamp 2 dòng (≤840px height) /
  1 dòng (≤800px) kèm nút "Brief ▾/▴" để học tự mở — curriculum do learner
  kiểm soát, không do layout cắt luôn (finding P1 của assessment A).
- **Canvas labels**: anchor 135° (top-left) — anchor 45° cũ đẩy nhãn
  SHELL 3/4 ra ngoài viewBox (clip ở MỌI viewport); 24 view-units để rendered
  ≥13px ở mọi viewport có canvas (mobile gutter 16px <480).
- **Jitter chỉ nucleus** (`g.af-nucleon`): electron không bao giờ tự động
  chạy (§12 — không animation giả lập vật lý). Nucleus packing factor
  12.5 → 11 để 44 đĩa (20p+24n) vẫn nằm gọn trong shell 1.
- **Reveal overlay nằm NGOÀI root `.forge`** — root được gắn `inert` khi
  overlay mở; render dialog bên trong subtree inert khiến user thật không
  click/focus được (script-click từng che bug này). Focus return về bench
  bằng rAF sau khi inert được gỡ.
- **Teach priority**: inner-first (shell rule) lên thứ hai, chỉ sau
  element-identity, và sinh ra mọi khi đúng element (kể cả charge còn sai) —
  chống bị 2-line budget che mất bài học lõi (finding P2 của assessment A).
- **TARGET 15px/600** — mục tiêu mission phải nặng hơn counters trạng thái
  trong một learning tool (trước đó 13px, nhỏ nhất màn hình).
- **Counters = grid 2×2 cố định** + charge full-row; auto-fit sinh nhịp
  bước bậc ngẫu nhiên ở một số bề rộng rail.
- **Danger armed state**: nút destructive pre-arm y hệt ghost, armed
  ("Really clear? Tap again") chuyển orange-deep + dashed — khoảnh khắc
  hệ quả được signal bằng hình, không chỉ bằng chữ.
- **Free-electron honesty**: proton = 0 nhưng charge ≠ 0 → sub-copy
  "no nucleus yet — free electrons" thay vì "anion" (electron trơ trọi
  không phải ion).
- Contrast numbers thực đo (điều chỉnh từ bảng §4): ink-soft trên paper
  **6.0:1**, ultramarine text **7.3:1**, orange **3.3:1** (graphics/large
  text only — giữ nguyên giới hạn sử dụng), orange-deep **4.9:1**. Vai trò
  màu không đổi, vẫn đạt ngưỡng vai trò của nó.

Không đổi (backlog ghi nhận): delta announcement cho live region (hiện
thông báo full summary mỗi hạt — chatty ở build lớn), receipt re-open sau
khi dismiss, skip-to-strip link sau mission list, dead-space trên ledger
900px, phổ biến "Next up" cho sighted users.
