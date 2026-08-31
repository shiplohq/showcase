# Codex Image Asset Producer — operating guide

Vai trò: **OpenAI Codex** là producer chuyên trách cho raster assets sinh bằng AI. Claude Code giữ nguyên vai trò chính: product requirements, UI architecture, frontend implementation. Tài liệu này mô tả cách invoke Codex một cách có kỷ luật cho đúng một việc duy nhất đó.

## Phân vai

| Việc | Ai làm |
|---|---|
| Product requirements, spec, scope | Claude (spec `.showcase/<NN>_<slug>.md` là nguồn sự thật) |
| UI architecture, frontend implementation | Claude |
| Design system (`DESIGN_DECISIONS.md`) | Claude (UI UX Pro Max / Huashu) |
| **Raster assets AI-generated**: illustrations, backgrounds, characters, sprites, textures, product visuals, decorative artwork | **Codex** (qua `IMAGE_BRIEF.md`) |
| Icons, diagrams, charts, geometry, UI elements | Không qua Codex — làm bằng SVG/CSS/HTML trực tiếp |
| Review + integrate asset vào UI | Claude (review visual bắt buộc trước khi integrate) |

**Không** delegate application redesign hay code changes tùy tiện cho Codex. Codex không được sửa source, không được sửa spec, không được redesign frontend.

## Prerequisites

- Codex CLI đã cài và đang login: `codex --version`, `codex login status`.
- CLI **chưa có** → báo user, **không tự cài**, không tự fallback sang provider khác.
- **Không sửa global Codex config** (`~/.codex/`). Mọi ràng buộc scope truyền qua flag/prompt của từng lần chạy.

## Verification (chạy lại sau khi cài/upgrade CLI)

```bash
codex --version
codex exec "Inspect the current directory and return only the repository name. Do not modify files."
```

Kiểm tra imagegen capability (chưa generate ảnh thật):

```bash
codex exec "Report whether your image-generation (imagegen) capability is available in this environment. Do not generate any image. Answer in one line: AVAILABLE or UNAVAILABLE, plus the tool/model name if available."
```

Imagegen là một skill của Codex (`$imagegen`, model `gpt-image-2` theo docs). Docs chưa xác nhận rõ hành vi dưới `codex exec` non-interactive — vì vậy câu trả lời đáng tin duy nhất là **hỏi chính Codex** như trên. Nếu UNAVAILABLE → ghi nhận limitation và **dừng setup ở bước verification**: không tự fallback sang OpenAI API key hay external image provider.

## Workflow mỗi lần cần asset raster

1. Claude copy `design/IMAGE_BRIEF.template.md` → `design/IMAGE_BRIEF.md` (repo-level) hoặc `projects/<id>/design/IMAGE_BRIEF.md` (theo project — khuyến nghị, vì build của mỗi showcase phải self-contained). Điền đủ mọi field.
2. Chạy Codex (script hoặc lệnh thủ công bên dưới) — sandbox `workspace-write`, chỉ được ghi vào `public/assets/generated/`.
3. **Verify output là AI-generated thật** (xem "Qui ước prompt" bên dưới): file tồn tại trên đĩa **và** có dấu vết tool imagegen trong output (thường là source dưới `~/.codex/generated_images/…` được copy vào output). Trong pilot #01, Codex một lần *vẽ ảnh bằng PowerShell System.Drawing rồi báo CREATED* — kết thúc bằng chữ "CREATED" không chứng minh được gì.
4. **Review visual** từng file generated. Asset không đạt → **regenerate/edit qua Codex với brief sửa lại** — không đổi UI để chiều tấm ảnh xấu.
5. Cập nhật manifest provenance — `design/generated-manifest.json` (repo-level) hoặc `projects/<id>/design/generated-manifest.json` (theo project).
6. Integrate vào UI, refresh `THIRD_PARTY_NOTICES.md` của project nếu policy yêu cầu.

## Invocation template

Cú pháp flag đã đối chiếu với docs chính thức Codex CLI (2026-09-01): `exec` = non-interactive; `--sandbox workspace-write` cho phép ghi trong workspace; `--full-auto` đã deprecated. Sau khi upgrade CLI, re-verify bằng `codex exec --help` trước khi thay đổi flag.

### Qui ước prompt (bắt buộc — bài học pilot #01)

Dưới `codex exec` non-interactive, model **không tự gọi** imagegen nếu prompt chỉ mô tả nhiệm vụ — nó dừng ở "tóm tắt kế hoạch, chưa đổi file nào", hoặc tệ hơn: vẽ ảnh bằng code rồi báo thành công. Prompt chuẩn PHẢI:

1. Đặt lệnh gọi `$imagegen` là **FIRST ACTION** — trước cả việc đọc file;
2. **Cấm rõ ràng** vẽ/render bằng code (System.Drawing, canvas, PIL, ImageMagick);
3. Định nghĩa **điều kiện hoàn tất = file tồn tại trên đĩa** — "một câu trả lời không có file là run thất bại".

