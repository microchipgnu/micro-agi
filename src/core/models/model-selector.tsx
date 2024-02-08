import * as AI from "ai-jsx";
import { OpenAIChatModel } from "ai-jsx/lib/openai";
import { Ollama } from "../providers/ollama.js";
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
      return <Ollama model={model} temperature={0.4}>{children}</Ollama>;

    case "openai":
      return (
        <OpenAIChatModel model="gpt-4-1106-preview" temperature={0.4}>{children}</OpenAIChatModel>
      );

    case "open-router":
      return <OpenRouter model={model}>{children}</OpenRouter>;

    default:
      return <>{children}</>;
  }
};

export default ModelSelector;
