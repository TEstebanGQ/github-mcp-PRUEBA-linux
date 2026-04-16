import { Octokit } from "@octokit/rest";

export const createGitHubClient = (token) => {
  if (!token) {
    throw new Error("Falta GITHUB_TOKEN en .env");
  }

  return new Octokit({
    auth: token,
  });
};