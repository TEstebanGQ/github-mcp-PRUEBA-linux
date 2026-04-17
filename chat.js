#!/usr/bin/env node
import Groq from "groq-sdk";
import { createGitHubClient } from "./src/github/client.js";
import { repoHandlers } from "./src/tools/repos.js";
import { branchHandlers } from "./src/tools/branches.js";
import { prHandlers } from "./src/tools/prs.js";
import { fileHandlers } from "./src/tools/files.js";
import readline from "readline";
import dotenv from "dotenv";
dotenv.config();

// Clientes 
const octokit = createGitHubClient(process.env.GITHUB_TOKEN);
const { data: authUser } = await octokit.users.getAuthenticated();
const defaultOwner = authUser.login;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Handlers unificados 
const ALL_HANDLERS = {
  ...repoHandlers,
  ...branchHandlers,
  ...prHandlers,
  ...fileHandlers,
};

const tools = [
  // REPOS
  {
    type: "function",
    function: {
      name: "create_repo",
      description: "Crear un repositorio en GitHub",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nombre del repositorio" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_repos",
      description: "Listar repositorios del usuario autenticado o de otro usuario",
      parameters: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Nombre de usuario sin @ (opcional)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_repo",
      description: "Eliminar un repositorio de GitHub",
      parameters: {
        type: "object",
        properties: {
          repo:  { type: "string", description: "Nombre del repositorio" },
          owner: { type: "string", description: "Nombre de usuario sin @ (opcional)" },
        },
        required: ["repo"],
      },
    },
  },
  // RAMAS
  {
    type: "function",
    function: {
      name: "create_branch",
      description: "Crear una rama en un repositorio",
      parameters: {
        type: "object",
        properties: {
          repo:   { type: "string", description: "Nombre del repo" },
          branch: { type: "string", description: "Nombre de la nueva rama" },
          from:   { type: "string", description: "Rama base desde donde crear" },
          owner:  { type: "string", description: "Nombre de usuario sin @ (opcional)" },
        },
        required: ["repo", "branch", "from"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_branches",
      description: "Listar ramas de un repositorio",
      parameters: {
        type: "object",
        properties: {
          repo:  { type: "string", description: "Nombre del repo" },
          owner: { type: "string", description: "Nombre de usuario sin @ (opcional)" },
        },
        required: ["repo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_branch",
      description: "Eliminar una rama de un repositorio",
      parameters: {
        type: "object",
        properties: {
          repo:   { type: "string", description: "Nombre del repo" },
          branch: { type: "string", description: "Nombre de la rama a eliminar" },
          owner:  { type: "string", description: "Nombre de usuario sin @ (opcional)" },
        },
        required: ["repo", "branch"],
      },
    },
  },
  // PULL REQUESTS
  {
    type: "function",
    function: {
      name: "list_prs",
      description: "Listar pull requests de un repositorio",
      parameters: {
        type: "object",
        properties: {
          repo:  { type: "string", description: "Nombre del repo" },
          owner: { type: "string", description: "Nombre de usuario sin @ (opcional)" },
        },
        required: ["repo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_pr",
      description: "Crear un pull request",
      parameters: {
        type: "object",
        properties: {
          repo:  { type: "string", description: "Nombre del repo" },
          title: { type: "string", description: "Título del PR" },
          head:  { type: "string", description: "Rama origen" },
          base:  { type: "string", description: "Rama destino" },
          owner: { type: "string", description: "Nombre de usuario sin @ (opcional)" },
        },
        required: ["repo", "title", "head", "base"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "merge_pr",
      description: "Hacer merge de un pull request",
      parameters: {
        type: "object",
        properties: {
          repo:        { type: "string", description: "Nombre del repo" },
          pull_number: { type: "number", description: "Número del PR" },
          owner:       { type: "string", description: "Nombre de usuario sin @ (opcional)" },
        },
        required: ["repo", "pull_number"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "close_pr",
      description: "Cerrar un pull request sin merge",
      parameters: {
        type: "object",
        properties: {
          repo:        { type: "string", description: "Nombre del repo" },
          pull_number: { type: "number", description: "Número del PR" },
          owner:       { type: "string", description: "Nombre de usuario sin @ (opcional)" },
        },
        required: ["repo", "pull_number"],
      },
    },
  },
  // ARCHIVOS
  {
    type: "function",
    function: {
      name: "list_files",
      description: "Listar archivos de un repositorio",
      parameters: {
        type: "object",
        properties: {
          repo:  { type: "string", description: "Nombre del repo" },
          path:  { type: "string", description: "Ruta dentro del repo (opcional)" },
          owner: { type: "string", description: "Nombre de usuario sin @ (opcional)" },
        },
        required: ["repo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Leer el contenido de un archivo en un repositorio",
      parameters: {
        type: "object",
        properties: {
          repo:  { type: "string", description: "Nombre del repo" },
          path:  { type: "string", description: "Ruta del archivo" },
          owner: { type: "string", description: "Nombre de usuario sin @ (opcional)" },
        },
        required: ["repo", "path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_file",
      description: "Crear o subir un archivo en un repositorio",
      parameters: {
        type: "object",
        properties: {
          repo:    { type: "string", description: "Nombre del repo" },
          path:    { type: "string", description: "Ruta del archivo a crear" },
          content: { type: "string", description: "Contenido del archivo" },
          message: { type: "string", description: "Mensaje del commit" },
          owner:   { type: "string", description: "Nombre de usuario sin @ (opcional)" },
        },
        required: ["repo", "path", "content", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_file",
      description: "Eliminar un archivo de un repositorio",
      parameters: {
        type: "object",
        properties: {
          repo:    { type: "string", description: "Nombre del repo" },
          path:    { type: "string", description: "Ruta del archivo a eliminar" },
          message: { type: "string", description: "Mensaje del commit" },
          owner:   { type: "string", description: "Nombre de usuario sin @ (opcional)" },
        },
        required: ["repo", "path", "message"],
      },
    },
  },
];

// Ejecutar tool real de GitHub
async function executeTool(name, args) {
  const handler = ALL_HANDLERS[name];
  if (!handler) return `Tool desconocida: ${name}`;

  if (args.owner) args.owner = args.owner.replace("@", "");

  const result = await handler({ octokit, args, defaultOwner });
  return result.content?.[0]?.text ?? "Sin respuesta";
}

// Historial de conversación 
const history = [
  {
    role: "system",
    content: `Eres un asistente de GitHub en terminal conectado como ${defaultOwner}.
Ayudas a gestionar repositorios, ramas, pull requests y archivos usando las tools disponibles.
Responde siempre en español, de forma breve y clara.
Si una acción fue exitosa confírmala. Si hubo error explícalo de forma simple.
Recuerda el contexto de la conversación para no pedir datos que ya se mencionaron.

REGLAS CRÍTICAS para llamar tools:
- El parámetro "owner" es el nombre de usuario de GitHub: "${defaultOwner}". Úsalo por defecto si no se indica otro.
- El parámetro "repo" es el nombre del repositorio (ejemplo: "rita", "mi-proyecto"). NUNCA pongas el nombre de usuario en "repo".
- El parámetro "owner" NUNCA debe incluir el símbolo @.
- Cuando el usuario diga "entra al repo X" o "en el repo X", el repo es X y el owner es "${defaultOwner}".
- Si el resultado de una tool indica error, no intentes llamarla de nuevo con parámetros inventados. Informa al usuario.

SOBRE COMMITS Y PUSH:
- En la API de GitHub NO existe un comando "push" separado. Cada vez que creas o actualizas un archivo con create_file, eso YA es un commit que queda guardado en el repositorio.
- Cuando el usuario diga "haz un commit", "sube los cambios", "haz push", o "guarda los cambios", debes usar create_file con el contenido actualizado y un mensaje de commit descriptivo.
- El parámetro "message" de create_file ES el mensaje del commit.
- No le digas al usuario que no puedes hacer commits o push — sí puedes, usando create_file.`,
  },
];

// Chat loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(`\n GitHub AI Chat — conectado como @${defaultOwner}`);
console.log('Escribe lo que necesites. Escribe "salir" para terminar.');
console.log('Tip: usa """ al inicio y """ al final para pegar texto multilínea.\n');

function readMultiline(firstLine) {
  return new Promise((resolve) => {
    const lines = [firstLine.replace(/^"""/, "").trimEnd()];
    const sub = readline.createInterface({ input: process.stdin, output: process.stdout });
    sub.on("line", (line) => {
      if (line.trimEnd() === '"""') {
        sub.close();
        resolve(lines.join("\n").trim());
      } else {
        lines.push(line);
      }
    });
  });
}

function prompt() {
  rl.question("tú > ", async (rawInput) => {
    let text = rawInput.trim();
    if (!text) return prompt();
    if (text.toLowerCase() === "salir") {
      console.log("¡Hasta luego!");
      rl.close();
      process.exit(0);
    }

    if (text.startsWith('"""')) {
      rl.pause();
      text = await readMultiline(text);
      rl.resume();
    }

    history.push({ role: "user", content: text });
    async function callGroq(messages) {
      return groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages,
        tools,
        tool_choice: "auto",
        max_tokens: 1024,
      });
    }

    try {
      let retried = false;
      while (true) {
        const trimmed = [history[0], ...history.slice(Math.max(1, history.length - 6))];
        let response;
        try {
          response = await callGroq(trimmed);
        } catch (innerErr) {
          if (!retried && (innerErr.message.includes("failed_generation") || innerErr.message.includes("tool_use_failed"))) {
            retried = true;
            response = await callGroq([history[0], history[history.length - 1]]);
          } else {
            throw innerErr;
          }
        }

        const message = response.choices[0].message;
        history.push(message);

        // Sin tool calls → respuesta final
        if (!message.tool_calls || message.tool_calls.length === 0) {
          console.log(`\nGroq > ${message.content}\n`);
          break;
        }

        // Ejecutar tools
        for (const call of message.tool_calls) {
          const args = JSON.parse(call.function.arguments);
          process.stdout.write(`  ⚙  ${call.function.name}(${JSON.stringify(args)}) → `);
          const output = await executeTool(call.function.name, args);
          console.log("listo");
          console.log(`\n${output}\n`);

          // Guardar en historial una versión corta para ahorrar tokens
          const MAX_HISTORY_CHARS = 400;
          const historyContent = output.length > MAX_HISTORY_CHARS
            ? output.slice(0, MAX_HISTORY_CHARS) + "\n...(resultado truncado)"
            : output;

          history.push({
            role: "tool",
            tool_call_id: call.id,
            content: historyContent,
          });
        }
        // Volver a llamar con los resultados
      }
    } catch (err) {
      if (err.message.includes("failed_generation") || err.message.includes("tool_use_failed")) {
        console.error(`\n El modelo generó una llamada inválida incluso tras reintentar. Escribe tu solicitud de otra forma.\n`);
      } else if (err.message.includes("rate_limit_exceeded")) {
        const match = err.message.match(/try again in (\d+)m([\d.]+)s/);
        const espera = match ? `${match[1]}m ${Math.ceil(parseFloat(match[2]))}s` : "unos minutos";
        console.error(`\n Límite de tokens alcanzado. Espera ${espera} e intenta de nuevo.\n`);
      } else {
        console.error(`\n Error: ${err.message}\n`);
      }
    }

    prompt();
  });
}

prompt();