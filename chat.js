#!/usr/bin/env node
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createGitHubClient } from "./src/github/client.js";
import { repoHandlers } from "./src/tools/repos.js";
import { branchHandlers } from "./src/tools/branches.js";
import { prHandlers } from "./src/tools/prs.js";
import { fileHandlers } from "./src/tools/files.js";
import readline from "readline";
import dotenv from "dotenv";
dotenv.config();

// ── Clientes ──────────────────────────────────────────────────────────────────
const octokit = createGitHubClient(process.env.GITHUB_TOKEN);
const { data: authUser } = await octokit.users.getAuthenticated();
const defaultOwner = authUser.login;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Handlers unificados ───────────────────────────────────────────────────────
const ALL_HANDLERS = {
  ...repoHandlers,
  ...branchHandlers,
  ...prHandlers,
  ...fileHandlers,
};

// ── Definición de tools para Gemini ──────────────────────────────────────────
const tools = [
  {
    functionDeclarations: [
      // REPOS
      {
        name: "create_repo",
        description: "Crear un repositorio en GitHub",
        parameters: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "Nombre del repositorio" },
          },
          required: ["name"],
        },
      },
      {
        name: "list_repos",
        description: "Listar repositorios del usuario autenticado o de otro usuario",
        parameters: {
          type: "OBJECT",
          properties: {
            owner: { type: "STRING", description: "Usuario dueño (opcional)" },
          },
        },
      },
      {
        name: "delete_repo",
        description: "Eliminar un repositorio",
        parameters: {
          type: "OBJECT",
          properties: {
            repo: { type: "STRING", description: "Nombre del repositorio" },
            owner: { type: "STRING", description: "Usuario dueño (opcional)" },
          },
          required: ["repo"],
        },
      },
      // RAMAS
      {
        name: "create_branch",
        description: "Crear una rama en un repositorio",
        parameters: {
          type: "OBJECT",
          properties: {
            repo:   { type: "STRING", description: "Nombre del repo" },
            branch: { type: "STRING", description: "Nombre de la nueva rama" },
            from:   { type: "STRING", description: "Rama base desde donde crear" },
            owner:  { type: "STRING", description: "Usuario dueño (opcional)" },
          },
          required: ["repo", "branch", "from"],
        },
      },
      {
        name: "list_branches",
        description: "Listar ramas de un repositorio",
        parameters: {
          type: "OBJECT",
          properties: {
            repo:  { type: "STRING", description: "Nombre del repo" },
            owner: { type: "STRING", description: "Usuario dueño (opcional)" },
          },
          required: ["repo"],
        },
      },
      {
        name: "delete_branch",
        description: "Eliminar una rama de un repositorio",
        parameters: {
          type: "OBJECT",
          properties: {
            repo:   { type: "STRING", description: "Nombre del repo" },
            branch: { type: "STRING", description: "Nombre de la rama a eliminar" },
            owner:  { type: "STRING", description: "Usuario dueño (opcional)" },
          },
          required: ["repo", "branch"],
        },
      },
      // PULL REQUESTS
      {
        name: "list_prs",
        description: "Listar pull requests de un repositorio",
        parameters: {
          type: "OBJECT",
          properties: {
            repo:  { type: "STRING", description: "Nombre del repo" },
            owner: { type: "STRING", description: "Usuario dueño (opcional)" },
          },
          required: ["repo"],
        },
      },
      {
        name: "create_pr",
        description: "Crear un pull request",
        parameters: {
          type: "OBJECT",
          properties: {
            repo:  { type: "STRING", description: "Nombre del repo" },
            title: { type: "STRING", description: "Título del PR" },
            head:  { type: "STRING", description: "Rama origen" },
            base:  { type: "STRING", description: "Rama destino" },
            owner: { type: "STRING", description: "Usuario dueño (opcional)" },
          },
          required: ["repo", "title", "head", "base"],
        },
      },
      {
        name: "merge_pr",
        description: "Hacer merge de un pull request",
        parameters: {
          type: "OBJECT",
          properties: {
            repo:        { type: "STRING",  description: "Nombre del repo" },
            pull_number: { type: "NUMBER",  description: "Número del PR" },
            owner:       { type: "STRING",  description: "Usuario dueño (opcional)" },
          },
          required: ["repo", "pull_number"],
        },
      },
      {
        name: "close_pr",
        description: "Cerrar un pull request sin merge",
        parameters: {
          type: "OBJECT",
          properties: {
            repo:        { type: "STRING",  description: "Nombre del repo" },
            pull_number: { type: "NUMBER",  description: "Número del PR" },
            owner:       { type: "STRING",  description: "Usuario dueño (opcional)" },
          },
          required: ["repo", "pull_number"],
        },
      },
      // ARCHIVOS
      {
        name: "list_files",
        description: "Listar archivos de un repositorio",
        parameters: {
          type: "OBJECT",
          properties: {
            repo:  { type: "STRING", description: "Nombre del repo" },
            path:  { type: "STRING", description: "Ruta dentro del repo (opcional, default raíz)" },
            owner: { type: "STRING", description: "Usuario dueño (opcional)" },
          },
          required: ["repo"],
        },
      },
      {
        name: "read_file",
        description: "Leer el contenido de un archivo en un repositorio",
        parameters: {
          type: "OBJECT",
          properties: {
            repo:  { type: "STRING", description: "Nombre del repo" },
            path:  { type: "STRING", description: "Ruta del archivo" },
            owner: { type: "STRING", description: "Usuario dueño (opcional)" },
          },
          required: ["repo", "path"],
        },
      },
      {
        name: "create_file",
        description: "Crear o subir un archivo en un repositorio",
        parameters: {
          type: "OBJECT",
          properties: {
            repo:    { type: "STRING", description: "Nombre del repo" },
            path:    { type: "STRING", description: "Ruta del archivo a crear" },
            content: { type: "STRING", description: "Contenido del archivo" },
            message: { type: "STRING", description: "Mensaje del commit" },
            owner:   { type: "STRING", description: "Usuario dueño (opcional)" },
          },
          required: ["repo", "path", "content", "message"],
        },
      },
      {
        name: "delete_file",
        description: "Eliminar un archivo de un repositorio",
        parameters: {
          type: "OBJECT",
          properties: {
            repo:    { type: "STRING", description: "Nombre del repo" },
            path:    { type: "STRING", description: "Ruta del archivo a eliminar" },
            message: { type: "STRING", description: "Mensaje del commit" },
            owner:   { type: "STRING", description: "Usuario dueño (opcional)" },
          },
          required: ["repo", "path", "message"],
        },
      },
    ],
  },
];

