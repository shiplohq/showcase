# DESIGN_DECISIONS — Rhythm Canvas (Showcase #17)

> Khóa design system cho showcase #17. Nguồn: spec `.showcase/17_rhythm-canvas.md`
> (visual thesis **Kinetic Swiss poster: black-tinted navy, warm white, signal red,
> acid-lime tiết chế; type huge; circles/bars theo beat** đã khóa). Đối chiếu UI UX
> Pro Max (queries: `music audio player visualizer creative tool controls`,
> `swiss international typographic poster`, `font pairing grotesque poster display mono`,
> `audio player accessibility volume mute keyboard`,
> `reduced motion media player focus visible touch targets`). Huashu **không invoke** —
> art direction đã khóa trong spec (spec cho phép bỏ exploration khi brief đã khóa).

## 1. Visual thesis

**Kinetic Swiss poster trên navy đêm, đọc như instrument.** Cả app là một tờ
poster in/screen-print cho một đêm nhạc điện tử: nền navy pha đen, lưới hairline,
crop marks ở góc, khối type cực lớn, chú thích mono như nhãn thiết bị đo. Hình học
beat (vòng tròn đồng tâm, thanh bước, quỹ đạo) vẽ trên canvas — phẳng, nét quyết
đoán, không glow neon. Đây là **dark counterpart** của Swiss-poster lineage trong
batch (#14 atom-forge là giấy off-white sáng, grotesque Archivo) và hoàn toàn khác
#18 aurora-lamp (sẽ là product microsite GSAP): rhythm-canvas là **full-bleed
instrument stage**, không scroll, không marketing page.

Từ khóa: night poster · navy ink · warm white · signal red · acid-lime (tiết chế) ·
hairline grid · oversized condensed type · mono annotations · oscilloscope readout ·
flat geometry · deterministic beat clock.

## 2. Target users

Người xem Shiplo muốn thấy static site vẫn chạy được trải nghiệm multimedia giàu
tương tác. Không phải DJ tool thật — mọi control phải tự explain trong 5 giây,
không thuật ngữ sản xuất âm nhạc.

## 3. Font pairing (khác #14 Archivo, khác #18)

| Role | Font | via | Lý do |
|---|---|---|---|
| Display (PULSE/ORBIT/TYPE, số lớn) | **Anton** 400 (latin) | `@fontsource/anton` | Condensed poster display — screen-print energy, đứng vững ở 20vw; họ hàng hoàn toàn khác Archivo của #14 |
| Body/UI | **Space Grotesk** 400/500/700 (latin) | `@fontsource/space-grotesk` | Grotesque techy, đọc rõ trên nền tối, hợp vibe instrument |
| Mono annotations (BPM, time, labels) | **Space Mono** 400/700 (latin) | `@fontsource/space-mono` | Readout thiết bị đo; pairing "Kinetic Motion" của UI UX Pro Max cũng chỉ về Space Mono |

Cả ba font SIL OFL 1.1 — redistribute được. UI copy **English**, latin-only
(quyết định nhất quán batch; creative tool có audience quốc tế). Fallback stack:
`Anton, "Arial Narrow", Impact, sans-serif` / `Space Grotesk, "Segoe UI", sans-serif` /
`Space Mono, "Cascadia Mono", Consolas, monospace` — font-display swap (fontsource default).

## 4. Color tokens (spec khóa)

| Token | Hex | Vai trò |
|---|---|---|
| `--navy` | `#0A0F1E` | Nền chính — navy pha đen |
| `--navy-2` | `#101830` | Panel/recessed (transport rail, sheet) |
| `--line` | `#2A3654` | Hairline grid (không mang nghĩa) |
| `--white` | `#F4EFE4` | Ink chính — warm white (type, rules đậm) |
| `--white-dim` | `#9AA3B8`→ (rgba white 62%) | Text phụ, annotation mờ |
| `--red` | `#E8402A` | **Signal red** — downbeat, beat accent của nhạc (chỉ nhạc tự chơi) |
| `--lime` | `#C9F53C` | **Acid-lime, cực tiết chế** — CHỈ cho hành động của người dùng (tap accent, focus ring, manual override). Lime không bao giờ xuất hiện từ nhạc tự chơi |

Nguyên tắc nghĩa màu: red = máy (beat/choreography), lime = người (tap/focus/choice),
warm white = cấu trúc. Mọi trạng thái kèm shape/text cue (lamp đổi fill ↔ outline,
label AUTO/MANUAL), không color-only. Không gradient (trừ hairline procedural),
không glassmorphism, không neon glow.

## 5. Interaction model (5 rules)

1. **Một gesture mở khóa tất cả** — nút PLAY lớn resume AudioContext (autoplay
   policy) và start deterministic clock; không có trạng thái "chết" khác.
2. **Playhead là nguồn sự thật duy nhất** — visual/scheduler đều derive từ
   `beats[]` JSON + `AudioContext.currentTime`, không đếm frame; loop lặp lại
   y hệt (deterministic, spec JSON contract).
3. **Tap = accent ở đúng điểm chạm** — click/tap stage tạo ring lime + click
   ngắn; không microphone, không ghi âm (spec: không xin mic).
4. **Mode là lens, không phải trang** — 1/2/3 đổi Pulse/Orbit/Type bằng crossfade
   300ms trên cùng playhead; sections[].mode trong JSON là choreography tự chạy,
   user chọn tay → MANUAL thắng đến hết section đó rồi trả về AUTO.
5. **Mọi control keyboard + focus rõ** — Space play/pause, 1/2/3 mode, M mute,
   T tap accent, ←/→ seek ±1 beat, Esc đóng sheet; focus ring lime 2px, target
   ≥44px (touch), gap ≥8px.

## 6. Anti-patterns (cấm)

1. Không gradient tím-xanh AI mặc định (palette đã khóa ở §4).
2. Không card-in-card soup — chỉ có stage + 2 rail (top info, bottom transport) + sheet.
3. Không fake dashboard audio (meter chết, spectrum giả) — mọi readout là dữ liệu
   thật từ clock/analyser hoặc không tồn tại.
4. Không neon glow/shadow dày — poster phẳng, hairline.
5. Không emoji icon — glyph SVG code-native (play/pause/mute/info/arrow).

## 7. Responsive behavior

- **Mobile 390×844 (hỗ trợ)**: stage full-bleed; transport dock bottom, target 48px;
  mode selector thành hàng segmented phía trên transport; About = bottom sheet.
- **Tablet 1024×768 (viewport quan trọng)**: hairline grid + annotations hiện đủ,
  target ≥48px, không phụ thuộc hover.
- **Desktop 1440×900**: poster margin với crop marks + corner annotations, shortcuts
  hint ở transport, nhiều simultaneous context (stage + readouts).
- 360px: layout vẫn không vỡ (type co theo clamp, transport wrap).

## 8. Motion budget + reduced-motion THẬT

- Micro feedback 120–220ms; mode/spatial transition 250–400ms; reveal ≤900ms;
  intro không khóa thao tác (poster render tĩnh ngay, play CTA hiện liền).
- Canvas beat motion liên tục nhưng **gắn với clock** (ring nở theo tuổi beat,
  góc orbit = hàm của playhead — không tích lũy frame → deterministic).
- **Reduced-motion (media query + toggle tay trong transport, localStorage
  `rc.prefs` — anonymous setting, có reset)**: tắt rAF loop → vẽ **static poster**
  (một frame composition tại playhead hiện tại, chỉ vẽ lại khi beat/mode/seek/resize
  đổi); progress bar vẫn chạy (update rời rạc, không tween); beat lamp đổi trạng
  thái rời rạc (fill ↔ outline); GSAP wrapper collapse mọi tween thành `set()`,
  chỉ giữ fade ≤150ms; type mode đổi token bằng fade ngắn, không stagger/karaoke.

## 9. Audio architecture (không file audio)

Demo loop **tự tổng hợp 100% bằng Web Audio** từ patch data trong `tracks.json`
(không tải audio từ internet — license audio trên mạng không rõ → chặn theo
THIRD_PARTY_POLICY). Voice: kick (sine drop), snare (noise bandpass + tone),
hat (noise highpass), bass (saw + lowpass env), pluck (detune triangle) + feedback
delay nhẹ. Chain: voices → master gain (volume/mute) → compressor → analyser →
destination. Scheduler lookahead 120ms/25ms tick. Analyser chỉ feed readout/ring
nhẹ — beat visual vẫn theo `beats[]` deterministic (spec).

## 10. Data contract

`public/data/tracks.json`: 3 track (72/96/120 BPM), mỗi track `bpm`, `bars`,
`beats[]` (timestamps giây, validate monotonic + spacing khớp bpm), `sections[]`
(`from/to` theo beat index, `mode`, `energy`, `label`), `pattern` (16-step × voice,
velocity 0..1), `root`/`scale`, `copy.tokens` cho Type mode. Validate dev-time
trong `lib/data.ts` → lỗi degrade thành error plaque kiểu poster, không white screen.

## 11. Phân công stack

- Vanilla TypeScript + Vite (spec) — không framework; state 3 lớp theo spec
  (content = JSON, interaction = session memory, personal = localStorage prefs).
- GSAP 3.15 từ npm dependency → **bundle vào dist bởi Vite** (pattern của 5 project
  Vite đã live: number-garden, solar-system-explorer, grammar-detective, atom-forge…;
  self-contained, không runtime CDN — clock-quest dùng vendor/ script tag vì no-build,
  Vite project trong batch chuẩn là npm+bundle). Wrapper `src/lib/gsap.ts` register
  một lần, collapse tween khi reduced. Plugin dùng: `CustomEase` (poster reveal),
  `SplitText` (Type mode) — không import plugin không dùng.
- Canvas 2D cho beat geometry; DOM cho type overlay + UI; SVG code-native cho icon.

## 12. Đối chiếu UI UX Pro Max → giữ/bỏ

- Giữ: grid Swiss + type hierarchy rõ (style `minimalism-and-swiss-style`); touch
  target ≥44px + gap ≥8px (guideline Touch); keyboard path đầy đủ + focus không bị
  che (guideline Accessibility — transport không sticky đè focus); reduced-motion
  media query (guideline Animation, severity High); pairing Display+Mono
  (typography "Kinetic Motion" → Space Mono được chọn).
- Bỏ: `spectrum-design-system` (enterprise token — mâu thuẫn poster thesis);
  `interactive-cursor-design` (cursor trail mâu thuẫn instrument precision + touch
  không có cursor); hover-only patterns; mọi gợi ý thêm màu/glow.
