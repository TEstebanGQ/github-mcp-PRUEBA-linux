import { success, error } from "../utils/response.js";

export const branchTools = [
  {
    name: "create_branch",
    description: "Crear rama",
    inputSchema: {
      type: "object",
      required: ["owner", "repo", "branch", "from"],
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        branch: { type: "string" },
        from: { type: "string" },
      },
    },
  },
  {
    name: "list_branches",
    description: "Listar ramas",
    inputSchema: {
      type: "object",
      required: ["owner", "repo"],
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
      },
    },
  },
  {
    name: "delete_branch",
    description: "Eliminar rama",
    inputSchema: {
      type: "object",
      required: ["owner", "repo", "branch"],
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        branch: { type: "string" },
      },
    },
  },
];

export const branchHandlers = {
  create_branch: async ({ octokit, args }) => {
    try {
      const { owner, repo, branch, from } = args;
      const refData = await octokit.git.getRef({ owner, repo, ref: `heads/${from}` });
      await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: refData.data.object.sha });
      return success(`Rama ${branch} creada desde ${from}`);
    } catch (e) {
      return error(e.message);
    }
  },

  list_branches: async ({ octokit, args }) => {
    try {
      const { owner, repo } = args;
      const res = await octokit.repos.listBranches({ owner, repo });
      const branches = res.data.map((b) => b.name).join("\n");
      return success(`Ramas:\n${branches}`);
    } catch (e) {
      return error(e.message);
    }
  },

  delete_branch: async ({ octokit, args }) => {
    try {
      const { owner, repo, branch } = args;
      await octokit.git.deleteRef({ owner, repo, ref: `heads/${branch}` });
      return success(`Rama ${branch} eliminada`);
    } catch (e) {
      return error(e.message);
    }
  },
};