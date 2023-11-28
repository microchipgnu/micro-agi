import { LLMMessage, LLMModel, CallLLMChatCompletionArgs } from "./llm.types";

export interface ChatWithAiArgs {
  prompt: string;
  userInput: string;
  fullMessageHistory: LLMMessage[];
  appendToFullMessageHistory: (messages: LLMMessage[]) => void;
  permanentMemory: string[];
  tokenLimit: number;
  model: LLMModel;
  functions?: CallLLMChatCompletionArgs["functions"];
  debug?: boolean;
}
