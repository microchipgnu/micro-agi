import * as AI from "ai-jsx";
import { OpenAIChatModel } from "ai-jsx/lib/openai";
import { Ollama } from "./ollama.js";
import { OpenRouter } from "../providers/open-router.js";

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

    case "open-router":
      return <OpenRouter model={model}>{children}</OpenRouter>;

    default:
      return <>{children}</>;
  }
};

export default ModelSelector;
