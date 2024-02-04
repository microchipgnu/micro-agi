// TODO: need to refactor this
import * as AI from "ai-jsx";
import {
  AssistantMessage,
  SystemMessage,
  UserMessage,
} from "ai-jsx/core/conversation";
import { nanoid } from "nanoid";
import ChatAgent, { Message } from "../agents/chat-agent.js";
import MrklAgent, { Tool } from "../agents/mrkl-agent.js";
import ModelSelector from "../models/model-selector.js";
import { TeamContext } from "./team.js";
import { isSimilar } from "../utils/lavenshtein-distance.js";

interface Messages {
  [conversationId: string]: Message[];
}

export const AgentContext = AI.createContext({
  tools: [] as Tool[],
  tasks: {} as Record<string, any>,
  ephemeral: {} as Record<string, any>,
  setEphemeralTools: (tools: Tool[]) => {},
  getCurrentTools: (): Tool[] => [],
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
  { render, getContext }: AI.ComponentContext
): Promise<AI.Node> => {
  const teamContext = getContext(TeamContext);
  let agentContext = {
    tools: [
      {
        name: "agentGetContext",
        description:
          "Get the current context of a team member of this team. If the role of the team member is 'Doctor', use that role. If the role of the team member is 'Scientist', use that role.",
        inputDescription:
          'a JSON structure that looks like { "role": "the role to ask for context about" }',
        validateInput: (input) => typeof input.role === "string",
        callback: async (input) => {
          const teamContext = getContext(TeamContext);
          const role = input.role;
          const threshold = 80;

          if (!role) return "";

          const concatenatedResults = teamContext.agentResults
            .filter((agentResult) =>
              isSimilar(agentResult.role, role, threshold)
            )
            .map((agentResult) => agentResult.result)
            .join("\n");

          return concatenatedResults || "";
        },
      },
    ] as Tool[],
    tasks: {} as Record<string, any>,
    ephemeral: {
      tools: [] as Tool[],
    },
    setEphemeralTools: (tools: Tool[]) => {
      agentContext.ephemeral.tools = tools;
    },
    getCurrentTools: () => {
      return [...agentContext.tools, ...agentContext.ephemeral.tools];
    },
  };

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

  for (const child of flattened) {
    if (child) {
      const id = nanoid();

      agentContext.tasks[id] = {
        id,
        status: "pending", // pending, success, error
        render: async () => await render(child),
        result: "",
        addedAt: Date.now(),
        completedAt: 0,
        children: child,
      };
    }
  }

  for (
    let index = 0, length = Object.keys(agentContext.tasks).length;
    index < length;
    index++
  ) {
    // Convert tasks object to an array of its values
    const tasksArray = Object.values(agentContext.tasks);

    // Sort the array based on the 'addedAt' property
    tasksArray.sort((a, b) => a.addedAt - b.addedAt);

    // Find the first task with a status of "pending"
    const task = tasksArray.find((task) => task.status === "pending");

    if (!task) {
      break;
    }

    const agentRunId = nanoid();
    const previousResults = teamContext.agentResults
      .slice(0, index)
      .map((agentResult) => {
        return agentResult.result;
      })
      .toString();

    const result = await render(
      <AgentContext.Provider value={agentContext}>
        <ModelSelector provider={provider} model={model}>
          {agentType === "none" && <>{await task.render()}</>}

          {agentType === "mrkl" && (
            <MrklAgent role={role} goal={goal} backstory={backstory}>
              {/* {task.render ? `Current Task: ${await task.render()}` : ""}
              {context ? `Context\n-------\n ${context}` : ""}
              {previousResults ? `${previousResults}` : ""} */}
              {task.children}
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
              <UserMessage>{await task.render()}</UserMessage>
            </ChatAgent>
          )}
        </ModelSelector>
      </AgentContext.Provider>
    );

    agentContext.ephemeral.tools = [];

    agentContext.tasks[task.id].status = "success";
    agentContext.tasks[task.id].result = result;
    agentContext.tasks[task.id].completedAt = Date.now();

    teamContext.agentResults.push({
      id: agentRunId,
      role,
      result: result,
      task: agentContext.tasks[task.id],
    });
  }

  return teamContext.agentResults[teamContext.agentResults.length - 1].result;
};

export default Agent;
