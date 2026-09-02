# DESIGN_DECISIONS — Grammar Detective (Showcase #09)

> Khóa design system cho showcase #09. Nguồn: spec `.showcase/09_grammar-detective.md`
> (visual thesis đã khóa: *modern detective editorial — paper dossier, cobalt ink,
> fluorescent highlighter yellow, red pencil; monospace chỉ dùng metadata; không noir
> đáng sợ*) + đối chiếu UI UX Pro Max (queries: `education puzzle language learning
> error correction elementary`, `detective mystery editorial paper dossier case file style`,
> `readable typography young readers dyslexia friendly font`, `highlight text annotation
> marking interaction`, `flip card reorder animation`, `cobalt ink yellow highlighter red
> pencil palette editorial`, `serif display monospace metadata editorial font pairing`,
> `touch target size children tablet minimum`).
> Spec thắng recommendation: mọi gợi ý mâu thuẫn thesis đều bị loại (bảng §15).

## 1. Visual thesis

**Modern detective editorial — not scary noir.** Cả app là một bàn thẩm án của
văn phòng thám tử: nền giấy dossier ấm, hồ sơ manila có tab, tờ evidence trắng
đặt trên folder, metadata chạy `mono` in hoa như tem hồ sơ (CASE Nº 04 · FILE B).
Mực cobalt là "bút điều tra" chính — chữ ký, nút hành động, focus; **highlighter vàng
fluorescent** là công cụ đánh dấu bằng chứng (noun); **bút chì đỏ** chỉ dùng cho
lời phê chỉnh lỗi (verdict "not yet") — không bao giờ là màu "sai(trừng phạt)".
Stamp "RESOLVED" xanh lá đóng xiên góc tờ hồ sơ khi case kết thúc. Không da đen,
không spotlight rạp, không dramatic long shadow — mọi shadow là
"paper offset" mỏng 2px như hai lớp giấy.

Từ khóa: paper dossier · manila folder · cobalt ink · highlighter yellow ·
red pencil · rubber stamp · typewriter metadata · print-first · calm editorial.

## 2. Users / age + CEFR

Học sinh **9–13 tuổi**, English **A1/A2** (bắt đầu đọc câu tiếng Anh đơn giản),
luyện parts of speech + word order. Hệ quả:

- UI copy **English**, câu ngắn, từ vựng everyday (school, dog, market).
- Sentence reading surface là hero: chữ lớn (≥24px tablet), line-height rộng,
  max-width ~34ch, không chữ nhỏ hơn 16px trên tablet.
- Lỗi không trừng phạt: verdict "Not yet" đi kèm gợi ý, không timer, không điểm âm.
- Đánh dấu grammar **không bao giờ color-only**: mỗi category = màu wash +
  underline pattern riêng + label chip chữ hiện ra dưới token.

## 3. Interaction model

1. **Case board** — dàn dossier folder (FILE A/B/C) nằm ngang full-width; mỗi
   folder chứa case rows dạng index card; case đã giải có stamp xanh + số liệu
   mono "RESOLVED". Chọn case → mở tờ evidence.
2. **Evidence view (highlight)** — câu "broken" in trên tờ giấy trắng; pen tray
   (NOUN/VERB/ADJECTIVE pens) cạnh dưới; click/tap word để đánh dấu bằng pen
   đang chọn; keyboard: Tab tới word, Enter/Space áp pen, phím 1/2/3 đổi pen,
   Backspace xoá mark; bấm lại word cùng pen = xoá.
3. **Reorder board** — word cards trên ray; di chuyển bằng ◀ ▶ buttons (mỗi card,
   ≥44px) hoặc HTML5 drag (mouse); Flip giữ spatial continuity khi đổi chỗ.
4. **Clue system 3 mức** — mở dần: clue 1 khái niệm, clue 2 category-specific,
   clue 3 near-answer. Mở clue không phạt; label mono "CLUE 1/3".
