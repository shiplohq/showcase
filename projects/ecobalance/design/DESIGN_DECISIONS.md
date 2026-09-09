# DESIGN_DECISIONS — EcoBalance (Showcase #13)

> Khóa design system cho showcase #13. Nguồn: spec `.showcase/13_ecobalance.md`
> (visual thesis đã khóa: "Natural-history field guide + tactile diorama: forest
> green, clay, sky, cream; species minh hoạ silhouette/linocut; chart nhỏ như
> field notebook") + đối chiếu UI UX Pro Max (queries:
> `ecosystem simulation learning game population dynamics`,
> `population dynamics line chart education visualization`,
> `simulation sandbox cause effect feedback systems thinking children`,
> `vintage scientific naturalist field guide illustration style`,
> `nature forest green earth palette education calm`,
> `simulation controls play pause step reset slider accessibility`,
> `serif display font vietnamese subset editorial`,
> `monospace font tabular numbers data annotation`).
> Domain naturalist/linocut: **không có match trực tiếp trong styles.csv** (skill
> chỉ ra tactile-digital và vintage-film — đều không phải field guide) — art
> direction đi theo thesis khóa của spec. Chart guidance (line chart cho trend,
> "expose every value as text" từ a11y note của skill) được GIỮ. Brief thắng
> recommendation: mọi gợi ý mâu thuẫn diorama + field-notebook đều bị loại (§15).

## 1. Visual thesis

**Natural-history field study.** App là một **field station của nhà tự nhiên
học**: bên trái là **tấm diorama lớn** (một hộp cảnh sinh thái nhìn ngang — các
dải phẳng sky → ridge → hills → ground xếp lớp như stage set, loài là
**silhouette linocut đặc màu** đứng rải trên dải tương ứng); bên phải là **cuốn
sổ thực địa vẽ ô ly (graph-paper notebook)** — nơi mọi con số được ghi như
*specimen count*: số liệu mono, dòng kẻ ly, chú thích cause-of-change viết như
field annotation. Không dashboard, không card grid: diorama là sân khấu, notebook
là chỗ ghi số liệu quan sát. Một dải "expedition label" mỏng đóng vai header.

Từ khóa: natural-history museum · linocut silhouette · flat layered diorama ·
graph-paper notebook · specimen counts · forest green & clay & sky & cream ·
field annotation · calm, observant, hands-in-the-dirt.

**Phân biệt bắt buộc với hàng xóm khái niệm gần nhất** (đã ship / đang bay):
- **#07 vocabulary-expedition (gouache field journal)** — chung dòng "field
  journal" nhưng #07 = *tranh gouache số hoá, viền mềm nét cọ, museum caption,
  sunlit cream + sepia*. EcoBalance = **silhouette mực đặc 2-tông, không
  painterly wash**, Notebook = **ô ly kỹ thuật (graph grid)**, voice = số liệu
  quan sát (mono) thay vì caption bảo tàng. Palette #13 lạnh/xanh hơn (forest
  green + slate sky chủ đạo, clay chỉ là đất + tín hiệu giảm).
- **#08 phonics-forest (Nordic woodcut)** — #08 = hatch carve, khắc gỗ sách
  tranh, Fraunces serif tròn. EcoBalance = **mảng đặc phẳng, KHÔNG hatch**,
  hình học mạnh, Plex superfamily + chart là thành phần UI chính (spec đòi
  chart) — #08 không có data layer.
- **#12 human-body-lab (anatomy, in flight)** — chia sẻ "lab" về tinh thần;
  #13 giữ chất ngoài trời (sky band, đất, silhouettes động vật) thay vì cơ thể.

## 2. Target users

Học sinh **10–14 tuổi** đang học food web, carrying capacity, tác động của việc
thay đổi một loài. Hệ quả:

- Copy tiếng Anh rõ, câu ngắn, thuật ngữ khoa học đi kèm giải thích một dòng
  ("Carrying capacity — how many the meadow can feed").
