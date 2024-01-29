import * as AI from "ai-jsx";
import ChatAgent, {
  MemoryManager,
  Message,
} from "../core/agents/chat-agent.js";
import { OpenRouter } from "../core/providers/open-router.js";
import { SystemMessage, UserMessage } from "ai-jsx/core/conversation";
import ModelSelector from "../core/models/model-selector.js";
import Agent from "../core/components/agent.js";
import Task from "../core/components/task.js";

const App = () => {
  return (
    <Agent agentType="chat" provider="lm-studio">
      <Task>What's Portugal?</Task>
    </Agent>
  );
};

const renderContext = AI.createRenderContext({});

let response = await renderContext.render(<App />);

console.log(response);
