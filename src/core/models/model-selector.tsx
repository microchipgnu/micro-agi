import * as AI from "ai-jsx";
import { ChatProvider } from "ai-jsx/core/completion";
import { OpenAIChatModel } from "ai-jsx/lib/openai";

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
      return (
        <ChatProvider component={OpenAIChatModel} model={model as any}>
          {children}
        </ChatProvider>
      );

    case "openai":
      return (
        <ChatProvider component={OpenAIChatModel} model={model as any}>
          {children}
        </ChatProvider>
      );

    case "open-router":
      return (
        <ChatProvider component={OpenAIChatModel} model={model as any}>
          {children}
        </ChatProvider>
      );

    default:
      return <>{children}</>;
  }
};

export default ModelSelector;
