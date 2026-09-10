# DESIGN_DECISIONS — Habit Bloom (Showcase #20)

> Khóa design system cho showcase #20. Nguồn: spec `.showcase/20_habit-bloom.md`
> (visual thesis **botanical data-viz minimalism: warm fog, dark pine, orchid,
> marigold — charts là cành/hoa, không dashboard** đã khóa) + đối chiếu UI UX Pro
> Max (queries: `gentle habit tracker non-punitive no streak shame motivation`,
> `botanical minimal editorial herbarium scientific illustration style`,
> `serif display calm editorial font pairing nature wellness`,
> `drag and drop reorder list keyboard accessibility touch targets`,
> `reduced motion prefers-reduced-motion design`,
> `local data privacy consent banner transparent honest UX`, domain `gsap`).
> Brief thắng recommendation: skill đề xuất Claymorphism + streak-amber cho habit
> tracker — **bị loại hoàn toàn** (mâu thuẫn thesis calm botanical + quy tắc
> "không rounded card bao mọi thứ", "no streak shaming" là thesis sản phẩm).
> Huashu **không invoke** — art direction đã khóa trong spec, không dừng chọn 3 hướng.

## 1. Visual thesis — "Botanical field-notes / herbarium plates"

App là một quyển **sổ ghi chép thực vật học (field notebook)**: nền giấy
**warm fog**, mực **dark pine**, mỗi habit là một *specimen row* — stem là
line-art SVG mọc lên theo số lần hoàn thành, lá được vẽ theo đúng loại cây.
Typography in-style: tên habit là serif như nhãn mẫu vật, ngày tháng và đếm
lá là mono như ghi chú tay ngoài hiện trường. Không dashboard, không card
grid, không KPI tile — dữ liệu chính là **cây**.

Từ khóa: herbarium plate · field-notes · warm fog paper · dark pine ink ·
orchid & marigold blooms · hairline rules · serif specimen labels ·
mono annotations · flat line-art botanical · calm · no guilt.

### Tại sao khác Number Garden (#01) — cùng "garden"

