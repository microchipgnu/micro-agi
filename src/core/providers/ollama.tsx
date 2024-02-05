import {
  LLM_QUERY_TYPE,
  LlmQueryType,
  ModelProviderPropsBase,
  ModelProvider,
  ModelProviderApiArgs,
  ModelProviderProps,
  StreamedChunk,
  doQueryLlm,
} from "../models/model-provider.js";
import * as AI from "ai-jsx";

const AI_JSX_OLLAMA_API_BASE =
  process.env.AI_JSX_OLLAMA_API_BASE ?? "http://127.0.0.1:11434/api";

/**
 * Run a model model on Ollama.
 */
export async function queryOllama(
  queryType: LlmQueryType,
  input: any,
  logger: AI.ComponentContext["logger"]
) {

  return doQueryLlm(
    `${AI_JSX_OLLAMA_API_BASE}${
      queryType === LLM_QUERY_TYPE.CHAT ? "/chat" : "/generate"
    }`,
    input,
    logger
  );
}

export const ollamaChunkDecoder = (
  chunk: StreamedChunk,
  queryType: LlmQueryType
) => {
  try {
    if (typeof chunk === "string") {
      return chunk;
    } else {
      if (queryType === LLM_QUERY_TYPE.CHAT) {
        return JSON.parse(new TextDecoder().decode(chunk)).message.content;
      } else {
        return JSON.parse(new TextDecoder().decode(chunk)).response;
      }
    }
  } catch (error) {
    throw new Error(`Error decoding Ollama chunk: ${error}`);
  }
};

type OllamaProps = Omit<ModelProviderPropsBase, "model"> & {
  model?: string;
  queryLlm?: ModelProviderProps["queryLlm"];
  chunkDecoder?: ModelProviderProps["chunkDecoder"];
};

export const Ollama = ({
  children,
  model,
  queryLlm,
  chunkDecoder,
  ...defaults
}: OllamaProps) => {
  return (
    <ModelProvider
      queryLlm={queryLlm ?? queryOllama}
      chunkDecoder={chunkDecoder ?? ollamaChunkDecoder}
      model={model ?? "mistral"}
      {...defaults}
    >
      {children}
    </ModelProvider>
  );
};
