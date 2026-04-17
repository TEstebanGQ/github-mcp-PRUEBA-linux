#!/usr/bin/env node
import { spawn } from "child_process";

const args = process.argv.slice(2);
const input = args.join(" ");

const proc = spawn("node", ["src/server.js"]);

proc.stdout.on("data", (data) => {
  try {
    const parsed = JSON.parse(data.toString());
    const text = parsed.result?.content?.[0]?.text;
    if (!text) return console.log(parsed);
    formatOutput(text);
  } catch {
    console.log(data.toString());
  }
});

proc.stderr.on("data", (data) => {
  const msg = data.toString();
  if (!msg.includes("is deprecated")) console.error("Error:", msg);
});

function send(id, name, params = {}) {
  proc.stdin.write(JSON.stringify({
    jsonrpc: "2.0", id,
    method: "tools/call",
    params: { name, arguments: params }
  }) + "\n");
  proc.stdin.end();
}

function run() {
  if (!input) { console.log("Escribe un comando"); proc.kill(); return; }
  const ownerMatch = input.match(/(?:de|del usuario|owner) ([a-zA-Z0-9_-]+)/i);
  const owner = ownerMatch?.[1] ?? null;

  // REPOS
  if (/listar? repos?|ver repos?|mis repos?/.test(input)) {
    return send(1, "list_repos", owner ? { owner } : {});
  }

  if (/crear? repo/.test(input)) {
    const match = input.match(/repo (?:llamado |con nombre )?([a-zA-Z0-9_-]+)/i);
    const name = match?.[1];
    if (!name) return console.log("No detecté el nombre del repo");
    return send(2, "create_repo", { name });
  }

  if (/eliminar? repo|borrar? repo|delete repo/.test(input)) {
    const match = input.match(/repo (?:llamado |con nombre )?([a-zA-Z0-9_-]+)/i);
    const repo = match?.[1];
    if (!repo) return console.log("Necesito: elimina repo <nombre>");
    return send(3, "delete_repo", owner ? { owner, repo } : { repo });
  }

  // RAMAS
  if (/listar? ramas?|ver ramas?/.test(input)) {
    const repoMatch = input.match(/(?:del?|en) repo ([a-zA-Z0-9_-]+)/i);
    const repo = repoMatch?.[1];
    if (!repo) return console.log("Necesito: listar ramas del repo <repo>");
    return send(4, "list_branches", owner ? { owner, repo } : { repo });
  }

  if (/crear? rama/.test(input)) {
    const ramaMatch = input.match(/rama ([a-zA-Z0-9_/-]+) desde ([a-zA-Z0-9_/-]+)/i);
    const repoMatch = input.match(/(?:en|del?) repo ([a-zA-Z0-9_-]+)/i);
    if (!ramaMatch || !repoMatch) return console.log("Necesito: crea rama <nueva> desde <base> en repo <repo>");
    return send(5, "create_branch", { ...(owner ? { owner } : {}), repo: repoMatch[1], branch: ramaMatch[1], from: ramaMatch[2] });
  }

  if (/eliminar? rama|borrar? rama/.test(input)) {
    const ramaMatch = input.match(/rama ([a-zA-Z0-9_/-]+)/i);
    const repoMatch = input.match(/(?:del?|en) repo ([a-zA-Z0-9_-]+)/i);
    if (!ramaMatch || !repoMatch) return console.log("Necesito: elimina rama <rama> del repo <repo>");
    return send(6, "delete_branch", { ...(owner ? { owner } : {}), repo: repoMatch[1], branch: ramaMatch[1] });
  }

  // PULL REQUESTS
  if (/listar? prs?|ver prs?|pull requests?/.test(input)) {
    const repoMatch = input.match(/(?:del?|en) repo ([a-zA-Z0-9_-]+)/i);
    const repo = repoMatch?.[1];
    if (!repo) return console.log("Necesito: listar prs del repo <repo>");
    return send(7, "list_prs", owner ? { owner, repo } : { repo });
  }

  if (/crear? pr|crear? pull/.test(input)) {
    const repoMatch = input.match(/(?:en|del?) repo ([a-zA-Z0-9_-]+)/i);
    const tituloMatch = input.match(/titulado "([^"]+)"/i);
    const headMatch = input.match(/desde ([a-zA-Z0-9_/-]+) hacia/i);
    const baseMatch = input.match(/hacia ([a-zA-Z0-9_/-]+)/i);
    if (!repoMatch || !tituloMatch || !headMatch || !baseMatch)
      return console.log(`Necesito: crea pr en repo <repo> titulado "<titulo>" desde <head> hacia <base>`);
    return send(8, "create_pr", { ...(owner ? { owner } : {}), repo: repoMatch[1], title: tituloMatch[1], head: headMatch[1], base: baseMatch[1] });
  }

  if (/mergear? pr|merge pr/.test(input)) {
    const repoMatch = input.match(/(?:del?|en) repo ([a-zA-Z0-9_-]+)/i);
    const numMatch = input.match(/#?(\d+)/);
    if (!repoMatch || !numMatch) return console.log("Necesito: mergea pr #<numero> del repo <repo>");
    return send(9, "merge_pr", { ...(owner ? { owner } : {}), repo: repoMatch[1], pull_number: parseInt(numMatch[1]) });
  }

  if (/cerrar? pr|close pr/.test(input)) {
    const repoMatch = input.match(/(?:del?|en) repo ([a-zA-Z0-9_-]+)/i);
    const numMatch = input.match(/#?(\d+)/);
    if (!repoMatch || !numMatch) return console.log("Necesito: cierra pr #<numero> del repo <repo>");
    return send(10, "close_pr", { ...(owner ? { owner } : {}), repo: repoMatch[1], pull_number: parseInt(numMatch[1]) });
  }

  // ARCHIVOS
  if (/listar? archivos?|ver archivos?/.test(input)) {
    const repoMatch = input.match(/(?:del?|en) repo ([a-zA-Z0-9_-]+)/i);
    const repo = repoMatch?.[1];
    if (!repo) return console.log("Necesito: listar archivos del repo <repo>");
    return send(11, "list_files", owner ? { owner, repo } : { repo });
  }

  if (/leer? archivo|ver archivo/.test(input)) {
    const repoMatch = input.match(/(?:del?|en) repo ([a-zA-Z0-9_-]+)/i);
    const pathMatch = input.match(/archivo ([a-zA-Z0-9_./:-]+)/i);
    if (!repoMatch || !pathMatch) return console.log("Necesito: lee archivo <path> del repo <repo>");
    return send(12, "read_file", { ...(owner ? { owner } : {}), repo: repoMatch[1], path: pathMatch[1] });
  }

  if (/crear? archivo/.test(input)) {
    const repoMatch = input.match(/(?:en|del?) repo ([a-zA-Z0-9_-]+)/i);
    const pathMatch = input.match(/archivo ([a-zA-Z0-9_./:-]+)/i);
    const contenidoMatch = input.match(/contenido "([^"]+)"/i);
    const mensajeMatch = input.match(/mensaje "([^"]+)"/i);
    if (!repoMatch || !pathMatch || !contenidoMatch || !mensajeMatch)
      return console.log(`Necesito: crea archivo <path> en repo <repo> contenido "<texto>" mensaje "<commit>"`);
    return send(13, "create_file", { ...(owner ? { owner } : {}), repo: repoMatch[1], path: pathMatch[1], content: contenidoMatch[1], message: mensajeMatch[1] });
  }

  if (/eliminar? archivo|borrar? archivo/.test(input)) {
    const repoMatch = input.match(/(?:del?|en) repo ([a-zA-Z0-9_-]+)/i);
    const pathMatch = input.match(/archivo ([a-zA-Z0-9_./:-]+)/i);
    const mensajeMatch = input.match(/mensaje "([^"]+)"/i);
    if (!repoMatch || !pathMatch || !mensajeMatch)
      return console.log(`Necesito: elimina archivo <path> del repo <repo> mensaje "<commit>"`);
    return send(14, "delete_file", { ...(owner ? { owner } : {}), repo: repoMatch[1], path: pathMatch[1], message: mensajeMatch[1] });
  }

  console.log("No entendí el comando");
  proc.kill();
}

run();

function formatOutput(text) {
  if (text.startsWith("Repos:")) {
    const items = text.replace("Repos:\n", "").split("\n");
    console.log("\nRepositorios:\n");
    items.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
    console.log("");
    return;
  }
  if (text.startsWith("Ramas:")) {
    const items = text.replace("Ramas:\n", "").split("\n");
    console.log("\nRamas:\n");
    items.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
    console.log("");
    return;
  }
  if (text.startsWith("PRs:")) {
    const items = text.replace("PRs:\n", "").split("\n");
    console.log("\nPull Requests:\n");
    items.forEach((pr, i) => console.log(`  ${i + 1}. ${pr}`));
    console.log("");
    return;
  }
  if (text.startsWith("Archivos")) {
    const lines = text.split("\n");
    console.log(`\n${lines[0]}\n`);
    lines.slice(1).forEach((f) => console.log(`  ${f}`));
    console.log("");
    return;
  }
  console.log("\n" + text + "\n");
}