- Con số là "đồ dạy học": population luôn hiện số thật (mono, tabular), không
  chỉ bar/hình.
- Không thắng/thua kịch tính: thất bại = "the meadow tipped" + mời đọc notes;
  không timer, không điểm.
- **Model caveat hiển thị** (spec: không giả là mô hình khoa học chính xác):
  "A simple teaching model — not a scientific forecast." nằm ở Model notes.
- Ngôn ngữ UI: tiếng Anh, nhất quán.

## 3. Learning interaction principles

1. **Diorama trước, số liệu song song** — người học thấy quần thể như sinh vật
   trong cảnh (silhouette enter/exit khi số lượng đổi) và đồng thời đọc con số
   trong notebook; hai khối luôn cùng màn hình.
2. **Quota là hành động can thiệp** — mỗi loài có slider −10…+10 ("release /
   remove"); kế hoạch áp dụng ở tick kế tiếp (discrete), hiển thị preview
   "+4 planned" trước khi áp.
3. **Step, không stream** — thời gian rời rạc: nút Step tiến đúng 1 season,
   Play tự step chậm (~1.4s) để đọc; Reset đưa về initial state của biome.
4. **Rule minh bạch từng bước** — sau mỗi tick, mỗi loài có dòng cause-of-change
   ("−4 eaten by fox · +2 born") ghép từ engine breakdown; Model notes mô tả
   rule của từng loài bằng lời (sinh từ JSON).
5. **Food web overlay** — bật lên trên chính diorama: mũi tên predator→prey,
   label "eats"; focus một loài làm sáng đường liên quan của nó.
6. **Challenge = field assignment** — thẻ nhiệm vụ (event từ JSON: drought,
   invasive, habitat loss) với target ranges; thành công khi mọi loài nằm trong
   range K turns liên tiếp; cùng seed → cùng chuỗi event (deterministic).
7. **Debrief chart luôn có textual summary** — chart đường nhiều loài trên ô ly
   + mỗi loài một dòng tóm tắt bằng chữ (start/peak/low/end).
8. **Không trừng phạt**: hộp thoại lỗi nhẹ nhàng, mọi can thiệp đảo ngược được
   (Reset; "Start season over").

## 4. Color tokens

Field-guide palette — giấy cream mát, xanh rừng sâu chủ đạo, đất clay, trời
xám-xanh. Mảng đặc phẳng; gradient chỉ dùng dạng **băng trời rất nhẹ** trong
diorama scene (không phải UI chrome).

### Neutrals (giấy & mực)

| Token | Hex | Vai trò |
|---|---|---|
| `--paper` | `#F2EEDD` | Nền chính (cream mát) |
| `--paper-raised` | `#FAF7EA` | Bề mặt notebook nổi |
| `--paper-deep` | `#E7E2CC` | recessed well / graph grid nền |
| `--grid` | `#D3CCAE` | Đường ô ly notebook |
| `--ink` | `#24301F` | Mực chính (≈12.9:1 trên paper) |
| `--ink-soft` | `#57604B` | Text phụ (≥16px / ≥18 bold) |
| `--line` | `#C6BFA2` | Hairline giấy |

### Landscape (diorama bands)

| Token | Hex | Vai trò |
|---|---|---|
| `--forest` | `#24462F` | Deep forest green — heading, primary button, viền plate (white 10.2:1) |
| `--forest-deep` | `#183221` | Bóng silhouette đậm nhất, pressed |
| `--leaf` | `#4D7A54` | Mid green — hill giữa, tăng trưởng |
| `--sage` | `#8FA982` | Hill xa, chi tiết phụ |
| `--sky` | `#AECCD1` | Band trời |
| `--sky-deep` | `#5F8894` | Slate sky — info accent, nước wetland |
| `--clay` | `#C08156` | Band đất / silhouette đất |
| `--clay-deep` | `#9C5238` | Clay text-safe (5.1:1 trên paper) — tín hiệu giảm, cảnh báo |
| `--sun` | `#E0B44C` | Mặt trời diorama, highlight nhỏ (không dùng cho text) |

### Trend & state (không bao giờ color-only)

| Trạng thái | Biểu hiện |
|---|---|
| Rising | tam giác ▲ (SVG) + chữ "rising" + màu `--leaf-deep` |
| Falling | tam giác ▼ + chữ "falling" + màu `--clay-deep` |
| Steady | chấm ● + chữ "steady" + `--ink-soft` |
| Extinct (0) | chữ "gone" + icon ✕-in-circle `--clay-deep` |
| Focus | vành `--ink` 3px offset 2px |
| Success band | `--forest` nhạt + icon laurel-branch + chữ |
| Not-this-time band | `--clay-deep` + icon notebook + chữ — KHÔNG đỏ chói, không shake |

## 5. Typography

**IBM Plex superfamily** (OFL) — chất "tài liệu kỹ thuật in": serif cho tiêu đề
tấm plate, sans cho UI, mono cho số liệu specimen. Cả ba family đều có subset
`vietnamese` trên fontsource (import đủ `latin`, `latin-ext`, `vietnamese`
mọi weight — rule pilot #01; UI tiếng Anh nhưng `check:fonts` đo cả mẫu dấu).

| Vai trò | Font | Weights | Ghi chú |
|---|---|---|---|
| Display / biome title / challenge title | **IBM Plex Serif** | 600, 700 | Chất plate in — tiêu đề "specimen" |
| Body / UI / controls | **IBM Plex Sans** | 400, 600, 700 | Sans trung tính rõ ràng |
| Data (population, turn, chart ticks, cause ledger) | **IBM Plex Mono** | 400, 500, 600 | Specimen-count voice; mono = tabular mặc định |

- Self-host `@fontsource/ibm-plex-{serif,sans,mono}` (bundle; không Google Fonts
  runtime).
- Scale (tablet-first): biome title `clamp(30px, 4.2vw, 46px)` Serif 700 ·
  section 20–24 Serif 600 · **population số ≥28px Mono 600** · body 16–18/1.5
  Sans 400 · cause ledger ≥14 Mono 400 (tablet ≥15) · microcopy ≥13 (tablet
  ≥14). `font-variant-numeric: tabular-nums` cho mọi số động.

## 6. Spacing system

Base 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80`. Gutters: 16
(mobile) / 24 (tablet) / 40 (desktop). Notebook row padding dọc 10–12; khoảng
giữa 2 control kế tiếp ≥8px.

## 7. Layout / grid

- App = **1 field desk full-viewport** (100dvh, không scroll ở 1024×768 và
  1440×900 — panel notebook tự scroll nội bộ khi chật): **diorama plate ~62% ·
  notebook ~38%**, header expedition-label mỏng (~56px) chỉ chứa wordmark nhỏ,
  biome name, mute-không-có (không audio), food-web toggle, Model notes, Reset.
- **Biome select**: trang bìa field guide — tiêu đề lớn + đoạn dẫn, 2 **biome
  plates** nằm ngang (stack dọc mobile): mỗi plate = mini-diorama SVG + tên +
  danh sách loài (silhouette strip) + nút "Open field study". Footer: progress
  challenges + Reset saved data. KHÔNG grid card đều — 2 plates có kích thước
  khác nhau chút (meadow lớn hơn — hero).
- **Diorama stage**: sky band (sun disc + cloud bars) → far ridge sage → mid
  hill leaf → ground clay (meadow) / water sky-deep + mud (wetland). Species
  tokens rải theo anchor zone có jitter seeded; vượt visual cap (12) → cụm dày
  + label số luôn hiển thị cạnh zone.
- **Notebook**: header "Field notes · Season 7" (turn mono) → species ledger
  (mỗi loài một row: silhouette chip + tên + số + trend chip + cause line +
  quota slider) → control strip (Step / Play / Reset) → challenge slot (thẻ
  assignment + targets + streak).
- **Food web overlay**: mũi tên cong trên stage giữa anchor các loài, stroke
  `--forest-deep` 2.5px + arrowhead; label "eats" nhỏ mono; bật/tắt bằng button
  (aria-pressed) ở header.
- **Debrief**: chiếm toàn bộ notebook area (hoặc toàn màn mobile) — chart
  multiline trên graph grid + legend + textual summary từng loài + nút
  "Run again" / "Back to biome". Đóng bằng Esc.
- Desktop ≥1280: plate max 1180 giữa, hai bên paper trống; line-length chữ
  ≤68ch. Không horizontal scroll mọi breakpoint.

## 8. Touch-target rules

- Mọi button (Step/Play/Reset/toggle/Open): **≥48×44px**; Step/Play ≥56px cao.
- Ledger row ≥44px cao; slider native `input[type=range]` hit ≥44px
  (styled track 32px + padding hit).
- Species chip / chart legend item focusable ≥44px.
- Spacing ≥8px giữa target; không hover-only (hover chỉ đậm outline desktop).

## 9. Illustration language

- **SVG code-native 100%, linocut silhouette đặc** — quyết định tài sản:
  **không dùng raster/Codex** cho showcase này. Loài là nét đặc 1 màu (+
  1 màu phụ nhỏ), hình học mạnh, không gradient, không hatch (giữ khoảng cách
  với woodcut #08). SVG giữ nét ở mọi DPI, artifact nhỏ. (`design/IMAGE_BRIEF.md`
  không cần tạo.)
- Species silhouettes: grass (bó lá), rabbit, fox, hawk / reeds, hopper, frog,
  heron — vẽ từ path đơn giản, đặt trong di sản "field-guide plate". Mỗi loài
  1 token SVG generator tham số hoá (scale/flip) để rải nhiều cá thể.
- Diorama layers: path dải ngang ổn định; sun = disc `--sun` viền ink; cloud =
  bar bo hơi. Wetland: mặt nước phẳng sky-deep + sọc reflex sáng.
- Icon UI (step/play/pause/reset/web/notes/close/arrow ▲▼●): SVG stroke 2.5px
  tự vẽ cùng ngôn ngữ mực; không emoji.
- Chart: line 2.5px màu loài (mỗi loài một token màu riêng theo bảng §4 mở
  rộng: grass `--leaf`, rabbit `#A5762F`?? — xem §4b species palette), điểm
  cuối có dot + số; grid ô ly `--grid`.

### 4b. Species palette (chart + chip accents — mỗi loài một màu, phân biệt cả
với người không phân biệt màu bằng icon + tên)

| Loài | Màu chart | Ghi chú |
|---|---|---|
| Grass / Reeds | `--leaf` `#4D7A54` | producer |
| Rabbit / Hopper | `#B48A2E` (ochre) | herbivore 3.2:1 → luôn kèm icon+label, dùng cho stroke chart trên nền `--paper-raised` đậm hơn `#8F6B1F` cho text |
| Fox / Frog | `--clay-deep` `#9C5238` | predator |
| Hawk / Heron | `--sky-deep` `#5F8894` | top predator |

Legend luôn = màu + tên loài + silhouette chip; không bao giờ chỉ màu.

## 10. Feedback states

| Trạng thái | Biểu hiện |
|---|---|
| Press | scale 0.97 + nền đậm, 120ms |
| Hover (desktop) | viền ink rõ thêm, 150ms |
| Focus-visible | vành ink 3px offset 2px — không bao giờ remove |
| Quota planned | chip "+4 planned" cạnh slider (mono) — rõ ràng trước khi Step |
| Tick đổi số | row flash nhẹ 150ms + số tween |
| Species enter/exit diorama | token fade/scale in-out 180ms |
| Event xảy ra | banner "Drought — grass grows at half rate this season" trượt vào 250ms, tự ở lại 2 tick |
| Challenge streak | dot per turn trong range (filled/empty) + "3 of 4 steady turns" |
| Challenge success | band forest + laurel + "The meadow held steady for 4 seasons." + congrat copy cụ thể |
| Not this time | band clay-deep + "The season ended before the meadow settled. Read the notes and try a gentler hand." |
| Extinct | chip "gone" + row dim 60% (vẫn focusable, có thể release lại) |
| Data error | banner lỗi đọc được + "Reload data" — không màn trắng |

Live region `aria-live="polite"` cho tick summary + banner; copy mô tả nguyên
nhân thật ("4 rabbits eaten by fox"), không generic.

## 11. Motion budget

Từ spec (khóa): feedback 120–220ms · spatial 250–500ms · delight ≤900ms ·
không intro khóa thao tác · ease tự nhiên (`power2.out`), không bounce/elastic.

GSAP (wrapper `src/lib/gsap.ts`, register 1 lần, core + Flip nếu cần):
- **Token enter/exit** (diorama): fade+scale 180ms stagger 0.02 — population
  change thành chuyển động nhìn thấy (comprehension).
- **Row flash + số counter**: 150ms.
- **Food web draw**: stroke-dashoffset 300ms power2.inOut khi bật; pulse
  highlight 200ms khi focus loài.
- **Event/challenge banner**: slide-in 250ms.
- **Debrief chart**: line draw-in 350ms stagger 0.06.
- **Play mode**: auto-step interval 1400ms (không animation chặn; Step luôn
  hoạt động ngay).
- Reduced motion (`gsap.matchMedia` + CSS media): mọi transition ≤150ms fade
  hoặc tức thì; không slide/banner motion; chart hiện hoàn chỉnh ngay; app chơi
  100%.

## 12. Responsive strategy

- **Tablet 768–1199 = hero viewport** (spec): thiết kế 1024×768 trước — plate +
  notebook side-by-side, không scroll trang; notebook tự scroll nội bộ khi
  hauteur chật.
- **Desktop ≥1280**: plate max 1180, thêm giấy trống 2 bên, legend/ngữ cảnh
  đồng thời nhiều hơn (chart + streak + cause cùng lúc).
- **Mobile 390–479**: `limited` — stack dọc: header + diorama (co theo chiều
  rộng, chiều cao ~46vh) + notebook scroll dọc; slider vẫn ≥44px hit. Test thật
  390×844; nếu diorama quá thấp vẫn đọc được số từ ledger → được phép khai
  `limited` kèm note (kế hoạch) thay vì ép buộc.
- Breakpoints: `360 / 480 / 768 / 1024 / 1280`. Reflow 200%: dùng clamp/fluid,
  không khung cố định chặn zoom; số mono không co dưới 14px.

## 13. Accessibility constraints

- Semantic HTML trước ARIA; `lang="en"`; landmarks header/main; mỗi màn có h1/h2.
- Mọi control là `<button>`/`<input type=range>` thật, có label text hoặc
  aria-label đầy đủ ("Release or remove rabbits, slider from remove 10 to
  release 10").
- **Keyboard path đầy đủ (definition of done)**:
  1. Biome select: Tab/Arrow giữa 2 plates, Enter mở.
  2. Sim: Tab vòng ledger; mỗi slider: Arrow ±1, PageUp/Down ±5, Home/End về
     0/±10; Step/Play/Reset là button; food web toggle aria-pressed.
  3. Debrief: mở bằng button "Field chart", đóng Esc; focus trả về nút mở.
  4. Challenge cards: button thật, focusable, trạng thái hoàn thành có text.
- Chart **luôn** kèm textual summary (mỗi loài 1 dòng) + bảng số cuối (table
  ẩn về mặt thị giác? — không: summary text là equivalent chính).
- Trend = icon + chữ, không color-only. Population = text thật (aria + visible).
- Live region polite cho tick summary ("Season 8: rabbits 31, falling — 4 eaten
  by fox").
- Không time pressure (Play chỉ là tiện ích, mọi thứ làm được bằng Step);
  không âm thanh (không audio trong project này).
- localStorage chỉ anonymous (challenges completed, last biome) + nút Reset
  saved data ở biome screen.
- 200% zoom reflow: kiểm tra bằng driver ở 1280×800 zoom 200% (text spacing
  passes).

## 14. Anti-patterns (cấm)

1. Dashboard SaaS / grid card đều tăm tắp / card-inside-card soup — notebook là
   ledger trên ô ly, không phải panel stack.
2. Gradient tím-xanh AI; gradient trang trí (băng trời rất nhẹ trong scene là
   duy nhất, không phải chrome).
3. Emoji làm icon; icon raster; text nhúng ảnh.
4. Shadow dày / glassmorphism / neon / 3D.
5. Đỏ chói phạt, shake, buzz, timer, điểm số.
6. Bounce/elastic trang trí; intro chặn input; ambient loop.
7. Hover-only; target <44px; số liệu quan trọng <14px.
8. Runtime CDN (font/GSAP/ảnh) — bundle local hết.
9. Giả vờ chính xác khoa học — caveat model luôn hiển thị ở Model notes.
10. Trùng ngôn ngữ hình #07 (gouache wash, museum caption, sepia ấm) hoặc #08
    (hatch carve, woodcut storybook serif).

## 15. Đối chiếu UI UX Pro Max → giữ / loại

| Skill recommendation | Quyết định |
|---|---|
| Line chart cho trend over time (chart domain) | **GIỮ** — debrief chart là line chart đa loài trên ô ly |
| "Expose every term/value as text" (a11y chart note) | **GIỮ + siết** — population luôn là text; chart luôn kèm textual summary từng loài (§13) |
| Tactile-digital deformable UI (jelly/squish, chrome) | **LOẠI** — chất nhựa/3D mâu thuẫn linocut phẳng (§14.4) |
| Vintage-analog film grain/leak | **LOẠI** — nhiễu ảnh không phải mực in |
| Plant-care green palette (#15803D / #F0FDF4 nền mint) | **LOẠI bảng cụ thể** — quá sáng/saturated; giữ định hướng rừng nhưng khóa forest green sâu + cream mát tự định nghĩa (§4) |
| Touch ≥44px, spacing ≥8px | **GIỮ + siết** ≥48px mọi button (§8) |
| Progress indicators cho multi-step | **GIỮ** — challenge streak dots + "3 of 4 steady turns" (§10) |
| prefers-reduced-motion bắt buộc | **GIỮ** (§11) |
| Josefin Slab / Montagu Slab (slab display) | **LOẠI** — chọn IBM Plex Serif (đủ chất plate in, đủ subset vietnamese, superfamily coherence) |
| Monospace cho data annotation (Share Tech Mono v.v.) | **GIỮ ý, đổi font** → IBM Plex Mono (cùng superfamily, đủ subset) |
| Naturalist/field-guide style | **KHÔNG có match trong styles.csv** — theo thesis spec, tự xây token silhouette + graph-grid (§9) |

## 16. Keep/drop so với locked spec (spec luôn thắng)

| Spec yêu cầu | Trong design |
|---|---|
| Diorama + slider/quota controls theo tick discrete | §3.2–3.3 |
| Food web lines overlay | §3.5, §7 |
| Events từ JSON (drought, invasive, habitat loss) | §3.6 + challenges.json |
| Challenge success = populations trong range N turns | §3.6 |
| Charts như field notebook + textual summary | §1, §3.7 |
| Biome select / Diorama / Food web / Challenge / Debrief screens | §7 |
| Same seed deterministic | engine seeded (mulberry32) + event schedule theo turn |
| Linocut silhouette species, no emoji | §9 |
| prefers-reduced-motion | §11 |
| Mọi màu trạng thái có shape/icon/text cue | §4 trend & state |
