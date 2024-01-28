import {
  ChatProvider,
  CompletionProvider,
  ModelComponent,
  ModelPropsWithChildren,
} from "ai-jsx/core/completion";
import {
  AssistantMessage,
  renderToConversation,
} from "ai-jsx/core/conversation";
import { AIJSXError, ErrorCode } from "ai-jsx/core/errors";
import * as AI from "ai-jsx";
import { debugRepresentation } from "ai-jsx/core/debug";
import { streamToAsyncIterator } from "../utils/stream-to-async-iterator.js";
import _ from "lodash";
/**
 * Base 64 encoded image
 */
type LlavaImageArg = string;

/**
 * Model parameters
 *
 * @see https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values
 */
interface ModelProviderOptions {
  mirostat?: number;
  mirostat_eta?: number;
  mirostat_tau?: number;
  num_ctx?: number;
  num_gqa?: number;
  num_gpu?: number;
  num_thread?: number;
  repeat_last_n?: number;
  repeat_penalty?: number;
  temperature?: number;
  seed?: number;
  stop?: string[];
  tfs_z?: number;
  num_predict?: number;
  top_k?: number;
  top_p?: number;
}

interface ModelProviderChatMessage {
  role: string;
  content: string;
  images?: LlavaImageArg[];
}

interface ModelProviderApiBaseArgs {
  model: string;
  options?: ModelProviderOptions;
  stream?: boolean;
}

/**
 * Arguments to the Ollama's completion API.
 *
 * @see https://github.com/jmorganca/ollama/blob/main/docs/api.md#generate-a-completion
 */
interface ModelProviderApiCompletionArgs extends ModelProviderApiBaseArgs {
  prompt: string;
  images?: LlavaImageArg[];
  context?: number[];
}

/**
 * Arguments to the Ollama's chat completion API.
 *
 * @see https://github.com/jmorganca/ollama/blob/main/docs/api.md#generate-a-chat-completion
 */
interface ModelProviderApiChatArgs extends ModelProviderApiBaseArgs {
  messages: ModelProviderChatMessage[];
}

export type ModelProviderApiArgs =
  | ModelProviderApiChatArgs
  | ModelProviderApiCompletionArgs;

export const isModelProviderApiChatArgs = (
  args: ModelProviderApiArgs
): args is ModelProviderApiChatArgs =>
  Object.prototype.hasOwnProperty.call(args, "messages");
export const isModelProviderApiCompletionArgs = (
  args: ModelProviderApiArgs
): args is ModelProviderApiCompletionArgs =>
  Object.prototype.hasOwnProperty.call(args, "prompt");

export type ModelProviderPropsBase = ModelPropsWithChildren &
  Omit<
    ModelProviderOptions,
    | "mirostat_eta"
    | "mirostat_tau"
    | "num_ctx"
    | "num_gqa"
    | "num_gpu"
    | "num_thread"
    | "repeat_last_n"
    | "repeat_penalty"
    | "tfs_z"
    | "num_predict"
    | "top_k"
    | "top_p"
  > & {
    model: string;
    mirostatEta?: number;
    mirostatTau?: number;
    numCtx?: number;
    numGqa?: number;
    numGpu?: number;
    numThread?: number;
    repeatLastN?: number;
    repeatPenalty?: number;
    tfsZ?: number;
    numPredict?: number;
    topK?: number;
    topP?: number;
    stream?: boolean;
  };

export const LLM_QUERY_TYPE = {
  CHAT: "chat",
  COMPLETION: "completion",
} as const;

export type LlmQueryType = (typeof LLM_QUERY_TYPE)[keyof typeof LLM_QUERY_TYPE];

export type MapPropsToArgs<
  P extends ModelProviderPropsBase = ModelProviderPropsBase,
  T extends ModelProviderApiArgs = ModelProviderApiArgs
> = (props: P, queryType: LlmQueryType) => Omit<T, "prompt" | "messages">;

const mapModelPropsToArgs: MapPropsToArgs<
  ModelProviderPropsBase,
  ModelProviderApiArgs
> = (
  props: ModelProviderPropsBase
): Omit<ModelProviderApiArgs, "prompt" | "messages"> => {
  return {
    model: props.model,
    stream: props.stream,
    options:
      Object.keys(props).length > 0
        ? {
            mirostat: props.mirostat,
            mirostat_eta: props.mirostatEta,
            mirostat_tau: props.mirostatTau,
            num_ctx: props.numCtx,
            num_gqa: props.numGqa,
            num_gpu: props.numGpu,
            num_thread: props.numThread,
            repeat_last_n: props.repeatLastN,
            repeat_penalty: props.repeatPenalty,
            temperature: props.temperature,
            seed: props.seed,
            stop: props.stop,
            tfs_z: props.tfsZ,
            num_predict: props.numPredict,
            top_k: props.topK,
            top_p: props.topP,
          }
        : undefined,
  };
};

