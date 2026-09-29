import { describe, expect, it } from "vitest";
import {
  parseModelsFromOutput,
  DEFAULT_ANTIGRAVITY_MODELS,
} from "../../src/server/models.js";

describe("models discovery helpers", () => {
  describe("parseModelsFromOutput", () => {
    it("parses tab-separated agy models output correctly", () => {
      const sample = `gemini-3.8-flash-high\tGemini 3.8 Flash (High)
gemini-3.8-flash-low\tGemini 3.8 Flash (Low)
claude-sonnet-4-6\tClaude Sonnet 4.6 (Thinking)`;

      const parsed = parseModelsFromOutput(sample);

      expect(parsed[0]).toEqual({
        id: "auto",
        label: "Auto (Use global configured default)",
      });
      expect(parsed).toContainEqual({
        id: "gemini-3.8-flash-high",
        label: "Gemini 3.8 Flash (High)",
      });
      expect(parsed).toContainEqual({
        id: "claude-sonnet-4-6",
        label: "Claude Sonnet 4.6 (Thinking)",
      });
      expect(parsed.length).toBe(4);
    });

    it("parses space-separated lines and ignores empty lines", () => {
      const sample = `
gemini-3.1-pro-high    Gemini 3.1 Pro (High)

gpt-oss-120b-medium    GPT-OSS 120B (Medium)
`;

      const parsed = parseModelsFromOutput(sample);

      expect(parsed[0].id).toBe("auto");
      expect(parsed).toContainEqual({
        id: "gemini-3.1-pro-high",
        label: "Gemini 3.1 Pro (High)",
      });
      expect(parsed).toContainEqual({
        id: "gpt-oss-120b-medium",
        label: "GPT-OSS 120B (Medium)",
      });
    });

    it("does not duplicate auto if auto is already in output", () => {
      const sample = `auto\tAuto (Use global configured default)\ngemini-3.8-flash-high\tGemini 3.8 Flash (High)`;
      const parsed = parseModelsFromOutput(sample);
      const autoCount = parsed.filter((m) => m.id === "auto").length;
      expect(autoCount).toBe(1);
    });
  });

  describe("DEFAULT_ANTIGRAVITY_MODELS", () => {
    it("contains auto and modern Gemini/Claude models", () => {
      expect(DEFAULT_ANTIGRAVITY_MODELS.some((m) => m.id === "auto")).toBe(true);
      expect(DEFAULT_ANTIGRAVITY_MODELS.some((m) => m.id === "gemini-3.8-flash-high")).toBe(true);
      expect(DEFAULT_ANTIGRAVITY_MODELS.some((m) => m.id === "claude-sonnet-4-6")).toBe(true);
    });
  });
});
