#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Shiplo Platform MCP bridge — speaks JSON-RPC over stdio to the
// @shiplohq/mcp server declared in ~/.claude.json → projects → mcpServers
// (the API token is read from that config at runtime and never stored here).
// Use when the MCP tools are not exposed to the current session.
//
// Usage (from anywhere in the repo):
//   node scripts/shiplo-mcp.mjs tools
//   node scripts/shiplo-mcp.mjs call platform_account_status '{}'
//   node scripts/shiplo-mcp.mjs call platform_list_sites '{}'
//   SHIPLO_MCP_CWD="D:\\path\\to\\projects\\<slug>" \
//     node scripts/shiplo-mcp.mjs call platform_deploy_static \
//     '{"site_id":"...","build_command":"npm run build","output_dir":"dist"}'
//
// Deploy flow (docs/DEPLOYMENT.md): account_status (check plan caps) →
// create_site (once per project) → deploy_static → deployment_status
// (real timestamps). Record the returned url VERBATIM — never construct one.

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const command = process.argv[2] ?? 'tools';
const cfg = JSON.parse(readFileSync(join(homedir(), '.claude.json'), 'utf8'));
const server =
  cfg.projects?.['D:/Shiplo/showcase']?.mcpServers?.['platform-mcp'] ??
  cfg.mcpServers?.['platform-mcp'];
if (!server) {
  console.error('platform-mcp is not configured (expected in ~/.claude.json).');
  process.exit(1);
}

const proc = spawn(server.command, server.args, {
  env: { ...process.env, ...server.env },
  stdio: ['pipe', 'pipe', 'inherit'],
  shell: process.platform === 'win32',
  cwd: process.env.SHIPLO_MCP_CWD || process.cwd(),
});

let msgId = 0;
const pending = new Map();
let buffer = '';

proc.stdout.on('data', (chunk) => {
  buffer += chunk.toString('utf8');
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id !== undefined && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    } catch {
      // Non-JSON chatter from the server — ignore.
    }
  }
});

function request(method, params) {
  const id = ++msgId;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

const notify = (method, params) =>
  proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');

const init = await request('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'shiplo-showcase-tools', version: '1.0.0' },
});
console.error('server:', init.result?.serverInfo?.name, init.result?.serverInfo?.version);
notify('initialized', {});

if (command === 'tools') {
  const tools = await request('tools/list', {});
  for (const t of tools.result?.tools ?? []) {
    console.log(`## ${t.name}`);
    console.log((t.description ?? '').split('\n')[0]);
    if (t.inputSchema?.properties) console.log('args:', Object.keys(t.inputSchema.properties).join(', '));
    console.log();
  }
} else if (command === 'call') {
  const name = process.argv[3];
  const args = JSON.parse(process.argv[4] ?? '{}');
  const res = await request('tools/call', { name, arguments: args });
  console.log(JSON.stringify(res.result ?? res.error, null, 2));
} else {
  console.error('usage: node scripts/shiplo-mcp.mjs [tools | call <name> <json>]');
  proc.kill();
  process.exit(2);
}

proc.kill();
process.exit(0);
