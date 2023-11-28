import { LLMMessage, LLMModel } from "./llm.types";

export interface Agent {
  name: string;
  task: string;
  messages: LLMMessage[];
  model: LLMModel;
}
