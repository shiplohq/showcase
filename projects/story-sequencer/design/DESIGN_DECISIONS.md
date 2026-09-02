# DESIGN_DECISIONS — Story Sequencer (Showcase #10)

> Khóa design system cho showcase #10. Nguồn: spec `.showcase/10_story-sequencer.md`
> (visual thesis "Graphic novel workshop: muted teal, rust, sand, ink; panel border linh hoạt;
> typography comic-inspired nhưng đọc tốt" đã khóa) + đối chiếu UI UX Pro Max
> (queries: `narrative sequencing story order learning children reading comprehension 7-11`,
> `comic panel storyboard layout system grid gutter`, `reorder list drag drop keyboard accessible
> move up down buttons pattern`, `comic book graphic novel typography display font hand lettered readability`,
> `warm muted teal rust sand ink palette illustrative education`,
> `children education app error feedback non-punitive forgiving retry`,
> `gsap flip reorder animation spatial continuity stagger`).
> Brief thắng recommendation: mọi gợi ý mâu thuẫn art direction đã khóa đều bị loại (§15).

## 1. Visual thesis

**Bàn làm truyện tranh (graphic novel workshop) của một họa sĩ truyện trẻ.**
Cả app là một **mặt bàn vấn comic**: nền gỗ-phủ-vải **muted teal sâu** đặt lên đó các
**trang storyboard giấy sand** — mỗi panel truyện là một ô comic thật: viền mực
**linh hoạt** (nặng 3px, panel "đầu câu" được viền kép — quy ước in comic), nền
giấm sand, hình **SVG phẳng original** viền ink, caption dưới panel kiểu
**comic caption box** (nền sand-đậm, chữ ink, chữ temporal clue được gạch chân
khi bật hint). Ngôn ngữ in comic dùng đúng chỗ, tiết chế: **halftone dot** (CSS
radial-gradient pattern) chỉ ở masthead và stamp; **không** speech bubble cho
nội dung chính (spec cấm lạm dụng); số thứ tự panel là **slate chip** tròn
kiểu số trang truyện. Cause→effect là **đường mực rust** vẽ tay (SVG path cong
+ đầu mũi tên) như bút chì đỏ của biên tập viên. Story hoàn thành đóng dấu
**"SEQUENCED!"** xoay nhẹ −8° kiểu con dấu duyệt.

Từ khóa: comic workshop desk · ink-bordered sand panels · flat SVG scenes ·
editor red-pencil connectors · halftone accent · slate numbering chips ·
muted teal desk · no glassmorphism.

Điểm phân biệt với 9 showcase đã ship: #01 paper-cut pastel garden (organic,
asymmetric bo góc), #02 Italian editorial bistro, #03 Bauhaus blueprint
(graph paper + mono), #04 vintage ink-navy star chart, #05 nautical journal,
#06 market signage, #07 expedition, #08 forest, #09 detective case-file.
#10 là **comic studio sáng nhưng ấm desk-light** — panel comic viền mực trên
nền teal, palette rust/sand — không graph paper, không paper-cut layer, không
case-file tab, không naval chart line.

## 2. Target users

Trẻ 7–11 tuổi (lớp 3–5) luyện **first/next/then/finally**, cause-effect và
inference (spec). Người dùng thứ hai: giáo viên/phụ huynh nhìn nhanh thấy
progress. Hệ quả:

- Đọc trôi chảy câu ngắn; panel caption ≤ 18 từ, UI copy tiếng Anh ≤ 12 từ/câu.
- Mọi clue đúng/sai có **icon + chữ** kèm màu (không color-only).
- Không đồng hồ, không điểm trừ, không âm báo lỗi; sai = "hãy đọc lại clue".
- Tự khám phá: hint temporal clue là nút trẻ chủ động bấm.

**Ngôn ngữ UI: tiếng Anh** (spec: JSON example + reflection question tiếng Anh).
Tagline tiếng Việt "Xưởng kể chuyện" chỉ xuất hiện một lần ở shelf sub-line —
fonts kèm subset `vietnamese` đầy đủ theo font policy.

## 3. Interaction model

Bàn storyboard 5 bước cho mỗi story (khớp spec IA):

1. **Story shelf** — các "số truyện" (comic issues) dựng đứng trên kệ teal;
   story đã xong có stamp SEQUENCED!.
