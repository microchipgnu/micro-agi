import * as AI from "ai-jsx";
import {
  LlmQueryType,
  doQueryLlm,
  LLM_QUERY_TYPE,
  StreamedChunk,
  ModelProviderPropsBase,
  ModelProviderProps,
  ModelProvider,
} from "../models/model-provider.js";

const AI_JSX_OPENROUTER_API_BASE =
  process.env.AI_JSX_OPENROUTER_API_BASE ?? "https://openrouter.ai/api/v1";

const key: string = "AI_JSX_OPENROUTER_API_KEY";

const getOpenRouterKey = () => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }

  else if (
    typeof window !== "undefined" &&
    window[key as keyof typeof window]
  ) {
    return window[key as keyof typeof window] as string;
  }
  
  else if (typeof localStorage !== "undefined" && localStorage[key]) {
    return localStorage[key];
  }

  return undefined;
};

/**
 * Run a model model on Ollama.
 */
export async function queryOpenRouter(
  queryType: LlmQueryType,
  input: any,
  logger: AI.ComponentContext["logger"]
) {
  return doQueryLlm(
    `${AI_JSX_OPENROUTER_API_BASE}${
      queryType === LLM_QUERY_TYPE.CHAT
        ? "/chat/completions"
        : "/chat/completions"
    }`,
    {
      ...input,
      stream: false,
    },
    logger,
    {
      Authorization: "Bearer " + getOpenRouterKey(),
    }
  );
}

export const ollamaChunkDecoder = (
  chunk: StreamedChunk,
  queryType: LlmQueryType
) => {
  if (chunk === null) {
    return null;
  }

  if (typeof chunk === "string") {
    return chunk;
  }

  try {
    const decodedChunk = new TextDecoder().decode(chunk);
    if (!decodedChunk) {
      return null;
    }
    if (!isCompleteJSON(decodedChunk)) {
      return null;
    }

    const parsedData = JSON.parse(decodedChunk);

    if (queryType === LLM_QUERY_TYPE.CHAT) {
      if (parsedData?.choices?.[0]?.text) return parsedData?.choices?.[0]?.text;

      if (parsedData?.choices?.[0]?.message?.content)
        return parsedData?.choices?.[0]?.message?.content;

      return null;
    } else {
      if (parsedData?.choices?.[0]?.text) return parsedData?.choices?.[0]?.text;

      return parsedData.response ?? null;
    }
  } catch (error) {
    return null;
  }
};

const isCompleteJSON = (jsonString: string) => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (e) {
    return false;
  }
};

type OpenRouterProps = Omit<ModelProviderPropsBase, "model"> & {
  model?: string;
  queryLlm?: ModelProviderProps["queryLlm"];
  chunkDecoder?: ModelProviderProps["chunkDecoder"];
};

export const OpenRouter = ({
  children,
  model,
  queryLlm,
  chunkDecoder,
  ...defaults
}: OpenRouterProps) => {
  return (
    <ModelProvider
      queryLlm={queryLlm ?? queryOpenRouter}
      chunkDecoder={chunkDecoder ?? ollamaChunkDecoder}
      model={model ?? "llama2"}
      {...defaults}
    >
      {children}
    </ModelProvider>
  );
};
