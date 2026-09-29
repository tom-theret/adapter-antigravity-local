/**
 * @fileoverview Dynamic model discovery and caching for the Antigravity local CLI adapter.
 * Fetches available models by executing `agy models` and parsing stdout.
 * 
 * @copyright Antigravity Adapter Contributors
 * @license MIT
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AntigravityModelDefinition } from "../types.js";

const execFileAsync = promisify(execFile);

export const DEFAULT_ANTIGRAVITY_MODELS: AntigravityModelDefinition[] = [
  { id: "auto", label: "Auto (Use global configured default)" },
  { id: "gemini-3.8-flash-high", label: "Gemini 3.8 Flash (High)" },
  { id: "gemini-3.8-flash-medium", label: "Gemini 3.8 Flash (Medium)" },
  { id: "gemini-3.8-flash-low", label: "Gemini 3.8 Flash (Low)" },
  { id: "gemini-3.7-flash-high", label: "Gemini 3.7 Flash (High)" },
  { id: "gemini-3.7-flash-medium", label: "Gemini 3.7 Flash (Medium)" },
  { id: "gemini-3.7-flash-low", label: "Gemini 3.7 Flash (Low)" },
  { id: "gemini-3.6-flash-high", label: "Gemini 3.6 Flash (High)" },
  { id: "gemini-3.6-flash-medium", label: "Gemini 3.6 Flash (Medium)" },
  { id: "gemini-3.6-flash-low", label: "Gemini 3.6 Flash (Low)" },
  { id: "gemini-3.1-pro-high", label: "Gemini 3.1 Pro (High)" },
  { id: "gemini-3.1-pro-low", label: "Gemini 3.1 Pro (Low)" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (Thinking)" },
  { id: "claude-opus-4-6-thinking", label: "Claude Opus 4.6 (Thinking)" },
  { id: "gpt-oss-120b-medium", label: "GPT-OSS 120B (Medium)" },
];

/**
 * Parses raw output from `agy models` into strongly typed model definitions.
 *
 * @param stdout - Raw stdout from `agy models`.
 * @returns Array of parsed model definitions with `auto` prepended if absent.
 */
export function parseModelsFromOutput(stdout: string): AntigravityModelDefinition[] {
  const result: AntigravityModelDefinition[] = [];
  const lines = stdout.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const tabIndex = line.indexOf("\t");
    if (tabIndex !== -1) {
      const id = line.slice(0, tabIndex).trim();
      const label = line.slice(tabIndex + 1).trim();
      if (id) {
        result.push({ id, label: label || id });
      }
    } else {
      const match = line.match(/^(\S+)\s+(.+)$/);
      if (match) {
        result.push({ id: match[1], label: match[2].trim() });
      } else {
        result.push({ id: line, label: line });
      }
    }
  }

  if (!result.some((m) => m.id === "auto")) {
    result.unshift({ id: "auto", label: "Auto (Use global configured default)" });
  }

  return result;
}

let cachedModels: AntigravityModelDefinition[] | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Discovers available models by running `agy models` with in-memory caching.
 * Falls back to default models if execution fails or CLI is not reachable.
 *
 * @param options - Optional command, refresh flag, or timeout override.
 * @returns Promise resolving to the list of available Antigravity models.
 */
export async function fetchAvailableModels(options?: {
  command?: string;
  forceRefresh?: boolean;
  timeoutMs?: number;
}): Promise<AntigravityModelDefinition[]> {
  const now = Date.now();
  if (
    !options?.forceRefresh &&
    cachedModels &&
    cachedModels.length > 0 &&
    now - lastFetchedAt < CACHE_TTL_MS
  ) {
    return cachedModels;
  }

  const command = options?.command || process.env.ANTIGRAVITY_COMMAND || "agy";
  const timeout = options?.timeoutMs ?? 15_000;

  try {
    const { stdout } = await execFileAsync(command, ["models"], {
      timeout,
      env: { ...process.env },
    });

    const parsed = parseModelsFromOutput(stdout);
    if (parsed.length > 1) {
      cachedModels = parsed;
      lastFetchedAt = now;
      return parsed;
    }
  } catch (err) {
    console.warn("[adapter-antigravity-local] Failed to fetch live models from agy:", err);
  }

  return cachedModels ?? DEFAULT_ANTIGRAVITY_MODELS;
}
