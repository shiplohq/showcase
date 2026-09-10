# DESIGN_DECISIONS — Paper & Pixel (Showcase #19)

> Khóa design system cho showcase #19. Nguồn: spec `.showcase/19_paper-pixel-portfolio.md`
> (visual thesis đã khóa: contemporary editorial — ivory paper, ink black tinted, ultramarine
> accent, salmon note; serif display + narrow grotesk; image placeholders là abstract SVG
> compositions; KHÔNG grid card template) + đối chiếu UI UX Pro Max (queries:
> `editorial magazine portfolio index typography serif grotesk`,
> `editorial serif display font newsprint didone`, `ivory paper ink ultramarine editorial color palette`,
> `portfolio case study interaction hover reveal thumbnail`, `gsap flip shared element transition list detail`).
> Brief thắng recommendation: màu từ skill DB (pink accent / cream+amber) mâu thuẫn thesis
> → loại; giữ cấu trúc chuyển động từ preset Flip (expo/power3, 500–800ms cap, skip khi
> reduced-motion) và quy tắc stagger ≤0.04s.

## 1. Visual thesis — "The printed index, brought to screen"

Paper & Pixel là studio hư cấu hai người đ bottled print và digital. Site được art-direct
như **một trang mục lục của ấn phẩm in** được chiếu lên màn hình: nền giấy ivory, mực đen
ngả ấm, bút ultramarine, ghi chú lề salmon. Homepage không phải grid card mà là **index
có số thứ tự** (№ 01–03) — mỗi work là một dòng ruled bằng hairline, tiêu đề serif lớn,
meta narrow-grotesk. Thumbnail không phải ảnh: mỗi project có **một "plate" SVG trừu tượng
duy nhất** và hệ **crop window** (wide / card / tall) — cùng một artwork, nhiều khung cắt
khác nhau = ngôn ngữ "cropped thumbnails" của biên tập ảnh. Mỗi plate trộn đúng hai chất
liệu studio: **paper** (đường contour organic, ledger lines, mép giấy xé) và **pixel**
(khối stepped, dot matrix, lưới ô vuông).

Ba tín hiệu nhận diện không trùng showcase nào đã ship: (1) index ruled-numbered với
preview frame sticky kiểu lightbox biên tập, (2) plate SVG crop-window system, (3)
type-led transition — Flip plate + dòng chữ mask-rise, không card, không tile.

Từ khóa: contemporary editorial · ivory & warm ink · ultramarine pen · salmon margin
note · ruled index · cropped plate · serif display + narrow grotesk · flat, no gradient.

Visual diversity trong batch: #18 aurora-lamp là product-launch microsite (dark, glow);
#20 habit-bloom là gentle tracker; #19 là editorial index sáng nền giấy, led bởi typography
— không overlap ngôn ngữ.

## 2. Target users

Designer/dev muốn tham khảo một portfolio tĩnh giàu motion. Hệ quả:

- Copy tiếng Anh (portfolio của studio hư cấu), giọng confident, ngắn, không marketing fluff.
- Mọi artwork là SVG code-native — không ảnh thật, không artwork của studio/người thật
  (ràng buộc spec: fictional 100%).
- Reading content giới hạn ~34em line length; index row là link thật `<a href="#/…">`.

## 3. Interaction principles

1. **Row là link, không div** — index row là anchor hash-route; keyboard/reader dùng
   được ngay; focus = hover (không thông tin chỉ tồn tại khi hover).
2. **Hover/focus một row → plate của nó slide vào preview frame sticky** (desktop ≥1024px);
   frame crop dạng "card". Touch (<1024px, không hover): mỗi row mang sẵn inline crop nhỏ —
   preview frame chỉ là enhancement, không phải điều kiện.
3. **Case transition = shared element Flip** (plate crop card → hero wide, 480ms,
   power3.inOut) + type-led mask-rise cho tiêu đề (≤320ms). Reduced-motion: skip Flip,
   swap tức thì.