5. **Verdict** — "File verdict" do trẻ chủ động bấm. Correct → explanation view
   (rule + fixed sentence + marked example). **Stamp RESOLVED chỉ đến sau khi
   explanation hiển thị** (spec: stamp sau giải thích, không chỉ sau answer).
6. **Progress anonymous** — localStorage `grammar-detective:v1` chỉ lưu case ids
   đã resolved; reset button ngay trên board header.

## 4. Color tokens

| Token | Hex | Vai trò |
|---|---|---|
| `--paper` | `#F8F5EE` | Nền chính — dossier paper ấm |
| `--sheet` | `#FFFDF6` | Tờ evidence / panel nổi |
| `--manila` | `#E9D8B2` | Folder hồ sơ |
| `--manila-deep` | `#DBC79A` | Folder pressed / tab |
| `--ink` | `#252A3D` | Text chính (13:1 trên paper) |
| `--ink-soft` | `#555B70` | Text phụ (≥5.9:1) |
| `--line` | `#D8D2C2` | Hairline kẻ giấy |
| `--cobalt` | `#2748C8` | Mực chính — CTA, link, focus, verb mark (6.8:1) |
| `--cobalt-deep` | `#1B359C` | Pressed / hover ink |
| `--hl` | `#FFE24A` | Highlighter vàng fluorescent — noun wash (ink trên top ~10:1) |
| `--hl-soft` | `#FBF0BE` | Vàng nhạt — clue strip wash |
| `--pencil` | `#B8402F` | Red pencil — verdict "not yet", underline chỉnh (5.05:1) |
| `--pencil-soft` | `#F6DDD6` | Wash đỏ nhạt |
| `--stamp` | `#2A6E46` | Stamp RESOLVED xanh (large text/icons ≥4.5:1) |
| `--stamp-soft` | `#DDEBE1` | Wash xanh nhạt |

### Grammar marks — luôn color + pattern + label (không color-only)

| Category | Wash | Underline pattern | Label chip |
|---|---|---|---|
| NOUN | `--hl` vàng | solid dày 3px | `NOUN` (mono caps) |
| VERB | `#DCE2FB` cobalt wash | double underline | `VERB` |
| ADJECTIVE | `#D9EDE0` green wash | dotted underline | `ADJ.` |

- **Verdict states**: correct = `--stamp` + icon stamp + text; not-yet =
  `--pencil` + icon magnifier + text gợi ý. Icon + text luôn đi cặp màu.
- **Focus**: vành `--cobalt` 3px + offset 2px (nhìn rõ trên mọi surface).

## 5. Typography

| Vai trò | Font | Weights | Ghi chú |
|---|---|---|---|
| Display / masthead / section | **Fraunces** (OFL, Undercase Type) | 700, 900 | Editorial serif có cá tính, chunky ở 900 — thân thiện trẻ mà vẫn "văn phòng thẩm" |
| Body / sentence / UI | **Atkinson Hyperlegible** (OFL, Braille Institute) | 400, 700 | Thiết kế cho người đọc thị lực thấp — letterforms phân biệt cao, hợp A1/A2 reader |
| Metadata / stamps / chips | **IBM Plex Mono** (OFL, IBM) | 400, 500, 600 | Chỉ dùng metadata: case no, labels, clues counter — đúng spec "monospace chỉ dùng metadata" |

- Self-host qua `@fontsource/*` (bundle; **không runtime Google Fonts**).
- UI English-only → import subset `latin` + `latin-ext` mỗi family (không có
  glyph tiếng Việt nào ship; font policy repo: vietnamese subset chỉ bắt buộc
  khi có dấu ship).
- Scale (tablet-first): masthead `clamp(34px, 6vw, 62px)/1.05` Fraunces 900 ·
  case sentence `clamp(24px, 3.4vw, 34px)/1.7` Atkinson 400 · section 26–30
  Fraunces 700 · body 17–19/1.55 Atkinson · metadata 12–13 mono 500,
  uppercase, tracking 0.08em (không nhỏ hơn 12px, tablet 13px).

## 6. Spacing system