2. **Order step** — panels bị xáo trộn (seeded shuffle, không bao giờ trùng
   correct order). Sắp lại bằng: **kéo-thả panel** (pointer events, works
   mouse+touch) HOẶC **select + nút Move earlier/later** HOẶC **arrow keys**
   khi panel có focus. Nút **Show time clues** gạch chân các từ first/next/
   then/later/finally… trong caption (spec: hint chỉ nhấn mạnh temporal clue).
3. **Link step** — panels khóa thứ tự; chọn **cause** rồi **effect** →
   connector rust vẽ giữa hai panel (SVG overlay, path cong + arrowhead).
   Link sai: đường nhấp nháy mustard rồi rời đi + copy thân thiện. Link đúng:
   ở lại ink-rust. Xóa link: nút × trên midpoint. Toggle chip mỗi link hiển thị
   "cause / effect".
4. **Title step** — chọn tiêu đề hay nhất từ 4 options (comic cover style).
5. **Check my story → verdict** — **timeline line chạy xuyên panels** (spec)
   giải thích thứ tự; ba row Order / Connections / Title hiện trạng thái;
   cần sửa thì nút nhảy về đúng step. Đủ 3 ✓ → celebration + **Reflection**
   "What clue helped you?" + Next story.

State 3 lớp (spec): **content** = `public/data/stories.json` (fetch 1 lần,
dev-time validation); **session** = signals (step, order, links, title);
**personal** = anonymous `localStorage` (completed story ids) + Reset progress
ở shelf footer.

## 4. Color tokens

Palette khóa theo spec: muted teal, rust, sand, ink. Flat, không gradient
trừ halftone-dot pattern (CSS radial-gradient tái sử dụng làm texture in).

### Desk (nền app)

| Token | Hex | Vai trò |
|---|---|---|
| `--desk` | `#1E5A54` | Nền teal sâu — mặt bàn comic |
| `--desk-2` | `#174742` | Teal tối hơn — footer, band |
| `--desk-line` | `#9CC5BE` | Đường kẻ nhạt trên desk |

### Paper (panel + surface)

| Token | Hex | Vai trò |
|---|---|---|
| `--paper` | `#F5E9CF` | Nền panel sand |
| `--paper-2` | `#EEDCB8` | Caption box, surface phụ |
| `--paper-3` | `#E4CE9F` | Sand đậm — divider, chip nền |

### Ink + accents

| Token | Hex | Vai trò |
|---|---|---|
| `--ink` | `#26332F` | Text chính, viền panel (3px), outline SVG |
| `--ink-2` | `#51615B` | Text phụ trên paper |
| `--rust` | `#B4552D` | Cause-effect connector, CTA chính, focus ring |
| `--rust-2` | `#8F3F1F` | Rust đậm — hover CTA, text trên sand |
| `--teal` | `#2E7D74` | Teal sáng — focus/hover panel, secondary |
| `--mustard` | `#D9A441` | Hint highlight, celebration stars |
| `--cream` | `#FBF6EA` | Text trên teal desk |

Contrast đã check (sau impeccable pass): ink trên paper 12.4:1; cream trên
desk 8.1:1; rust-2 trên paper 6.3:1; ink trên paper-2 10.9:1; desk-line
#B9D8D2 trên desk ≈5:1 (nhất cho text hướng dẫn 11–16px); look #7D5A12 trên
paper ≈5.2:1; look-bright #E9C778 cho status trên nền desk đậm. Không dùng
teal/mustard cho text nhỏ.

### Trạng thái (luôn kèm icon + chữ, không color-only)

| Trạng thái | Màu | Cue kèm |
|---|---|---|
| Correct | `--teal` | Icon check + chữ "Yes!" |
| Look again | `--mustard` | Icon magnifier + chữ "Look again" |
| Hint | `--mustard` underline | Chữ clue in đậm + gạch chân |

## 5. Typography

Comic-inspired nhưng đọc tốt (spec §7 typography). Hai family, load
`@fontsource` subset `latin` + `latin-ext` + `vietnamese` (tagline + font
gate), `font-display: swap`, fallback stack đầy đủ.

