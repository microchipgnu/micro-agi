import {
  ChatProvider,
  CompletionProvider,
  type ModelPropsWithChildren,
} from "ai-jsx/core/completion";
import * as AI from "ai-jsx";
import {
  AssistantMessage,
  renderToConversation,
} from "ai-jsx/core/conversation";
import {
  Ollama as LangchainOllama,
  type OllamaInput,
} from "@langchain/community/llms/ollama";

interface OllamaModelArgs
  extends Omit<OllamaModelProps, "repetitionPenalty" | "children">,
  OllamaInput {
  model: string;
  prompt: string;

  /** Penalty for repeated words in the output. Must be in the range [0.01, 5]. */
  repetition_penalty?: OllamaModelProps["repetitionPenalty"];

  top_p?: OllamaModelProps["topP"];

  /** The maximum number of tokens to generate */
  max_length?: OllamaModelProps["maxTokens"];
}

export interface OllamaModelProps extends ModelPropsWithChildren {
  /** Penalty for repeated words in the output. Must be in the range [0.01, 5]. */
  repetitionPenalty?: number;
  model: string;
}

interface OllamaChatModelArgs extends OllamaModelArgs {
  system_prompt?: string;
}

export const defaultMaxTokens = 500;

async function fetchOllama<ModelArgs extends OllamaModelArgs>(
  model: string,
  input: ModelArgs,
  logger: AI.ComponentContext["logger"]
) {
  const ollama = new LangchainOllama({
    model: model,
  });

  logger.debug({ model, input }, `Calling Ollama ${model}`);

  const output = await ollama.generate([input.prompt]);

  const result = output.generations.map(genArray =>
    genArray.map(gen => gen.text).join('')
  ).join("")

  logger.debug({ result }, `Ollama ${model} output`);

  return result;
}

export async function* OllamaChatModel(
  props: OllamaModelProps,
  { render, logger }: AI.ComponentContext
): AI.RenderableStream {
  yield AI.AppendOnlyStream;

  const messageElements = await renderToConversation(
    props.children,
    render,
    logger,
    "prompt"
  );

  const systemMessages = messageElements.filter(
    (element) => element.type === "system"
  );
  const userMessages = messageElements.filter(
    (element) => element.type === "user"
  );

  // TODO: Add AIJSXErrors

  yield AI.AppendOnlyStream;

  const ollamaArgs: OllamaChatModelArgs = {
    model: props.model,
    max_length: props.maxTokens ?? defaultMaxTokens,
    prompt: await render(props.children),
    repetition_penalty: props.repetitionPenalty,
    top_p: props.topP,
    temperature: props.temperature,
    system_prompt: systemMessages.length
      ? await render(systemMessages[0].element)
      : undefined,
  };

  const assistantMessage = (
    <AssistantMessage>
      {await fetchOllama(props.model, ollamaArgs, logger)}
    </AssistantMessage>
  );

  yield assistantMessage;

  await renderToConversation(assistantMessage, render, logger, "completion");
  return AI.AppendOnlyStream;
}

export async function* OllamaCompletionModel(
  props: OllamaModelProps,
  { render, logger }: AI.ComponentContext
): AI.RenderableStream {
  yield AI.AppendOnlyStream;

  const ollamaArgs: OllamaModelArgs = {
    model: props.model,
    prompt: await render(props.children),
    max_length: props.maxTokens ?? defaultMaxTokens,
    temperature: props.temperature,
    top_p: props.topP,
  };
  logger.debug({ ollamaArgs }, "Calling Ollama");
  const response = await fetchOllama(props.model, ollamaArgs, logger);
  yield response;
  return AI.AppendOnlyStream;
}

export function Ollama({ children, ...defaults }: OllamaModelProps): AI.Node {
  return (
    <ChatProvider component={OllamaChatModel} {...defaults}>
      <CompletionProvider component={OllamaCompletionModel} {...defaults}>
        {children}
      </CompletionProvider>
    </ChatProvider>
  );
}
