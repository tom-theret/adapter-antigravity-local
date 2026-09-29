import { type ServerAdapterModule } from "@paperclipai/adapter-utils";
import { execute, testEnvironment } from "./server/index.js";
import {
  fetchAvailableModels,
  DEFAULT_ANTIGRAVITY_MODELS,
} from "./server/models.js";
import type { AntigravityModelDefinition, AntigravityModelProfileDefinition } from "./types.js";

export const type = "antigravity_local";
export const label = "Antigravity CLI (local)";

// O Antigravity usa scripts diretos de instalação (Go bin) em vez de NPM
export const SANDBOX_INSTALL_COMMAND = "curl -sSL https://antigravity.google/install.sh | bash";

export const DEFAULT_ANTIGRAVITY_LOCAL_MODEL = "auto";

export const models: AntigravityModelDefinition[] = [...DEFAULT_ANTIGRAVITY_MODELS];

export const modelProfiles: AntigravityModelProfileDefinition[] = [
  {
    key: "cheap",
    label: "Cheap",
    description: "Use Gemini 3.8 Flash (Low) for faster, cost-effective routing.",
    adapterConfig: {
      model: "gemini-3.8-flash-low",
    },
    source: "adapter_default",
  },
];

export const agentConfigurationDoc = `# antigravity_local agent configuration

Adapter: antigravity_local

Use when:
- You want Paperclip to run the Antigravity CLI locally on the host machine
- You want to leverage native Go performance and improved startup times
- You want Paperclip skills injected locally via Antigravity plugin paths

Core fields:
- cwd (string, optional): default absolute working directory fallback for the agent process
- instructionsFilePath (string, optional): absolute path to a markdown instructions file
- promptTemplate (string, optional): run prompt template
- model (string, optional): Antigravity model id. Defaults to auto.
- command (string, optional): defaults to "agy"
- extraArgs (string[], optional): additional CLI args
- env (object, optional): KEY=VALUE environment variables

Operational fields:
- timeoutSec (number, optional): run timeout in seconds
- graceSec (number, optional): SIGTERM grace period in seconds

Notes:
- Runs use positional prompt arguments.
- Authentication utilizes the native OS keyring or ANTIGRAVITY_API_KEY environment variable.
`;

export function createServerAdapter(): ServerAdapterModule {
  return {
    type,
    execute,
    testEnvironment,
    models,
    modelProfiles,
    listModels: async () => {
      const fetched = await fetchAvailableModels();
      models.length = 0;
      models.push(...fetched);
      return fetched;
    },
    refreshModels: async () => {
      const refreshed = await fetchAvailableModels({ forceRefresh: true });
      models.length = 0;
      models.push(...refreshed);
      return refreshed;
    },
    supportsLocalAgentJwt: true,
    supportsInstructionsBundle: true,
    instructionsPathKey: "instructionsFilePath",
    agentConfigurationDoc,
  };
}
