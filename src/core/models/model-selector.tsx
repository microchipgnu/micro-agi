import * as AI from "ai-jsx";
import { OpenAI, OpenAIChatModel, ValidChatModel, ValidCompletionModel } from "ai-jsx/lib/openai";
import { OpenRouter } from "../providers/open-router.js";
import { Ollama } from "./ollama.js";
import { OpenAI as OpenAIClient } from "openai";

const ModelSelector = ({
  children,
  provider = "ollama",
  model = "mistral",
}: {
  children?: AI.Node;
  provider?: string;
  model?: string;
}): AI.Node => {
  switch (provider) {
    case "ollama":
      return <Ollama model={model}>{children}</Ollama>;

    case "openai":
      return (
        <OpenAIChatModel model="gpt-3.5-turbo-1106">{children}</OpenAIChatModel>
      );

    case "lm-studio":
      return (
        <OpenAI
          chatModel={model as ValidChatModel}
          completionModel={model as ValidCompletionModel}
          client={
            new OpenAIClient({
              apiKey: "no-key",
              baseURL: "http://localhost:42069/v1",
            })
          }
        >
          {children}
        </OpenAI>
      );

    case "open-router":
      return <OpenRouter model={model}>{children}</OpenRouter>;

    default:
      return <>{children}</>;
  }
};

export default ModelSelector;