4. **Esc trong case → về index**, focus trả về row xuất phát.
5. **Motion toggle** ở masthead: On / Off / (mặc định theo hệ thống), lưu localStorage
   `pp:motion` (anonymous setting, có reset bằng cách bật lại) — tắt motion = mọi
   transition còn ≤ opacity fade hoặc tức thì.
6. Scroll reveal: heading/lede từng section rise 12px + fade 300–420ms, một lần,
   IntersectionObserver; reduced-motion: hiện tức thì.

## 4. Color tokens

Ivory paper · warm ink · ultramarine pen · salmon note. Flat, không gradient, không shadow
(đậm nhất là 1px hairline). Mọi trạng thái có cue hình/text kèm màu, không color-only.

### Neutrals (giấy & mực)

| Token | Hex | Vai trò |
|---|---|---|
| `--paper` | `#F4F0E6` | Nền trang — ivory |
| `--paper-plate` | `#FBF8F1` | Nền plate/figure sáng hơn |
| `--paper-deep` | `#EAE3D3` | Vùng recessed: footer, code-ish block, row hover wash |
| `--ink` | `#1C1A16` | Text chính (contrast 14.8:1 trên paper) |
| `--ink-soft` | `#57503F` | Text phụ (~7.4:1) |
| `--ink-faint` | `#8C8271` | Decorative microcopy / số trang (~3.9:1 — không dùng cho text chức năng) |
| `--rule` | `#D8D0BD` | Hairline 1px |
| `--rule-strong` | `#1C1A16` | Rule đậm editorial (1.5px ink) |

### Accents

| Token | Hex | Vai trò |
|---|---|---|
| `--ultramarine` | `#2B36B5` | Bút chính: link, focus ring, số №, mark (7.6:1 trên paper) |
| `--ultramarine-deep` | `#20298F` | Hover/pressed |
| `--ultramarine-wash` | `#E6E5F4` | Nền nhẹ ultramarine (selection, active chip) |
| `--salmon` | `#E98C55` | Salmon graphic (plate, marker) |
| `--salmon-ink` | `#AE4A17` | Salmon text-safe (~5.6:1) — margin note, annotation |

## 5. Typography

| Role | Font | Size / line | Notes |
|---|---|---|---|
| Display XL (case title, index title) | Fraunces var, opsz auto, wght 560 | `clamp(2.75rem, 7vw, 6.5rem)` / 0.98 | tracking −0.5% |
| Display L (view heading) | Fraunces 520 | `clamp(2rem, 4vw, 3.25rem)` / 1.05 | |
| Head (section) | Fraunces 500 | 1.625rem / 1.2 | |
| Lede | Fraunces 400 italic | 1.25rem / 1.5 | max 40em |
| Body | Fraunces 400, opsz auto | 17px / 1.65 | max 34em |
| Meta / label / nav / № | Archivo Narrow 500, uppercase | 0.75rem, ls 0.14em | |
| Number № | Archivo Narrow 700 | 0.875rem–1rem | tabular feel qua width cố định 3ch |

- `@fontsource-variable/fraunces` (opsz 9–144 + wght) — latin. `font-optical-sizing: auto`.
- `@fontsource/archivo-narrow` 400/500/700 — latin.
- Cả hai OFL 1.1. UI không có dấu tiếng Việt → chỉ subset latin (đủ glyph cho toàn bộ copy);
  fallback stack: Fraunces → Georgia, 'Times New Roman', serif; Archivo Narrow → 'Arial
  Narrow', Arial, sans-serif; `font-display: swap` (fontsource mặc định).

## 6. Layout system

- Container max 1360px, lề 24px (mobile) → 64px (desktop). Grid 12 cột, gutter 32px.
- **Index (desktop ≥1024):** cột trái 7/12 là các row ruled; cột phải 5/12 sticky preview
  frame (aspect 4:3 crop "card") + caption plate. <1024: 1 cột, row kèm inline crop
  (min(38vw, 168px), aspect 4:3) bên phải tiêu đề.
- **Index row:** № (3ch) · title serif · discipline · year · → ; min-height 88px desktop /
  touch target ≥44px mọi viewport.
- **Case:** hero full-width plate crop "wide" (21:9) + title chồng mép dưới; body 2 cột
  (7/12 body + 5/12 margin-note column salmon); sections: text / quote / figure / specs.
