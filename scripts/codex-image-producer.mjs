#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Wrapper gọi OpenAI Codex đúng một vai trò: raster image asset producer.
// Quy trình đầy đủ: design/codex-image-producer.md
//
// Cú pháp flag đối chiếu với docs chính thức Codex CLI (2026-09-01):
//   codex exec "PROMPT" --sandbox workspace-write
// Sau khi upgrade Codex CLI, re-verify bằng `codex exec --help` trước khi đổi flag.
//
// Dùng:
//   npm run assets:codex                                # dùng design/IMAGE_BRIEF.md (repo-level)
//   npm run assets:codex -- --project number-garden     # dùng projects/<id>/design/IMAGE_BRIEF.md
//   npm run assets:codex -- --dry-run                   # chỉ in lệnh, không chạy

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

const dryRun = args.includes("--dry-run");
const projectIdx = args.indexOf("--project");
const project = projectIdx !== -1 ? args[projectIdx + 1] : null;

if (projectIdx !== -1 && (!project || project.startsWith("--"))) {
  console.error("lỗi: --project cần giá trị <id> (ví dụ: number-garden)");
  process.exit(1);
}

// Scope theo project: mỗi showcase là một static app tự chứa — brief và generated
// assets phải nằm trong project đó. Repo-level chỉ dùng cho asset dùng chung.
const briefPath = project
  ? join(repoRoot, "projects", project, "design", "IMAGE_BRIEF.md")
  : join(repoRoot, "design", "IMAGE_BRIEF.md");
// DESIGN_DECISIONS.md sống ở design/ theo quy trình; fallback vị trí cũ (project root)
// để không phá ai đang đặt nó ở đó.
const decisionsCandidates = project
  ? [join(repoRoot, "projects", project, "design", "DESIGN_DECISIONS.md"), join(repoRoot, "projects", project, "DESIGN_DECISIONS.md")]
  : [join(repoRoot, "design", "DESIGN_DECISIONS.md"), join(repoRoot, "DESIGN_DECISIONS.md")];
const decisionsPath = decisionsCandidates.find((p) => existsSync(p)) ?? decisionsCandidates[0];
const briefRef = project
  ? `projects/${project}/design/IMAGE_BRIEF.md`
  : "design/IMAGE_BRIEF.md";
const outputRef = project
  ? `projects/${project}/public/assets/generated/`
  : "public/assets/generated/";
const decisionsRef = decisionsPath.startsWith(repoRoot)
  ? decisionsPath.slice(repoRoot.length + 1).replaceAll("\\", "/")
  : "DESIGN_DECISIONS.md";

// Gate 1: Codex CLI phải có sẵn. Thiếu → báo và thoát — KHÔNG tự cài, KHÔNG fallback
// sang API key hay provider khác. Quyết định thay generator là của user.
const versionCheck = spawnSync("codex", ["--version"], {
  shell: process.platform === "win32",
  encoding: "utf8",
});
if (versionCheck.error || versionCheck.status !== 0) {
  console.error(
    "lỗi: không tìm thấy Codex CLI trên PATH.\n" +
      "      Cài thủ công: npm install -g @openai/codex  (chạy lại lệnh này sau khi cài).\n" +
      "      Script không tự cài và không tự fallback sang generator khác."
  );
  process.exit(1);
}
console.error(`codex: ${versionCheck.stdout.trim()}`);

// Gate 2: phải có brief explicit trước khi invoke Codex. Không brief → không sinh asset.
if (!existsSync(briefPath)) {
  console.error(
    `lỗi: thiếu ${briefRef}.\n` +
      "      Copy design/IMAGE_BRIEF.template.md, điền đủ mọi field cho từng asset, rồi chạy lại."
  );
  process.exit(1);
}

const briefText = readFileSync(briefPath, "utf8");
const templateText = readFileSync(join(repoRoot, "design", "IMAGE_BRIEF.template.md"), "utf8");
if (briefText.trim() === templateText.trim()) {
  console.error(`lỗi: ${briefRef} vẫn là template chưa điền — không invoke Codex với brief rỗng.`);
  process.exit(1);
}

