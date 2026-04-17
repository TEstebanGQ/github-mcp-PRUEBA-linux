import { success, error } from "../utils/response.js";

export const prTools = [
  {
    name: "list_prs",
    description: "Listar pull requests",
    inputSchema: {
      type: "object",
      required: ["repo"],
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
      },
    },
  },
  {
    name: "create_pr",
    description: "Crear pull request",
    inputSchema: {
      type: "object",
      required: ["repo", "title", "head", "base"],
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        title: { type: "string" },
        head: { type: "string" },
        base: { type: "string" },
      },
    },
  },
  {
    name: "merge_pr",
    description: "Hacer merge de un PR",
    inputSchema: {
      type: "object",
      required: ["repo", "pull_number"],
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        pull_number: { type: "number" },
      },
    },
  },
  {
    name: "close_pr",
    description: "Cerrar pull request",
    inputSchema: {
      type: "object",
      required: ["repo", "pull_number"],
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        pull_number: { type: "number" },
      },
    },
  },
];

export const prHandlers = {
  list_prs: async ({ octokit, args, defaultOwner }) => {
    try {
      const owner = args.owner ?? defaultOwner;
      const res = await octokit.pulls.list({ owner, repo: args.repo });
      const prs = res.data.map((pr) => `#${pr.number} - ${pr.title}`).join("\n");
      return success(`PRs:\n${prs}`);
    } catch (e) {
      return error(e.message);
    }
  },

  create_pr: async ({ octokit, args, defaultOwner }) => {
    try {
      const owner = args.owner ?? defaultOwner;
      const { repo, title, head, base } = args;
      const res = await octokit.pulls.create({ owner, repo, title, head, base });
      return success(`PR creado: #${res.data.number} - ${res.data.title}\n${res.data.html_url}`);
    } catch (e) {
      return error(e.message);
    }
  },

  merge_pr: async ({ octokit, args, defaultOwner }) => {
    try {
      const owner = args.owner ?? defaultOwner;
      const { repo, pull_number } = args;
      await octokit.pulls.merge({ owner, repo, pull_number });
      return success(`PR #${pull_number} mergeado`);
    } catch (e) {
      return error(e.message);
    }
  },

  close_pr: async ({ octokit, args, defaultOwner }) => {
    try {
      const owner = args.owner ?? defaultOwner;
      const { repo, pull_number } = args;
      await octokit.pulls.update({ owner, repo, pull_number, state: "closed" });
      return success(`PR #${pull_number} cerrado`);
    } catch (e) {
      return error(e.message);
    }
  },
};