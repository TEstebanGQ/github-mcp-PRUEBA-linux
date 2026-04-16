import { spawn } from "child_process";

const args = process.argv.slice(2);
const command = args[0];
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

proc.stderr.on("data", (data) => console.error("Error:", data.toString()));

function sendRequest(id, name, args = {}) {
  proc.stdin.write(JSON.stringify({
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: { name, arguments: args }
  }) + "\n");
}

// LENGUAJE NATURAL

if (input.includes("repo")) {

  if (input.includes("crear") || input.includes("crea")) {
    const match = input.match(/repo (llamado )?(.+)/i);
    const name = match?.[2]?.trim().replaceAll(" ", "-");

    if (!name) {
      console.log("No pude detectar el nombre del repo");
      process.exit(1);
    }

    return sendRequest(1, "create_repo", { name });
  }

  if (input.includes("lista") || input.includes("ver")) {
    return sendRequest(2, "list_repos");
  }
}

// BRANCHES

if (input.includes("rama")) {
  const match = input.match(/rama (.+) desde (.+) en repo (.+)/i);

  if (!match) {
    console.log("Formato: crea rama <rama> desde <base> en repo <repo>");
    process.exit(1);
  }

  const branch = match[1].trim();
  const from = match[2].trim();
  const repo = match[3].trim();
  const owner = "TEstebanGQ"; 

  return sendRequest(3, "create_branch", { owner, repo, branch, from });
}


// PULL REQUESTS


if (input.includes("pr") || input.includes("pull")) {
  const match = input.match(/(prs|pulls?) de (.+)/i);

  if (!match) {
    console.log("Formato: muestra prs de <repo>");
    process.exit(1);
  }

  const repo = match[2].trim();
  const owner = "TEstebanGQ"; 

  return sendRequest(4, "list_prs", { owner, repo });
}


// COMANDOS CLÁSICOS

if (command === "list-repos") {
  sendRequest(10, "list_repos");
}

if (command === "create-repo") {
  const name = args[1];
  if (!name) {
    console.log("Uso: mi-mcp create-repo <nombre>");
    process.exit(1);
  }
  sendRequest(11, "create_repo", { name });
}

if (command === "create-branch") {
  const [owner, repo, branch, from] = args.slice(1);
  if (!owner || !repo || !branch || !from) {
    console.log("Uso: mi-mcp create-branch <owner> <repo> <branch> <from>");
    process.exit(1);
  }
  sendRequest(12, "create_branch", { owner, repo, branch, from });
}

if (command === "list-prs") {
  const [owner, repo] = args.slice(1);
  if (!owner || !repo) {
    console.log("Uso: mi-mcp list-prs <owner> <repo>");
    process.exit(1);
  }
  sendRequest(13, "list_prs", { owner, repo });
}

// FALLBACK

if (!command) {
  console.log("Escribe un comando");
  process.exit(0);
}

console.log("No entendí el comando");

// FORMATO

function formatOutput(text) {
  if (text.startsWith("Repos:")) {
    const repos = text.replace("Repos:\n", "").split("\n");
    console.log("\nRepositorios:\n");
    repos.forEach((r, i) => console.log(`${i + 1}. ${r}`));
    console.log("");
    return;
  }

  if (text.startsWith("PRs:")) {
    const prs = text.replace("PRs:\n", "").split("\n");
    console.log("\nPull Requests:\n");
    prs.forEach((pr, i) => console.log(`${i + 1}. ${pr}`));
    console.log("");
    return;
  }

  console.log("\n" + text + "\n");
}