// Gate 3 (mềm): DESIGN_DECISIONS.md nên tồn tại ở cùng scope — Codex được yêu cầu đọc nó,
// và nó là nguồn sự thật visual mà brief không được mâu thuẫn.
if (!existsSync(decisionsPath)) {
  console.error(
    `cảnh báo: chưa thấy ${decisionsRef} — Codex sẽ không có design system để đối chiếu. ` +
      "Tạo nó trước (UI UX Pro Max) trừ khi bạn chủ động chạy không có design system."
  );
}

const prompt = `FIRST ACTION of this run — do not read any file before it: invoke the built-in $imagegen skill to generate the asset(s) defined in ${briefRef}, saving each output file to its exact "Output path" from the brief (under ${outputRef}).

After the files exist on disk, read ${briefRef} and ${decisionsRef} and check your output against every constraint (palette, mood, no text, no watermark, tileability, uniform lighting). If your generated file violates any constraint, regenerate it once with a corrected $imagegen prompt.

Rules:
- Images must come from the real $imagegen tool only. Never draw, render or synthesize them with code (no System.Drawing, no canvas, no PIL, no ImageMagick) — code-drawn files do not count as generated assets.
- Write image files only under ${outputRef}
- Do not modify application source code, the product specification, or anything else.
- The run is only complete when every asset entry in the brief exists as a file on disk. A reply without the files on disk is a failed run.

Final reply: for each asset — file path, the imagegen tool/model used, and its brief ID.`;

const codexArgs = ["exec", prompt, "--sandbox", "workspace-write"];

if (dryRun) {
  console.error("--- dry run: lệnh sẽ chạy là ---");
  console.error(`codex ${codexArgs.map((a) => JSON.stringify(a)).join(" ")}`);
  process.exit(0);
}

console.error(
  `chạy codex exec (sandbox workspace-write) — brief: ${briefRef} → output: ${outputRef}`
);

// Windows cần shell:true để resolve shim npm của codex (.cmd), nhưng shell:true
// nối args bằng khoảng trắng KHÔNG quote → prompt nhiều từ bị parse nhầm thành
// subcommand. Với shell, tự quote từng arg; POSIX gọi trực tiếp không cần shell.
// (Node >= 18.20 khuyến nghị: khi dùng shell, truyền MỘT chuỗi lệnh thay vì
// args array để tránh DEP0190.)
const useShell = process.platform === "win32";
const run = useShell
  ? spawnSync("codex " + codexArgs.map(quoteWindowsArg).join(" "), {
      cwd: repoRoot,
      stdio: "inherit",
      shell: true,
    })
  : spawnSync("codex", codexArgs, {
      cwd: repoRoot,
      stdio: "inherit",
    });

if (run.error || run.status !== 0) {
  console.error("lỗi: codex exec thất bại — xem output bên trên.");
  process.exit(run.status ?? 1);
}

console.error(
  "\nsau khi chạy xong, nhớ:\n" +
    "  1. Review visual TỪNG file generated (không integrate mù).\n" +
    `  2. Cập nhật manifest provenance (nội bộ, không ship): design/generated-manifest.json\n` +
    `     hoặc projects/<id>/design/generated-manifest.json (schema: design/codex-image-producer.md).\n` +
    "  3. Asset không đạt → sửa brief và regenerate — không đổi UI để chiều ảnh xấu."
);

function quoteWindowsArg(arg) {
  // Arg chỉ gồm ký tự an toàn cho cmd.exe thì khỏi quote; còn lại bọc trong dấu
  // nháy kép. Prompt của script này không chứa dấu nháy kép (wrapper tự chế biến),
  // nên escaping tối thiểu là đủ và không đụng vào parsing MSVC của Rust CLI.
  if (/^[A-Za-z0-9_./:=+-]+$/.test(arg)) return arg;
  return `"${arg.replaceAll('"', "'")}"`;
}
