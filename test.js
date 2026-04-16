import { spawn } from "child_process";

const proc = spawn("node", ["src/server.js"]);

proc.stdout.on("data", (data) => {
  console.log("RESPUESTA:", data.toString());
});

proc.stderr.on("data", (data) => {
  console.error(" ERROR:", data.toString());
});

// LLAMAR TOOL REAL
proc.stdin.write(
    JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "list_repos",
        arguments: {}
      }
    }) + "\n"
  );