Base 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80`.
Gutters: 16 (mobile) / 24–32 (tablet) / 40 (desktop). Khoảng cách giữa 2 touch
target kế tiếp ≥ 8px. Word token padding 10–14px + margin 6px (target ≥44px).

## 7. Layout / grid

- App = 1 stage full-viewport, không scroll ngang ở bất kỳ viewport chuẩn.
- **Board**: masthead dọc trái trên (desktop) / stack (tablet, mobile) +
  dossier folder rows full-width — mỗi folder một FILE, case rows bên trong
  như index cards chồn nhẹ lên nhau. KHÔNG grid card đều tăm tắp, KHÔNG sidebar
  dashboard.
- **Evidence view**: giấy tờ nằm giữa, max-width **760px** reading column
  (~74–86% viewport width tuỳ breakpoint — khoá sau khi verify vừa 1024×768);
  desk margin hai bên hiển thị metadata (rút gọn ở tablet/mobile).
- **Reorder board**: word-card ray là một dòng wrap (không slot grid cứng) —
  cards tự wrap như thẻ bài trên bàn.
- Content max-width 1100px desktop; tablet portrait là hero layout.

## 8. Illustration language

- **SVG nguyên bản trong project** (`src/components/art.tsx`): magnifier,
  paperclip, stamp tròn, pen nib, folder tab — stroke 2px cobalt, fill flat,
  không gradient. Icon = SVG, không emoji.
- Paper grain: SVG `feTurbulence` procedural data-URI, opacity ~3–4% —
  không tải texture ngoài.
- Verdict/explanation panel = tờ memo đính paperclip (SVG), không card-in-card.

## 9. Component primitives

`Masthead` · `FolderRow` (manila + tab + stamp) · `CaseRow` (index card) ·
`CaseSheet` (evidence paper) · `MetadataTag` (mono) · `WordToken` (button,
mark layer + label chip) · `PenTray` (pen toggle buttons, radio group) ·
`WordCard` (reorder card + ◀ ▶ controls) · `ClueDocket` (3-level) ·
`VerdictStrip` (icon + text, aria-live) · `ResolvePanel` (explanation memo) ·
`StampBadge` (RESOLVED) · `IconBtn`.

## 10. Feedback states

- Mark word: highlighter swash scaleX-in 160ms + label chip fade — nếu sai
  category, mark vẫn hiện (trẻ tự soát qua verdict), không rung không đỏ.
- Verdict **Not yet**: strip đỏ-bút-chì + icon magnifier + copy gợi ý số lượng
  ("2 marks are hiding…") — không đếm lỗi bằng màu đỏ chói, không "WRONG!".
- Verdict **Case closed**: strip xanh + stamp icon; ResolvePanel trượt lên
  ≤500ms; stamp RESOLVED đóng xuống tờ giấy (scale 1.5→1 + rotate -8°, 480ms).
- Clue mở: strip vàng nhạt + mono "CLUE 2/3", fade 200ms.
- ARIA live region cho mọi verdict; mọi state có text equivalent.

## 11. Motion budget (GSAP qua `src/lib/gsap.ts`)

| Motion | Budget | Purpose |
|---|---|---|
| Highlighter swash draw-on | 160ms | feedback mark |
| Clue strip fade | 200ms | feedback |
| Word-card Flip reorder | 380ms | spatial continuity |
| Verdict strip / resolve panel | 320–500ms | spatial |
| Stamp RESOLVED | 480ms (≤900ms delight) | closure delight |
| Board row enter stagger | 160–180ms/row | spatial |

- `prefers-reduced-motion`: swash/stamp xuất hiện tức thì, fade ≤150ms,
  Flip skipped (layout final áp trực tiếp), không stagger.

## 12. Responsive behavior

- **Mobile 390×844 supported**: board rows stack; pen tray = horizontal
  scroll row (snap); word cards wrap; ◀ ▶ buttons là primary reorder path
  (HTML5 drag không tồn tại trên touch); desk metadata rút thành chip hàng
  ngang. 200% zoom: reflow dọc, không horizontal scroll.
- **Tablet 768–1199 = hero**: mọi control ≥44px, không hover-only, sentence
  hero ~30px, evidence sheet chiếm ~86% width.
- **Desktop 1200+**: desk margin rộng, metadata dọc bên trái sheet, whitespace
  tăng — không scale mọi thứ to hơn.

## 13. Accessibility

- Semantic HTML trước ARIA: buttons thật cho word/card/pen/clue; `<main>`,
  `<header>`, `<section aria-labelledby>`.
- Keyboard path đầy đủ: pens = toolbar radio (arrow keys + 1/2/3 shortcuts),
  words/cards = Tab + Enter/Space; card move = ◀ ▶ (hoặc ←/→ khi focus card);
  focus visible 3px cobalt mọi nơi.
- Screen reader: sentence có `aria-label` đầy đủ trước token hoá; verdict
  `aria-live="polite"`; mark label đọc qua `aria-pressed` + visually label.
- Không motion-only meaning, không color-only meaning, không time pressure.
- Error copy không trừng phạt ("Not yet — the verb is still hiding.").

## 14. Forbidden visual patterns (anti-goals)

- Dashboard/analytics grid, card-inside-card soup, glassmorphism, neon,
  3D, purple-blue AI gradient.
- Noir đáng sợ: nền đen, spotlight, shadow dày, texture sần rạp.
- Emoji làm visual chính; icon library ngoài (dựng SVG nguyên bản).
- Color-only grammar marks; hover-only affordance; timer/streak/leaderboard.
- Chữ nghiêng decorative khó đọc cho A1/A2; chữ < 12px.

## 15. Đối chiếu UI UX Pro Max — giữ / loại (spec wins)

| Skill recommendation | Quyết định | Lý do |
|---|---|---|
| Claymorphism + Vibrant & Block-based cho "education app" (products.csv) | **LOẠI** | Trái thesis paper dossier phẳng, không soft-3D |
| Editorial black + pink accent (colors.csv Magazine/Blog) | **LOẠI** | Palette khóa: cobalt/hl-yellow/red-pencil trên giấy ấm |
| Playfair Display + Source Serif 4 + JetBrains Mono tri-stack (typography.csv) | **GIỮ một nửa** | Concept tri-stack serif+mono metadata giữ; fonts thay bằng Fraunces/Atkinson/IBM Plex Mono vì tính readability trẻ + cá tính dossier |
| inclusive-design: 7:1 contrast, no color-only symbols, focus ring 3–4px, reduced-motion | **GIỮ** | Khớp a11y spec (icon+text+pattern cues) |
| Touch: 44pt/48dp + ≥8dp spacing, WCAG 2.5.8 (app-interface.csv) | **GIỮ** | Targets ≥44px, spacing ≥8px |
| UX Animation: reduced-motion severity High; no infinite decorative animation | **GIỮ** | Motion budget + reduced-motion map ở §11 |
| e-ink-paper style: sharp transitions, no fade, reading-first | **GIỮ phần reading-first** | Bỏ "transition: none" cứng — spec cho phép motion purposeful; giữ tinh thần print-calm |
| Google Fonts runtime import (CSS import strings của skill) | **LOẠI** | Repo font policy: self-host `@fontsource/*` bundle |

## 16. Assets — quyết định phân loại

- **(A) CSS**: paper grain procedural, folder tabs, washes, underlines, stamps
  border — tất cả CSS thuần.
- **(B) SVG gốc**: magnifier, paperclip, stamp, pen nib, folder chevron
  (`src/components/art.tsx`) — Apache-2.0 original.
- **(C) Codex raster: KHÔNG dùng.** Thesis đạt đầy đủ bằng print materials
  code-native; không có asset nào raster materially better — skip toàn bộ
  pipeline IMAGE_BRIEF/generated-manifest.
- **(D) Third-party: KHÔNG dùng** (không icon library, không texture ngoài).
