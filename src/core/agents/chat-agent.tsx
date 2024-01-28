import * as AI from "ai-jsx";
import {
  AssistantMessage,
  ChatCompletion,
  SystemMessage,
  UserMessage,
} from "ai-jsx/core/completion";
import { renderToConversation } from "ai-jsx/core/conversation";

export interface Message {
  role: "user" | "assistant" | "system" | "functionCall" | "functionResponse";
  content: string;
}

export interface MemoryManager {
  saveHistory: (conversationId: string, messages: Message[]) => Promise<void>;
  fetchHistory: (conversationId: string) => Promise<Message[]>;
}

export interface ChatAgentProps {
  children: AI.Node;
  memoryManager: MemoryManager;
  conversationId: string;
}

export const ChatAgent = async (
  { memoryManager, children: message, conversationId }: ChatAgentProps,
  { render }: AI.RenderContext
): Promise<AI.Node> => {
  const messages = await memoryManager.fetchHistory(conversationId);

  const toRenderMessages = await renderToConversation(message, render);

  const validRoles = [
    "user",
    "assistant",
    "system",
    "functionCall",
    "functionResponse",
  ];
  const bufferPromises = toRenderMessages
    .filter((msg) => validRoles.includes(msg.type))
    .map(async (msg) => ({
      role: msg.type,
      content: await render(msg.element),
    }));

  const buffer = await Promise.all(bufferPromises);

  const newMessage = await render(
    <ChatCompletion>
      {messages.map((msg) => {
        switch (msg.role) {
          case "user":
            return <UserMessage>{msg.content}</UserMessage>;
          case "assistant":
            return <AssistantMessage>{msg.content}</AssistantMessage>;
          case "system":
            return <SystemMessage>{msg.content}</SystemMessage>;
        }
      })}
      {message}
    </ChatCompletion>
  );

  memoryManager.saveHistory(conversationId, [
    ...messages,
    ...buffer,
    {
      role: "assistant",
      content: newMessage,
    },
  ]);

  return newMessage;
};

export default ChatAgent;
