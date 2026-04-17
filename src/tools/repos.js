import { success, error } from "../utils/response.js";

export const repoTools = [
  {
    name: "create_repo",
    description: "Crear repositorio en GitHub",
    inputSchema: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
      },
    },
  },
  {
    name: "list_repos",
    description: "Listar repositorios",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string" },
      },
    },
  },
  {
    name: "delete_repo",
    description: "Eliminar repositorio",
    inputSchema: {
      type: "object",
      required: ["repo"],
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
      },
    },
  },
];

export const repoHandlers = {
  create_repo: async ({ octokit, args }) => {
    try {
      const res = await octokit.repos.createForAuthenticatedUser({ name: args.name });
      return success(`Repo creado: ${res.data.full_name}`);
    } catch (e) {
      try {
        const body = JSON.parse(e.message.match(/\{.*\}/s)?.[0] ?? "{}");
        const detalle = body.errors?.[0]?.message ?? body.message ?? e.message;
        return error(detalle);
      } catch {
        return error(e.message);
      }
    }
  },

  list_repos: async ({ octokit, args, defaultOwner }) => {
    try {
      const owner = args?.owner ?? defaultOwner;
      const repos = await octokit.paginate(octokit.repos.listForUser, {
        username: owner,
        per_page: 100,
      });
      const nombres = repos.map((r) => r.full_name).join("\n");
      return success(`Repos:\n${nombres}`);
    } catch (e) {
      return error(e.message);
    }
  },

  delete_repo: async ({ octokit, args, defaultOwner }) => {
    try {
      const owner = args.owner ?? defaultOwner;
      const { repo } = args;
      await octokit.repos.delete({ owner, repo });
      return success(`Repo ${repo} eliminado`);
    } catch (e) {
      return error(e.message);
    }
  },
};