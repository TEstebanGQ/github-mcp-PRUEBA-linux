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
        from: { type: "string" }
      },
    },
  },
];

export const branchHandlers = {
  create_branch: async ({ octokit, args }) => {
    try {
      const { owner, repo, branch, from } = args;

      const refData = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${from}`,
      });

      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha: refData.data.object.sha,
      });

      return success(`Branch ${branch} creada`);
    } catch (e) {
      return error(e.message);
    }
  },
};