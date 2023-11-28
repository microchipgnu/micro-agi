import { encoding_for_model } from "@dqbd/tiktoken";
import type { TiktokenModel } from "@dqbd/tiktoken";
import { LLMMessage, LLMModel } from "../types/llm.types";

export function countMessageTokens(
  messages: LLMMessage[],
  model: LLMModel
): number {
  let tokensPerMessage = 0;
  let tokensPerName = 0;

  if (model === "gpt-3.5-turbo-16k" || model === "gpt-3.5-turbo") {
    return countMessageTokens(messages, "gpt-3.5-turbo-0301");
  } else if (model === "gpt-3.5-turbo-0301") {
    tokensPerMessage = 4;
    tokensPerName = -1;
  } else if (model === "gpt-4" || model === "gpt-4-32k") {
    tokensPerMessage = 3;
    tokensPerName = 1;
  } else {
    tokensPerMessage = 4;
    tokensPerName = -1;
    // TODO: throw error
    // function assertNever(value: string): string {
    //   throw new Error(`Unexpected value: ${value}`);
    // }
    // assertNever(model)
  }

  // TODO: support more models
  // const encoding = encoding_for_model(model as TiktokenModel);
  const encoding = encoding_for_model("gpt-4");
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
  if (model === "gpt-3.5-turbo-16k") {
    model = "gpt-3.5-turbo";
  }

  const encoding = encoding_for_model(model as TiktokenModel);
  const len = encoding.encode(str).length;
  encoding.free();

  return len;
}