| Role | Font | Weights | Dùng ở |
|---|---|---|---|
| Display / masthead / story titles / stamps / số panel | **Bangers** (OFL, Vernon Adams) | 400 | Masthead, issue titles, step labels, verdict stamps |
| Body / panel captions / UI copy / buttons | **Andika** (OFL, SIL International) | 400, 700 | Caption, instruction, buttons, reflection |

- Bangers là comic poster caps — chỉ dùng display (all-caps tự nhiên), letter-
  spacing +0.02em, không bao giờ cho câu dài.
- Andika được SIL thiết kế riêng cho **người học đọc** (early-literacy font:
  single-story 'a', x-height cao, ký tự dễ phân biệt) — đúng đối tượng 7–11
  luyện đọc; legibility thật, không phải styling. Cả hai family có subset
  `vietnamese` (font gate).
- Scale: display 40/32/24px; body 17/15px (tablet+), 16px mobile; caption
  15px/1.45; microcopy 12.5px uppercase tracking.
- Line length caption ≤ ~42ch — panel width tự giới hạn.

Đối chiếu skill: font data gợi ý Comic Neue (handwriting) cho comic — **BỎ**
(handwriting mỏng, khó đọc khi nhỏ, dễ "kindergarten"); Bangers + Atkinson
giữ đúng "comic-inspired nhưng đọc tốt".

## 6. Spacing & layout

- 8px base grid; panel gap (gutter) **14px** — comic page gutter hẹp để đọc
  liền mạch; section gap 24px; masthead cao 64px.
- Page: masthead (64) + step strip (44) + stage + footer hint; stage là nơi
  panel grid sống.
- Panel grid: **comic-page tiling theo số panel** (impeccable Assessment A):
  desktop ≥1200 — story ≤5 panel xếp đủ 1 hàng N cột (không còn panel "mồ côi"
  4+1), story 6 panel xếp 2 hàng × 3; tablet 768–1199 — 4 panel 2×2, 5–6 panel
  hàng 3 cột; mobile 1 cột.
- Story shelf: horizontal-wrap của issue cover 232×320px.
- Z-plan: không card-in-card — panel nằm trực tiếp trên desk, chỉ 1 bậc nâng.

## 7. Illustration language (SVG original)

- Mọi frame là **SVG original parameter-driven** (scene id trong JSON → renderer
  trong `scenes.ts`), viewBox chuẩn `400×250`, style: flat fills + ink outline
  3px, palette tokens, không gradient, không text trong SVG (caption là DOM).
- Vocabulary dùng lại giữa scene: sky states (sunny / cloudy / storm / night),
  ground band, kid figure (3 nhân vật: Mia/Ben/Ana/Sam với tóc + áo khác nhau),
  props (kite, watering can, sprout, birdhouse, boat, lantern…).
- **Mỗi frame khác biệt rõ về silhouette + sky state** — nhiệm vụ sequencing
  dựa trên narrative cue thị giác (mưa chỉ xuất hiện sau storm; tàng cây trổ
  lá ở frame muộn; nến chỉ xuất hiện khi mất điện).
- Halftone chỉ trong CSS (masthead band, stamp), không trong SVG frame.
- Không emoji làm visual chính (spec).

## 8. Component primitives

| Primitive | Mô tả |
|---|---|
| `masthead` | Band teal đậm + halftone, wordmark Bangers "STORY SEQUENCER", nút Home, progress count |
| `issue-card` (shelf) | Comic cover: mini scene SVG + title Bangers + stamp SEQUENCED! khi xong; 232×320, viền ink 3px trên paper |
| `panel` | Ô comic: scene SVG + caption box; viền ink 3px; khi selected: viền kép + teal; khi kéo: scale 1.02 + shadow phẳng |
| `slate chip` | Số thứ tự tròn 34px, nền ink chữ cream, Bangers |
| `move-controls` | Cặp nút ▲▼ 44×44 mỗi panel (label "Move earlier/later") |
| `connector` | SVG path cong rust 4.5px + **paper halo 10px** dưới đường (caption đọc được khi line cắt ngang) + arrowhead; neo vào **cạnh panel** (border-port, không đâm vào tranh/chữ); xóa bằng chip button "cause ×/effect ×" trong panel bar (không đặt nút trên overlay — tránh che panel khác) |
| `clue-highlight` | `<mark>` mustard-underline + đậm, chỉ khi hint bật |
| `title-option` | Radio comic-cover mini 64px cao, role=radio, arrow-key nav |
| `verdict-row` | Icon + label + trạng thái + nút Fix |
| `timeline` | Đường ink chạy qua các panel theo thứ tự đã chọn, dot đánh số |
| `stamp` | "SEQUENCED!" Bangers rust viền kép xoay −8° |
| `step-strip` | 4 chip ORDER → LINK → TITLE → CHECK, chip hiện tại nền paper chữ ink |