- **Studio / Contact:** 1 cột hẹp 8/12, principles là danh sách numbered kiểu index thu nhỏ.
- Footer colophon: hairline trên, meta narrow, mailto, motion state, credit Shiplo Showcase.

## 7. Motion budget

| Loại | Thời lượng | Ease |
|---|---|---|
| Micro feedback (row hover wash, focus) | 140–180ms | ease-out (CSS) |
| Preview frame plate swap | 260ms | power2.out (GSAP) |
| View swap: Flip plate | 480ms | power3.inOut |
| View swap: type mask-rise | 280–320ms | power2.out |
| Scroll reveal | 300–420ms, stagger ≤ 0.05s | power2.out |

Không intro khóa thao tác; không elastic/bounce; mọi tween qua wrapper `src/lib/gsap.ts`
— một chỗ duy nhất tôn trọng prefers-reduced-motion + motion toggle.

## 8. Accessibility

- Semantic trước ARIA: nav/landmark thật, row là `<a>`, plate decorative `aria-hidden`,
  figure có alt từ JSON.
- Focus ring 2px ultramarine offset 3px mọi interactive; skip-link "Skip to index".
- Esc handler trong case; focus trả về row gốc; hash route — back/forward hoạt động.
- Touch target ≥44px; không hover-only content.
- Motion state không dùng màu làm cue duy nhất: toggle có text "Motion on/off" + aria-pressed.
- JSON hỏng/lỗi load → panel lỗi có copy rõ + link retry, không màn trắng.

## 9. Anti-patterns (cấm trong project này)

1. Card grid / rounded card soup — index là ruled rows.
2. Gradient tím-xanh AI mặc định; glassmorphism; neon; shadow dày.
3. Emoji làm icon — mark là chữ (№, §, →) và hình học SVG.
4. SplitText letter-circus — chỉ whole-line/element mask.
5. Ảnh thật / artwork studio thật — mọi hình là SVG code-native fictional.

## 10. Responsive behavior

| Breakpoint | Hành vi |
|---|---|
| ≥1200 desktop | Preview frame sticky 5/12, row 128px, whitespace tăng, line-length giữ |
| 1024–1199 tablet landscape | Giữ cấu trúc desktop, frame 4/12, row 104px, touch target ≥44px |
| 768–1023 tablet portrait | 1 cột; inline crop mỗi row; frame ẩn |
| <768 mobile | 1 cột; № + meta stack; inline crop nhỏ; hero case crop "card" thay "wide" |

Viewshots required: 1440×900, 1024×768, 390×844 — không vỡ, không horizontal scroll.

## 11. Data contract (khóa theo spec, mở rộng trường tuỳ chọn)

```ts
Project { slug, title, year, discipline: string[], client, summary, heroAsset, alt,
          sections: { type: 'text'|'quote'|'figure'|'specs', copy?, asset?, alt?, caption?, items? }[] }
Studio  { name, tagline, volume, yearsActive, manifesto: string[], principles: {n,title,copy}[],
          people: {name, role, note}[], contact: { email, prompt, availability, address, handles } }
```

Validate toàn bộ lúc load (dev + runtime), lỗi degrade thành ContentError panel rõ ràng.
Thêm work mới = thêm 1 object JSON + 1 plate SVG trong registry — không sửa layout.

## 12. Đối chiếu UI UX Pro Max (bảng yêu cầu bởi spec)

- **Pattern:** editorial index list + hover/focus preview (preset "shared element Flip",
  stagger list subtle) — giữ; "Wall-of-love grid" — loại (card soup).
- **Typography:** serif display + narrow grotesk — khớp thesis (Fraunces + Archivo Narrow).
- **Palette:** DB gợi ý pink/amber trên cream — loại; khóa palette ivory/ink/ultramarine/salmon.
- **5 interaction rules:** §3 (link-row, preview slide, Flip + mask-rise, Esc/focus-return, motion toggle).
- **5 anti-patterns:** §9.
- **Mobile/tablet/desktop:** §10.
