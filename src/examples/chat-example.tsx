import * as AI from "ai-jsx";
import ChatAgent, {
  MemoryManager,
  Message,
} from "../core/agents/chat-agent.js";
import { OpenRouter } from "../core/providers/open-router.js";


const memory: MemoryManager & { _history: Message[] } = {
  _history: [
    {
      role: "system",
      content: `You are a helpful assistant and you answer all the questions a user asks you.`,
    },
  ],
  saveHistory: async (_, messages) => {
    memory._history = messages;
  },
  fetchHistory: async (_) => {
    return memory._history;
  },
};

const App = ({ children }: { children: AI.Node }) => {
  return (
    <OpenRouter model="jondurbin/bagel-34b">
      <ChatAgent memoryManager={memory} conversationId={"id-1"}>
        {children}
      </ChatAgent>
    </OpenRouter>
  );
};

const renderContext = AI.createRenderContext({});

let response = await renderContext.render(
  <App>What is the capital of Portugal?</App>
);

console.log(response);
