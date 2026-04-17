import dotenv from "dotenv";
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createGitHubClient } from "./github/client.js";

import { repoTools, repoHandlers } from "./tools/repos.js";
import { branchTools, branchHandlers } from "./tools/branches.js";
import { prTools, prHandlers } from "./tools/prs.js";
import {
    ListToolsRequestSchema,
    CallToolRequestSchema,
  } from "@modelcontextprotocol/sdk/types.js";
import { fileTools, fileHandlers } from "./tools/files.js";

const octokit = createGitHubClient(process.env.GITHUB_TOKEN);

const { data: authUser } = await octokit.users.getAuthenticated();
const DEFAULT_OWNER = authUser.login;

const server = new Server(
  {
    name: "github-mcp-pro",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const ALL_TOOLS = [...repoTools, ...branchTools, ...prTools, ...fileTools];
const ALL_HANDLERS = { ...repoHandlers, ...branchHandlers, ...prHandlers, ...fileHandlers };

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: ALL_TOOLS };
  });

server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const handler = ALL_HANDLERS[name];
  
    if (!handler) {
      return {
        content: [{ type: "text", text: `Tool no encontrada: ${name}` }],
      };
    }
  
    return handler({ octokit, args, defaultOwner: DEFAULT_OWNER });
  });

await server.connect(new StdioServerTransport());