// ── Ejecutar tool real de GitHub ──────────────────────────────────────────────
async function executeTool(name, args) {
  const handler = ALL_HANDLERS[name];
  if (!handler) return `Tool desconocida: ${name}`;
  const result = await handler({ octokit, args, defaultOwner });
  return result.content?.[0]?.text ?? "Sin respuesta";
}

// ── Chat loop ─────────────────────────────────────────────────────────────────
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    tools,
  systemInstruction: `Eres un asistente de GitHub en terminal. 
Ayudas al usuario a gestionar repositorios, ramas, pull requests y archivos.
Cuando el usuario pida algo, usa las tools disponibles para ejecutarlo en GitHub real.
Responde siempre en español, de forma breve y clara.
Si una acción fue exitosa, confírmala. Si hubo error, explícalo.`,
});

const chat = model.startChat({ history: [] });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(`\n🐙 GitHub AI Chat — conectado como @${defaultOwner}`);
console.log('Escribe lo que necesites. Escribe "salir" para terminar.\n');

function prompt() {
  rl.question("tú > ", async (input) => {
    const text = input.trim();
    if (!text) return prompt();
    if (text.toLowerCase() === "salir") {
      console.log("¡Hasta luego!");
      rl.close();
      process.exit(0);
    }

    try {
      // Primera llamada: Gemini decide si usar tool o responder directo
      let result = await chat.sendMessage(text);
      let response = result.response;

      // Loop por si Gemini encadena varias tools
      while (true) {
        const calls = response.functionCalls();
        if (!calls || calls.length === 0) break;

        // Ejecutar todas las tools que pidió
        const toolResults = [];
        for (const call of calls) {
          process.stdout.write(`  ⚙  ${call.name}(${JSON.stringify(call.args)}) → `);
          const output = await executeTool(call.name, call.args);
          console.log("listo");
          toolResults.push({
            functionResponse: { name: call.name, response: { result: output } },
          });
        }

        // Devolver resultados a Gemini para que genere respuesta final
        result = await chat.sendMessage(toolResults);
        response = result.response;
      }

      const finalText = response.text();
      console.log(`\nGemini > ${finalText}\n`);
    } catch (err) {
      console.error(`\n❌ Error: ${err.message}\n`);
    }

    prompt();
  });
}

prompt();