## 9. Feedback states

- Kéo panel: panel nhấc lên (scale 1.02, shadow phẳng 4px ink), placeholder
  dashed teal hiện ở slot đích — 180ms.
- Move button/arrow: panel đổi chỗ với Flip 280ms; live region đọc
  "Panel 3 of 5: <caption snippet>".
- Link đúng: path vẽ 350ms + chốt; live region "Cause and effect connected".
- Link sai: path mustard run nhẹ 700ms rồi rời + copy VISIBLE trên paper toast
  ~2.6s "That pair does not match. Think: what made it happen?" (không bao giờ
  motion-only) + live region (không đỏ, không buzzer).
- Hint: các từ temporal clue đậm + gạch chân mustard (persist cho session).
- Verdict: đúng = check teal + "Yes!"; cần nhìn lại = magnifier mustard +
  "Look again" + nút Fix về đúng step. Không từ "wrong/sai/fail".
- Reflection: mọi lựa chọn đều nhận explanation (reflection không chấm điểm).
- Error data (JSON hỏng): full-page paper card "The storyboard pages are
  missing" + nút Try again — không trắng trang.

## 10. Motion budget (GSAP)

GSAP 3.15 bundled; wrapper `src/app/lib/gsap.ts` (register 1 lần +
`prefersReducedMotion()` guard; mọi tween qua `fx.*`).

| Motion | Công cụ | Thời lượng | Mục đích |
|---|---|---|---|
| Panel hover/nhấc | gsap.to scale | 140ms | feedback |
| Reorder | **Flip** | 280ms power2.out | spatial continuity (spec: Flip animate reorder) |
| Connector vẽ | stroke-dashoffset | 350ms power1.inOut | comprehension (DrawSVG là club plugin → dùng dashoffset chuẩn) |
| Link sai rời đi | gsap.to opacity+shake nhẹ | 200ms | feedback |
| Timeline verdict | stroke-dashoffset + stagger dot | 500ms | giải thích thứ tự (spec) |
| Celebration | stagger sao ink + stamp scale-in | ≤ 900ms tổng | delight |
| Shelf reveal | stagger y:8 | 250ms, stagger 0.03 | entrance nhẹ |

Reduced motion: mọi tween → final state tức thì; chỉ giữ fade ≤ 150ms; bỏ
stagger, shake, path travel (spec motion direction). Intro không khóa thao
tác (motion không chặn pointer).

## 11. Responsive

- **Tablet 768–1199 là viewport hero**: 2–3 panel/hàng, caption 15px, target
  ≥ 48px; không hover-only.
- **Desktop 1200+**: 3–4 cột panel, whitespace tăng, shelf 4 issue/hàng.
- **Mobile 390–479 (limited support)**: 1 cột panel dọc + move buttons là
  đường chính (drag vẫn hoạt động); link step = tap cause → tap effect;
  shelf scroll ngang 1 hàng. Không ép canvas desktop thu nhỏ.
- 200% zoom: caption không cắt (acceptance) — panel min-width 240px reflow
  xuống 1 cột, caption wrap.

## 12. Accessibility

- Semantic trước ARIA: `<header> <main> <section aria-labelledby> <ul><li>`
  cho panel list; nút thật `<button>` cho mọi action.
- Panel list: `role="list"`, panel là `role="listitem"` focusable, roledescription
  "story panel"; keyboard: Tab focus, **ArrowUp/ArrowDown (hoặc Left/Right)**
  đổi chỗ, Home/End về đầu/cuối; nút Move earlier/later luôn hiển thị
  (WCAG 2.2 Dragging Movements — drag không bao giờ là đường duy nhất).
- Link step: panels là button; chọn cause → aria-pressed, effect; connector
  xóa được bằng nút (không chỉ click path).