export type QureryLlmFunction = (
  queryType: LlmQueryType,
  input: any,
  logger: AI.ComponentContext["logger"]
) => Promise<ReturnType<typeof streamToAsyncIterator> | undefined>;

type doQureryLlmFunction = (
  url: string,
  input: any,
  logger: AI.ComponentContext["logger"],
  extraHeaders?: Record<string, string>
) => Promise<ReturnType<typeof streamToAsyncIterator> | undefined>;

export const doQueryLlm: doQureryLlmFunction = async (
  url,
  input,
  logger,
  headers = {}
) => {
  logger.debug(input, "do Query Llm");

  const controller = new AbortController();
  try {
    const apiEndpoint = url;

    // @ts-ignore: todo fix later
    const response = await fetch(apiEndpoint, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      signal: controller.signal,
      body: JSON.stringify(input),
    });

    if (!response.ok || !response.body) {
      throw await response.text();
    }

    // @ts-ignore
    return streamToAsyncIterator(response.body);
  } catch (ex) {
    controller.abort();
    console.error(`${ex}`);
  }
};

export type StreamedChunk = ArrayBuffer | string;
export type ChunkDecoder = (
  chunk: StreamedChunk,
  responseType: LlmQueryType
) => string;

const QueryLlmContext = AI.createContext<{
  queryLlm: QureryLlmFunction;
  chunkDecoder: ChunkDecoder;
  mapPropsToArgs: MapPropsToArgs;
}>({
  queryLlm: () => {
    throw "function queryLlm is not defined";
  },
  chunkDecoder: () => {
    throw "function chunkDecoder is not defined";
  },
  mapPropsToArgs: () => {
    throw "function mapPropsToArgs is not defined";
  },
});

const getResponseStreamConsumer =
  (
    queryType: LlmQueryType,
    iterator: ReturnType<typeof streamToAsyncIterator>,
    chunkDecoder: ChunkDecoder,
    logger: AI.ComponentContext["logger"]
  ) =>
  async () => {
    // Eat any empty chunks, typically seen at the beginning of the stream.
    let next;
    let nextValue;
    do {
      next = await iterator.next();
      if (next.done) {
        return null;
      }

      nextValue = chunkDecoder(next.value, queryType);
    } while (!nextValue);

    logger.trace({ message: next.value }, "Got message");

    return nextValue;
  };

export async function* ModelProviderChatModel(
  props: ModelProviderPropsBase,
  { render, logger, memo, getContext }: AI.ComponentContext
): AI.RenderableStream {
  yield AI.AppendOnlyStream;

  const messageElements = await renderToConversation(
    props.children,
    render,
    logger,
    "prompt"
  );

  if (messageElements.find((e) => e.type == "functionCall")) {
    throw new AIJSXError(
      "ModelProvider does not support <FunctionCall>. Please use <SystemMessage> instead.",
      ErrorCode.Llama2DoesNotSupportFunctionCalls,
      "user"
    );
  }
  if (messageElements.find((e) => e.type == "functionResponse")) {
    throw new AIJSXError(
      "ModelProvider does not support <FunctionResponse>. Please use <SystemMessage> instead.",
      ErrorCode.Llama2DoesNotSupportFunctionResponse,
      "user"
    );
  }

  const messages = _.compact(
    await Promise.all(
      messageElements.map(
        async (message): Promise<ModelProviderChatMessage | undefined> => {
          switch (message.type) {
            case "system":
              return {
                role: "system",
                content: await render(message.element),
              };
            case "user":
              return {
                role: "user",
                content: await render(message.element),
              };
            case "assistant":
              return {
                role: "assistant",
                content: await render(message.element),
              };
          }
        }
      )
    )
  );

  if (!messages.length) {
    throw new AIJSXError(
      "ChatCompletion must have at least one child that's a SystemMessage, UserMessage, AssistantMessage but no such children were found.",
      ErrorCode.ChatCompletionMissingChildren,
      "user"
    );
  }

  yield AI.AppendOnlyStream;

  const { queryLlm, chunkDecoder, mapPropsToArgs } =
    getContext(QueryLlmContext);

  const chatCompletionRequest: ModelProviderApiChatArgs = {
    messages,
    ...mapPropsToArgs(props, LLM_QUERY_TYPE.CHAT),
  };

  const chatResponse = await queryLlm(
    LLM_QUERY_TYPE.CHAT,
    chatCompletionRequest,
    logger
  );

  const outputMessages = [] as AI.Node[];

  if (chatResponse) {
    const iterator = chatResponse[Symbol.asyncIterator]();

    const advance = getResponseStreamConsumer(
      LLM_QUERY_TYPE.CHAT,
      iterator,
      chunkDecoder,
      logger
    );

    
    let token = await advance();

    while (token !== null) {
      if (token) {
        // Memoize the stream to ensure it renders only once.
        let accumulatedContent = "";
        let complete = false;
        const Stream = async function* (): AI.RenderableStream {
          yield AI.AppendOnlyStream;

          while (token !== null) {
            if (token) {
              accumulatedContent += token;
              yield token;
            }
            token = await advance();
          }
          complete = true;

          return AI.AppendOnlyStream;
        };
        const assistantMessage = memo(
          <AssistantMessage>
            <Stream
              {...debugRepresentation(
                () => `${accumulatedContent}${complete ? "" : "▮"}`
              )}
            />
          </AssistantMessage>
        );
        yield assistantMessage;

        // Ensure the assistant stream is flushed by rendering it.
        await render(assistantMessage);
        outputMessages.push(assistantMessage);

        if (token !== null) {
          token = await advance();
        }
      }
    }
  }

  // Render it so that the conversation is logged.
  await renderToConversation(outputMessages, render, logger, "completion");
  return AI.AppendOnlyStream;
}