Wrapper `scripts/codex-image-producer.mjs` đã dùng đúng prompt này. Bản thủ công tương đương (khi chạy không qua wrapper):

```bash
codex exec "
FIRST ACTION of this run — do not read any file before it: invoke the built-in \$imagegen skill to generate the asset(s) defined in <brief-path>, saving each output file to its exact 'Output path' from the brief (under <output-dir>).

After the files exist on disk, read <brief-path> and <decisions-path> and check your output against every constraint. If your generated file violates any constraint, regenerate it once with a corrected \$imagegen prompt.

Rules:
- Images must come from the real \$imagegen tool only. Never draw, render or synthesize them with code (no System.Drawing, no canvas, no PIL, no ImageMagick) — code-drawn files do not count as generated assets.
- Write image files only under <output-dir>
- Do not modify application source code, the product specification, or anything else.
- The run is only complete when every asset entry in the brief exists as a file on disk. A reply without the files on disk is a failed run.

Final reply: for each asset — file path, the imagegen tool/model used, and its brief ID.
" --sandbox workspace-write
```

Cách chạy khuyến nghị (repo-level, dùng script wrapper):

```bash
npm run assets:codex                          # dùng design/IMAGE_BRIEF.md
npm run assets:codex -- --project number-garden   # dùng projects/number-garden/design/IMAGE_BRIEF.md
```

Khi chạy theo project, thay `design/IMAGE_BRIEF.md` → `projects/<id>/design/IMAGE_BRIEF.md` và `public/assets/generated/` → `projects/<id>/public/assets/generated/` (hoặc để script wrapper tự map bằng `--project <id>`).

## Provenance — manifest schema

Manifest provenance là **tài liệu nội bộ**: nằm ở `design/generated-manifest.json` (repo-level) hoặc `projects/<id>/design/generated-manifest.json` (theo project) — **không bao giờ đặt trong `public/`**, vì mọi thứ trong `public/` bị copy vào `dist/` và serve công khai. Mỗi entry trong `assets` gồm:

| Field | Ý nghĩa |
|---|---|
| `file` | Đường dẫn asset, relative tới manifest |
| `briefId` | ID từ `IMAGE_BRIEF.md` (`IMG-<NN>-<seq>`) |
| `generator` | Ví dụ `openai-codex (gpt-image-2)` — ghi rõ tool + model |
| `generationType` | `generated` \| `edited` \| `upscaled` \| `outpainted` |
| `createdAt` | ISO 8601 |
| `intendedUse` | Vị trí/vai trò trong UI |
| `thirdPartyReference` | `none` hoặc `{source, license, reason}` |
| `notes` | Ghi chú review, iteration, quyết định |

### Bản quyền & provenance

- **Không tự động tuyên bố sở hữu bản quyền độc quyền** chỉ vì asset là AI-generated. Quyền exploited trên output AI phụ thuộc điều khoản dịch vụ + luật tại thời điểm tạo — xử lý qua review pháp lý bình thường, không qua ghi chú tự chế.
- Nếu asset dùng reference từ bên thứ ba → phải khai trong `thirdPartyReference` và pass qua `THIRD_PARTY_POLICY.md`.
- **Không bao giờ silently switch** từ Codex sang generator khác. Nếu Codex/imagegen unavailable hoặc chất lượng không đạt → dừng, báo user, quyết định thay generator là quyết định của user.

## Nội bộ vs shipped artifact

Tách bạch hai lớp — đây là cách giữ workflow/tooling không lộ vào sản phẩm public:

- **Shipped** (xuất hiện trong `dist/`, deploy lên Shiplo): code, HTML/CSS/JS, và generated images trong `public/assets/generated/` — chúng là một phần của product.
- **Internal** (chỉ tồn tại trong repo, không bao giờ ship): `CLAUDE.md`, `.claude/`, `.showcase/`, `design/` (IMAGE_BRIEF, generated-manifest, tài liệu này), `scripts/`, `templates/`, `vendor/`.
- Page shipped không được tham chiếu/trỏ tới bất kỳ file internal nào; UI copy không nhắc đến quy trình sản xuất asset — provenance sống trong manifest nội bộ của repo, không phải trong UI.
- `npm run verify:static` có guard cứng: thấy `IMAGE_BRIEF*` hay `generated-manifest.json` trong `dist/` → fail artifact.

## Trạng thái verification (2026-09-01)

- **Codex CLI**: `codex-cli 0.151.0` — `codex exec` non-interactive PASS (read-only task trả kết quả đúng, exit 0). Model mặc định: `gpt-5.6-sol`, provider `openai`, sandbox mặc định `read-only`, approval `never`.
- **Imagegen capability**: Codex tự báo **AVAILABLE — `image_gen.imagegen` (GPT Image)** (chưa generate ảnh thật; lần generate đầu tiên trong workflow thật sẽ là verification end-to-end).
- Ghi chú môi trường: Codex desktop app (MSIX) có sẵn trên máy nhưng **không** expose CLI lên PATH — CLI phải cài riêng (`npm install -g @openai/codex`). `~/.codex/` là auth/config dùng chung — không sửa từ repo.
