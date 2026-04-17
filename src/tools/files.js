import { success, error } from "../utils/response.js";

export const fileTools = [
  {
    name: "list_files",
    description: "Listar archivos de un repo",
    inputSchema: {
      type: "object",
      required: ["repo"],
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        path: { type: "string" },
      },
    },
  },
  {
    name: "read_file",
    description: "Leer contenido de un archivo",
    inputSchema: {
      type: "object",
      required: ["repo", "path"],
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        path: { type: "string" },
      },
    },
  },
  {
    name: "create_file",
    description: "Crear archivo en un repo",
    inputSchema: {
      type: "object",
      required: ["repo", "path", "content", "message"],
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        path: { type: "string" },
        content: { type: "string" },
        message: { type: "string" },
      },
    },
  },
  {
    name: "delete_file",
    description: "Eliminar archivo de un repo",
    inputSchema: {
      type: "object",
      required: ["repo", "path", "message"],
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        path: { type: "string" },
        message: { type: "string" },
      },
    },
  },
];

export const fileHandlers = {
  list_files: async ({ octokit, args, defaultOwner }) => {
    try {
      const owner = args.owner ?? defaultOwner;
      const { repo, path = "" } = args;
      const res = await octokit.repos.getContent({ owner, repo, path });
      const files = res.data.map((f) => `${f.type === "dir" ? "📁" : "📄"} ${f.name}`).join("\n");
      return success(`Archivos en /${path}:\n${files}`);
    } catch (e) {
      return error(e.message);
    }
  },

  read_file: async ({ octokit, args, defaultOwner }) => {
    try {
      const owner = args.owner ?? defaultOwner;
      const { repo, path } = args;
      const res = await octokit.repos.getContent({ owner, repo, path });
      const content = Buffer.from(res.data.content, "base64").toString("utf-8");
      return success(`Contenido de ${path}:\n\n${content}`);
    } catch (e) {
      return error(e.message);
    }
  },

  create_file: async ({ octokit, args, defaultOwner }) => {
    try {
      const owner = args.owner ?? defaultOwner;
      const { repo, path, content, message } = args;
      const encoded = Buffer.from(content).toString("base64");

      // Si el archivo ya existe, obtener su SHA para poder actualizarlo
      let sha;
      try {
        const existing = await octokit.repos.getContent({ owner, repo, path });
        sha = existing.data.sha;
      } catch {
        // El archivo no existe, se creará nuevo
      }

      await octokit.repos.createOrUpdateFileContents({ owner, repo, path, message, content: encoded, ...(sha && { sha }) });
      return success(sha ? `Archivo ${path} actualizado` : `Archivo ${path} creado`);
    } catch (e) {
      return error(e.message);
    }
  },

  delete_file: async ({ octokit, args, defaultOwner }) => {
    try {
      const owner = args.owner ?? defaultOwner;
      const { repo, path, message } = args;
      const fileRes = await octokit.repos.getContent({ owner, repo, path });
      await octokit.repos.deleteFile({ owner, repo, path, message, sha: fileRes.data.sha });
      return success(`Archivo ${path} eliminado`);
    } catch (e) {
      return error(e.message);
    }
  },
};