#01 là **paper-cut craft playground cho trẻ 5–7**: giấy kem sáng, solid-offset
shadows (bóng giấy đặc lệch 2–4px), moss/apple greens + terracotta + sunny
yellow rực, chữ tròn trẻ con, mọi thứ to và vui. #20 là **field notebook cho
người lớn**: không có bóng giấy (flat, chỉ hairline 1px), palette trầm
(fog/pine/orchid/marigold — không green rực), serif editorial + mono thay vì
display font tròn, mật độ thông tin cao hơn, nhịp điệu tài liệu thay vì nhịp
đồ chơi. Cùng họ botanical, hai thế giới: **collage cắt dán** (#01) vs
**bản vẽ ghi chép khoa học** (#20). Cũng khác #18 product-microsite và #19
editorial index: đây là *working notebook* — công cụ hàng ngày, không phải
landing page.

## 2. Target users

Người lớn muốn giữ thói quen **không bị sản phẩm quở trách**: không streak
counter, không "you broke it", không đỏ phạt. Hệ quả thiết kế:

- Ngôn ngữ visuals + copy: **"resting"** thay vì "missed/failed"; vắng ngày =
  internode dài hơn / nút chấm nhỏ, thân cây **không bao giờ co lại hay héo**.
- Số liệu luôn mang tính mô tả ("12 leaves · planted Aug 28"), không so sánh,
  không goal % .
- UI copy **English**, nhất quán (quyết định của orchestrator cho showcase
  productivity; habit name người dùng tự nhập là free text — fonts bundle đủ
  subset vietnamese cho tên có dấu).
- Tương tác nhẹ nhàng: toggle là hành động trồng/lá gập lại, đảo ngược luôn
  được, không confirm cắt kéo.

## 3. Interaction model

1. **Check-in = trồng một lá** — toggle "Add today's leaf" (≥48px, aria-pressed);
   lá unfold từ cuống (scale+rotate, transform-origin cuống lá, ~260ms). Toggle
   lại = lá gập mờ đi — trung tính, không cảnh báo.
2. **Thân chỉ mọc, không phạt** — mỗi completion là một node lá; ngày vắng giữa
   hai node chỉ làm **internode dài hơn** (nghỉ), không node chết, không decay.
3. **Reorder có 2 đường** — pointer drag trên handle (opt-in, pointer only) +
   **Move up / Move down buttons** (WCAG 2.2 single-pointer alternative +
   keyboard path). GSAP Flip làm spatial continuity khi đổi chỗ.
4. **Detail là 14-day bloom** — mở từ tên habit: một nhánh 14 node, mỗi ngày
   done = lá, ngày vắng = resting bud; meta: planted date, tổng lá, cadence.
5. **Insights là phenology strip** — lịch 28 ngày × habit: lá nhỏ (done) /
   chấm resting / ring hôm nay. Không heatmap đỏ, không streak column.
6. **Storage opt-in minh bạch** — banner giải thích "data ở lại thiết bị",
   chọn "Keep on this device" (localStorage) hoặc "Just this session" (memory);
   luôn có Reset demo garden + Export JSON ở footer.
7. **Milestone nở hoa** — mỗi 7 lá, types `blossom`/`marigold` nở thêm một
   hoa trên thân (delight ≤ 900ms, không confetti explosion).

## 4. Color tokens (khóa bởi spec)

Flat, không gradient, không shadow (chỉ hairline). Mọi trạng thái kèm
shape/text cue — không bao giờ color-only.

| Token | Hex | Vai trò | Contrast trên fog |
|---|---|---|---|
| `--fog` | `#F1EDE3` | Nền chính — giấy warm fog | — |
| `--fog-deep` | `#E7E1D0` | Vùng recessed (header strip, well) | — |
| `--fog-raised` | `#F7F4EC` | Bề mặt nổi (banner, modal) | — |
| `--pine` | `#233829` | Ink chính — text, stem, rules | 10.5:1 |
| `--pine-soft` | `#4C6152` | Text phụ, resting buds | 6.2:1 |
| `--line` | `#CFC8B4` | Hairline không mang nghĩa | — |
| `--orchid` | `#A46FC0` | Blossom graphic, accent lớn | 3.5:1 (graphic/large only) |
| `--orchid-deep` | `#75509E` | Orchid ở cỡ text nhỏ | ~5:1 |
| `--marigold` | `#DE9B1F` | Marigold bloom, highlight hôm nay (kèm ring) | graphic/large only |
| `--marigold-ink` | `#7A5506` | Marigold label cỡ nhỏ | ~4.6:1 |
| `--focus-ring` | `#233829` | outline 2px offset 2, mọi surface | — |

Plant-type → màu lá: `fern`/`sprout` dùng pine (họ lá xanh), `blossom` dùng
orchid, `marigold` dùng marigold. Done state có dấu tick nhỏ trên nút + chữ
"Leaf added" — không chỉ đổi màu.

## 5. Typography

| Vai trò | Font | Weights | Ghi chú |
|---|---|---|---|
| Display / habit names / headings | **Lora** (OFL, Cyreal) | 500–700 + italic | Serif editorial calm, organic — chất herbarium label |
| Body / UI / buttons | **Raleway** (OFL) | 400–700 | Sans thanh mảnh, neutral ấm |
| Specimen tags / dates / counts | **Fragment Mono** (OFL) | 400 + italic | Chất typewriter field-note cho annotation mono |

- Self-host qua `@fontsource/*` (bundle — **không runtime font CDN**, đúng repo
  font policy). Subsets: `latin` + `latin-ext` cho cả ba; Lora + Raleway thêm
  `vietnamese` (habit names người dùng nhập có thể có dấu; Fragment Mono chỉ
  latin/latin-ext — dùng cho app copy tiếng Anh, không render user text).
- Fallback stack: Lora → Georgia, 'Times New Roman', serif; Raleway →
  'Helvetica Neue', Arial, sans-serif; Fragment Mono → 'Courier New', monospace.
  `font-display: swap` (mặc định @fontsource).
- Scale: page title 30–40 Lora 600 · habit name 22–26 Lora 600 · section label
  12–13 Fragment Mono 400 uppercase +0.14em · body 15–17/1.55 Raleway 400 ·
  counts lớn 34–44 Lora 700 tabular · microcopy ≥13px.
- Chưa ai dùng trong batch (đã dùng: archivo, atkinson, baloo-2, fraunces,
  gentium, ibm-plex-mono, nunito, space-grotesk, space-mono, spline-sans-mono,
  work-sans, instrument-sans).

## 6. Spacing & layout

- Base 4px như atom-forge (`4…96`); gutters 16 (mobile) / 24 (tablet) / 40 (desktop);
  max-width 1240px (notebook hẹp hơn poster); hairline rules chia vùng, **không
  card border-radius**.
- **Today garden = danh sách specimen rows full-width**, mỗi row: [drag handle +
  move buttons] [StemPlot SVG] [name + tags + toggle] [leaves count + detail link].
  Row cách nhau bằng hairline, hover/recent row có fog-deep wash — không card box.
- **Detail view** thay vùng chính (không modal): branch lớn 14 node + meta column.
- **Insights** = phenology bảng (hàng habit × 28 cột ngày, tách tuần hairline).
- Tablet 768–1199: giữ rows, StemPlot co nhẹ, mọi touch ≥48px, không cần hover.
- Mobile 390–479: row chuyển layout dọc (stem nhỏ trên, controls dưới), move
  buttons luôn hiển thị, nav thành hàng cuộn ngang.
- Desktop ≥1200: thêm whitespace giữa stem và meta, reading line-length giới hạn.

## 7. Motion (spec budget)

- Leaf unfold: 200–260ms ease-out (transform-origin cuống), toggle-off gập
  160ms. Micro feedback (button press) 120–160ms.
- Flip reorder: 300ms, ease (0.22,0.61,0.36,1) — spatial continuity.
- Bloom milestone: ≤900ms một lần, không lặp.
- Intro: stem draw-in ≤450ms stagger 40ms, không khóa thao tác (pointer-events
  giữ nguyên, chỉ opacity/scale).
- **Reduced-motion**: gsap wrapper `tween()` set state tức thì; CSS
  `@media (prefers-reduced-motion: reduce)` tắt mọi transition/animation;
  trạng thái cuối hiển thị đầy đủ ngay.

## 8. Data & privacy contract

- `public/data/habits.seed.json` — content state (id, name, cadence, plant,
  history ISO dates). Validate dev-time, lỗi degrade thành message rõ.
- Interaction state (view, modal, drag) — memory only.
- Personal state: **opt-in** — consent 'local' mới clone garden vào
  localStorage (`habit-bloom.garden.v1`); 'session' không bao giờ ghi.
  Anonymous (habit names là text người dùng tự nhập, không sync, không PII);
  Reset + Export JSON luôn có.

## 9. Accessibility commitments

- Semantic HTML trước ARIA: nav, main, section, button[aria-pressed],
  dialog + Esc + focus trap + focus return, aria-live cho toast nhẹ.
- Keyboard path cho mọi tác vụ: toggle (button), reorder (move buttons),
  detail (link/button), modal (focus trap), nav (tab).
- SVG stem có role="img" + aria-label mô tả ("12 leaves · longest run không
  nêu" — chỉ mô tả, không phạt). Màu trạng thái luôn kèm shape/text.
- Focus-visible 2px pine ring offset 2px — không bao giờ remove.
- Touch targets ≥48px (đặc biệt mobile), gap ≥8px giữa control kề nhau.

## 10. Artifacts & asset strategy

- **100% code-native SVG** cho stem/leaf/bloom — botanical procedural, seeded
  RNG từ habit id (stable giữa renders). KHÔNG raster, KHÔNG Codex imagegen,
  KHÔNG icon emoji. Favicon inline SVG data-URI.
- Fonts là asset ngoài duy nhất bundle vào dist (OFL).

## 11. Reject list (skill recommendations bị loại)

- Claymorphism / soft-blob UI cho habit tracker — mâu thuẫn thesis (flat,
  no rounded-card soup, calm).
- Streak amber + progress green "motivational accents", streak counter nổi
  bật — mâu thuẫn "no streak shaming" (thesis sản phẩm).
- Dashboard-style analytics (bar/line charts, % tiles) — spec: "charts là
  cành/hoa chứ không dashboard".
- Confetti/celebration explosion — spec GSAP: "no celebratory explosion".
- Hover-only affordances — tablet là viewport quan trọng.