- Title/reflection: radiogroup chuẩn, arrow-key navigation, label đầy đủ.
- Focus ring 3px rust offset 2px mọi interactive; focus-visible.
- Live region polite cho move/link/verdict announcements.
- Scene SVG `aria-hidden="true"` + caption là text equivalent (spec: SR có
  text equivalent cho visual question).
- Không motion-only meaning; không time pressure; contrast §4.

## 13. Forbidden patterns (anti-goals)

- Card-in-card soup; rounded-all (16-24px) MUI feel; glassmorphism; neon;
  3D; big blurred shadows; purple/blue AI gradient; emoji làm visual chính;
  speech bubble lạm dụng; dashboard SaaS layout; fake data charts.
- Không dùng Comic Neue/handwriting cho body; không Bangers cho câu dài.
- Không pointer-only drag; không color-only state; không đỏ trừng phạt.
- Không absolute path `/assets` (baseHref './'); không runtime CDN.

## 14. Content contract (JSON)

`public/data/stories.json` — mỗi story:

```json
{
  "id": "rainy-kite",
  "issueNo": 1,
  "titles": [
    {"id": "t1", "text": "The Wind and the Wet Kite", "correct": true},
    {"id": "t2", "text": "Mia's Bedroom Tidy-Up"}
  ],
  "panels": [
    {"id": "p1", "scene": "kite-build", "caption": "One bright morning, Mia taped paper over her kite frame.", "timeClues": ["One bright morning"]}
  ],
  "canonicalOrder": ["p1", "p2", "p3", "p4", "p5"],
  "alternateValidOrders": [],
  "causalLinks": [["p2", "p3"]],
  "reflection": {
    "prompt": "Which clue told you the rain came AFTER the kite flew?",
    "options": [
      {"id": "r1", "text": "The words 'Later' and 'Finally'", "explanation": "...", "best": true},
      {"id": "r2", "text": "The colour of Mia's shoes", "explanation": "..."}
    ]
  }
}
```

5 stories: rainy-kite (5 panels), birdhouse (5), tiny-seed (6), night-lights (4),
paper-boat (6). `scene` id → renderer trong `scenes.ts` (không markup trong
JSON — không injection surface). Engine `validateStories()` chạy dev-time.

## 15. Keep/drop vs UI UX Pro Max recommendations

| Skill recommendation | Quyết | Lý do |
|---|---|---|
| e-ink/paper reading style (no animation, serif) | **DROP** | Art direction đã khóa comic workshop; motion budget là requirement của spec (Flip, connector, timeline) |
| Claymorphism/Vibrant cho kids learning | **DROP** | Sibling #01 đã dùng mảng playful; spec khóa muted teal/rust/sand flat ink |
| Parallax storytelling style | **DROP** | Scroll-driven anti-pattern cho task 1 màn; access risk high theo chính skill |
| Editorial grid asymmetric | **KEEP 1 phần** | Panel grid linh hoạt thay cột cố định — đúng "panel border linh hoạt" của spec |
| WCAG 2.2 Dragging Movements: move buttons beside drag handle | **KEEP** | Trùng khớp spec keyboard path; severity High |
| "Stagger ≤ 0.1s per item, 250–350ms, power1.out" cho list reveal | **KEEP** | Đúng motion budget 250–500ms spatial |
| "kill tween on unmount / reduced-motion set final state" | **KEEP** | Wrapper fx.* ép đúng pattern này |
| LMS palette teal #0D9488 + amber | **KEEP 1 phần** | Hướng teal+amber khớp thesis nhưng sắc độ tự chỉnh mute hơn (§4) |
| Comic Neue cho comic style | **DROP** | Handwriting khó đọc nhỏ; Bangers (display) + Andika (body) đạt "comic-inspired nhưng đọc tốt" |
| Bento/dashboard grids | **DROP** | Forbidden pattern (fake dashboard) |

## 16. Definition of done (design side)

- [x] Thesis trên không trùng 9 identity đã ship (đối chiếu §1).
- [ ] Panel grid + caption không cắt ở 200% zoom.
- [ ] Keyboard reorder + link + title đầy đủ (không pointer-only).
- [ ] Mọi state có icon+chữ kèm màu.
- [ ] Motion trong budget §10; reduced-motion verified.
- [ ] Tablet 1024×768 + desktop 1440×900 không scroll dọc ở main screens
      (scrollHeight ≤ viewport — batch lesson #04).
