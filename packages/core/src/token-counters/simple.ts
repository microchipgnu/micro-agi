// Simply assumes gpt-3.5-turbo-0301 for all models. Gives wrong token calculations, but it's fine for now.

import { encoding_for_model } from "@dqbd/tiktoken";
import { LLMMessage, LLMModel } from "../types/llm.types";

export function countMessageTokens(
  messages: LLMMessage[],
  model: LLMModel
): number {
  let tokensPerMessage = 4;
  let tokensPerName = -1;

  const encoding = encoding_for_model("gpt-3.5-turbo-0301");
  let numTokens = 0;
  for (const message of messages) {
    numTokens += tokensPerMessage;
    for (const [key, val] of Object.entries(message)) {
      numTokens += encoding.encode(val).length;
      if (key === "name") {
        numTokens += tokensPerName;
      }
    }
  }

  encoding.free();

  numTokens += 3; // every reply is primed with <|start|>assistant<|message|>
  return numTokens;
}

export function countStringTokens(str: string, model: LLMModel): number {
  const encoding = encoding_for_model("gpt-3.5-turbo-0301");
  const len = encoding.encode(str).length;
  encoding.free();

  return len;
}
