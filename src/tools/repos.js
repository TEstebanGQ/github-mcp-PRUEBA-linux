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
      required: ["owner", "repo"],
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
      return error(e.message);
    }
  },

  list_repos: async ({ octokit, args }) => {
    try {
      const res = args?.owner
        ? await octokit.repos.listForUser({ username: args.owner })
        : await octokit.repos.listForAuthenticatedUser();
      const repos = res.data.map((r) => r.full_name).join("\n");
      return success(`Repos:\n${repos}`);
    } catch (e) {
      return error(e.message);
    }
  },

  delete_repo: async ({ octokit, args }) => {
    try {
      await octokit.repos.delete({ owner: args.owner, repo: args.repo });
      return success(`Repo ${args.repo} eliminado`);
    } catch (e) {
      return error(e.message);
    }
  },
};