export async function* ModelProviderCompletionModel(
  props: ModelProviderPropsBase,
  { render, logger, memo, getContext }: AI.ComponentContext
): AI.RenderableStream {
  yield AI.AppendOnlyStream;

  async function buildPromptFromNodes(children: AI.Node[]) {
    const { textNodes, imageNodes } = children?.reduce(
      (nodes, child) => {
        // @ts-ignore
        if (child && child.tag && child.tag.name === "LlavaImage") {
          return {
            textNodes: [...nodes.textNodes, `[img-${nodes.imageNodes.length}]`],
            imageNodes: [...nodes.imageNodes, child],
          };
        }
        return {
          textNodes: [...nodes.textNodes, child],
          imageNodes: nodes.imageNodes,
        };
      },
      { textNodes: [] as AI.Node[], imageNodes: [] as AI.Node[] }
    );

    return {
      prompt: await render(textNodes),
      images: await Promise.all(imageNodes.map((node) => render(node))),
    };
  }

  let prompt = { prompt: "" };
  if (_.isArray(props.children)) {
    prompt = await buildPromptFromNodes(props.children as AI.Node[]);
  } else {
    prompt = { prompt: await render(props.children) };
  }

  const { queryLlm, chunkDecoder, mapPropsToArgs } =
    getContext(QueryLlmContext);

  const modelArgs: ModelProviderApiCompletionArgs = {
    ...prompt,
    ...mapPropsToArgs(props, LLM_QUERY_TYPE.COMPLETION),
  };

  logger.debug({ modelArgs }, "Model Provider Args");

  const response = await queryLlm(LLM_QUERY_TYPE.COMPLETION, modelArgs, logger);

  if (response) {
    const iterator = response[Symbol.asyncIterator]();

    const advance = getResponseStreamConsumer(
      LLM_QUERY_TYPE.COMPLETION,
      iterator,
      chunkDecoder,
      logger
    );

    let token = await advance();

    while (token !== null) {
      if (token) {
        // Memoize the stream to ensure it renders only once.
        let accumulatedContent = "";
        let complete = false;
        const Stream = async function* (): AI.RenderableStream {
          yield AI.AppendOnlyStream;

          while (token !== null) {
            if (token) {
              accumulatedContent += token;
              yield token;
            }
            token = await advance();
          }
          complete = true;

          return AI.AppendOnlyStream;
        };
        const reponseMessage = memo(
          <Stream
            {...debugRepresentation(
              () => `${accumulatedContent}${complete ? "" : "▮"}`
            )}
          />
        );
        yield reponseMessage;

        // Ensure the response stream is flushed by rendering it.
        await render(reponseMessage);

        if (token !== null) {
          token = await advance();
        }
      }
    }
  }

  return AI.AppendOnlyStream;
}

export interface ModelProviderProps<
  P extends ModelProviderPropsBase = ModelProviderPropsBase,
  T extends ModelProviderApiArgs = ModelProviderApiArgs
> extends ModelProviderPropsBase {
  queryLlm: QureryLlmFunction;
  chunkDecoder: ChunkDecoder;
  mapPropsToArgs?: MapPropsToArgs<P, T>;
  chatModel?: ModelComponent<ModelProviderPropsBase>;
  completionModel?: ModelComponent<ModelProviderPropsBase>;
}

export function ModelProvider(
  {
    children,
    queryLlm,
    chunkDecoder,
    mapPropsToArgs = mapModelPropsToArgs,
    chatModel = ModelProviderChatModel,
    completionModel = ModelProviderCompletionModel,
    ...defaults
  }: ModelProviderProps,
  { getContext }: AI.RenderContext
) {
  return (
    <QueryLlmContext.Provider
      value={{ queryLlm, chunkDecoder, mapPropsToArgs }}
    >
      <ChatProvider component={chatModel} {...defaults}>
        <CompletionProvider component={completionModel} {...defaults}>
          {children}
        </CompletionProvider>
      </ChatProvider>
    </QueryLlmContext.Provider>
  );
}
