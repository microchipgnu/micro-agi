import { chatLoop } from "./src/chat/loop";
import { getConfig } from "./src/config";
import { BrowserFileOperations } from "./src/file-operations/browser";
import { NodeFileOperations } from "./src/file-operations/node";
import { callAIFunction, callLLMChatCompletion } from "./src/llm";
import { fixAndParseJson } from "./src/parsing-assistant/json";
import { fixAndParseYAML } from "./src/parsing-assistant/yaml";
import { countStringTokens } from "./src/token-counters/simple";

import type { Activity } from "./src/types/activity.types";
import type { Agent } from "./src/types/agent.types";
import type { ChatWithAiArgs } from "./src/types/chat.types";
import type {
  CommandExecArgs,
  CommandExecArgsV2,
  CommandPlugin,
} from "./src/types/command-plugins.types";
import type { FileOperations } from "./src/types/file-operations.types";
import type {
  ResponseSchema,
  LLMMessage,
  LLMModel,
} from "./src/types/llm.types";
import { CallLLMChatCompletionResponseStatus } from "./src/types/llm.types";

export {
  getConfig,
  chatLoop,
  callAIFunction,
  callLLMChatCompletion,
  fixAndParseJson,
  fixAndParseYAML,
  countStringTokens,
  NodeFileOperations,
  BrowserFileOperations,
  CallLLMChatCompletionResponseStatus,
};

export {
  Agent,
  FileOperations,
  Activity,
  ChatWithAiArgs,
  ResponseSchema,
  CommandExecArgs,
  CommandExecArgsV2,
  CommandPlugin,
  LLMMessage,
  LLMModel,
};
