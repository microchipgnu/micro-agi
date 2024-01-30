// TODO: need to refactor this
import MrklAgent, { Tool } from "../agents/mrkl-agent.js";
import * as AI from "ai-jsx";
import ModelSelector from "../models/model-selector.js";
import { nanoid } from "nanoid";
import ChatAgent, { Message } from "../agents/chat-agent.js";
import {
  AssistantMessage,
  SystemMessage,
  UserMessage,
} from "ai-jsx/core/conversation";
import { TeamContext } from "./team.js";

interface Messages {
  [conversationId: string]: Message[];
}

export const AgentContext = AI.createContext({
  tools: [] as Tool[],
});

const Agent = async (
  {
    children,
    tools = [],
    role,
    goal,
    backstory,
    context,
    model = "mistral",
    provider = "ollama",
    agentType = "none",
  }: {
    children?: AI.Node;
    tools?: Tool[];
    role?: string;
    goal?: string;
    backstory?: string;
    context?: string;
    model?: string;
    provider?: string;
    agentType?: "mrkl" | "chat" | "none";
  },
  { render, getContext }: AI.RenderContext
): Promise<AI.Node> => {
  const teamContext = getContext(TeamContext);
  const agentContext = getContext(AgentContext);

  agentContext.tools = [
    ...tools,
    {
      name: "agentGetContext",
      description:
        "Use this tool to get the current context of the executing process. Might be helpful to understand what other team agents have done.",
      callback: async () => {
        const teamContext = getContext(TeamContext);
        return JSON.stringify(teamContext.agentResults);
      },
    },
  ];

  const messages: Messages = {};

  const handleSaveHistory = async (
    conversationId: string,
    newMessages: Message[]
  ) => {
    messages[conversationId] = newMessages;
  };

  const handleFetchHistory = async (
    conversationId: string
  ): Promise<Message[]> => {
    if (messages[conversationId]) {
      return messages[conversationId];
    } else {
      messages[conversationId] = [
        {
          content: `You are ${role}.
        Your backstory is: ${backstory}
        Your personal goal is: ${goal}`,
          role: "system",
        },
      ];
      return messages[conversationId];
    }
  };

  const flattened = [children].flat(Infinity as 1);

  let childrenResults = [];
  for (const child of flattened) {
    if (child) {
      const id = nanoid();
      const result = await render(child);

      childrenResults.push({ id, result });
    }
  }

  for (
    let index = 0, length = childrenResults.length;
    index < length;
    index++
  ) {
    const childrenResult = childrenResults[index];
    const id = nanoid();

    const previousResults = teamContext.agentResults
      .slice(0, index)
      .map((agentResult) => {
        return agentResult.result;
      })
      .toString();

    const result = await render(
      <ModelSelector provider={provider} model={model}>
        {agentType === "none" && (
          <>{childrenResult.result ? childrenResult.result : ""}</>
        )}

        {agentType === "mrkl" && (
          <MrklAgent
            tools={agentContext.tools}
            role={role}
            goal={goal}
            backstory={backstory}
          >
            {childrenResult.result
              ? `Current Task: ${childrenResult.result}`
              : ""}
            {context ? `Context\n-------\n ${context}` : ""}
            {previousResults ? `${previousResults}` : ""}
          </MrklAgent>
        )}

        {agentType === "chat" && (
          <ChatAgent
            conversationId="conversation-1"
            memoryManager={{
              fetchHistory: handleFetchHistory,
              saveHistory: handleSaveHistory,
            }}
          >
            {messages?.["conversation-1"]?.map((msg) => {
              switch (msg.role) {
                case "user":
                  return <UserMessage>{msg.content}</UserMessage>;
                case "assistant":
                  return <AssistantMessage>{msg.content}</AssistantMessage>;
                case "system":
                  return <SystemMessage>{msg.content}</SystemMessage>;
              }
            })}
            <UserMessage>{childrenResult.result}</UserMessage>
          </ChatAgent>
        )}
      </ModelSelector>
    );

    teamContext.agentResults.push({
      id,
      role,
      result: result,
      task: childrenResult.result,
    });
  }

  return teamContext.agentResults[teamContext.agentResults.length - 1].result;
};

export default Agent;
