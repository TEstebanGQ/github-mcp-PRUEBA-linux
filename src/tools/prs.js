import { success, error } from "../utils/response.js";

export const prTools = [
  {
    name: "list_prs",
    description: "Listar pull requests",
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

export const prHandlers = {
  list_prs: async ({ octokit, args }) => {
    try {
      const { owner, repo } = args;

      const res = await octokit.pulls.list({
        owner,
        repo,
      });

      const prs = res.data.map((pr) => pr.title).join("\n");

      return success(`PRs:\n${prs}`);
    } catch (e) {
      return error(e.message);
    }
  },
};