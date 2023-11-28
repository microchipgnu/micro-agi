import AgentCommandPlugins from "./agent-command.ts";
import BrowserCommandPlugins from "./browser-command.ts";
import CodeGenerationCommandPlugin from "./code-generation";
import FileOperationCommandPlugins from "./file-operation-command";
import MemoryCommandPlugins from "./memory-command";
import TaskCompleteCommandPlugins from "./task-complete-command";
import type { ResponseSchema } from "@micro-agi/core";
import { fixAndParseJson, fixAndParseYAML } from "@micro-agi/core";

export const InternalPlugins = [
  ...MemoryCommandPlugins,
  ...BrowserCommandPlugins,
  ...FileOperationCommandPlugins,
  ...AgentCommandPlugins,
  ...CodeGenerationCommandPlugin,
  ...TaskCompleteCommandPlugins,
];

export async function getCommand(
  response: string,
  responseSchema: ResponseSchema
): Promise<{
  commandName: string;
  argumentsObj: string | { [key: string]: string };
  rawParsedResponse?: any;
}> {
  try {
    const rawParsedResponse =
      responseSchema === "JSON"
        ? ((await fixAndParseJson(response)) as any)
        : ((await fixAndParseYAML(response)) as any);

    if (!rawParsedResponse["command"]) {
      return {
        commandName: "Error:",
        argumentsObj: `Missing 'command' object in ${responseSchema}`,
      };
    }

    const command = rawParsedResponse["command"] as any;

    if (!command["name"]) {
      return {
        commandName: "Error:",
        argumentsObj: "Missing 'name' field in 'command' object",
      };
    }

    const commandName = command["name"] as string;
    const argumentsObj: { [key: string]: string } = command["args"] || {};

    return { commandName, argumentsObj, rawParsedResponse: rawParsedResponse };
  } catch (e) {
    if (e instanceof SyntaxError) {
      return {
        commandName: "Error:",
        argumentsObj: `Invalid ${responseSchema}`,
      };
    }
    return { commandName: "Error:", argumentsObj: String(e) };
  }
}

export async function executeCommand(
  command: string,
  args: { [key: string]: string }
): Promise<string> {
  try {
    const commandPlugin = InternalPlugins.filter(
      ({ command: cmd }) => cmd == command
    )[0];
    if (commandPlugin) {
      return await commandPlugin.execute(args);
    } else {
      return `Unknown command ${command}`;
    }
  } catch (error) {
    return `Error: ${error}`;
  }
}
