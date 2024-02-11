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
import Parallel from "../tasks/parallel.js";
import { isSimilar } from "../utils/lavenshtein-distance.js";
import { TeamContext } from "./team.js";

interface Messages {
  [conversationId: string]: Message[];
}

export const AgentContext = AI.createContext({
  tools: [] as Tool[],
  tasks: {} as Record<string, any>,
  ephemeral: {} as Record<string, any>,
  setEphemeralTools: (tools: Tool[]) => {},
  getCurrentTools: (): Tool[] => [],
  context: "",
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

  if (!teamContext) {
    throw new Error(
      "TeamContext not found. Make sure to place your Agent inside a Team component."
    );
  }

  let agentContext = {
    tools: [
      {
        name: "agentGetContext",
        description: `Get the current context of a team member of this team. Available roles: ${teamContext.getAgents()} `,
        inputDescription:
          'a JSON structure that looks like { "role": "the role to ask for context about" }',
        validateInput: (input) => typeof input.role === "string",
        callback: async (input) => {
          if (!input) {
            throw new Error("No input provided");
          }

          const teamContext = getContext(TeamContext);
          const role = input.role;
          const threshold = 80;

          if (!role) return `"${role}" does not exist!`;

          const concatenatedResults = teamContext.agentResults
            .filter((agentResult) =>
              isSimilar(agentResult.role, role, threshold)
            )
            .map((agentResult) => agentResult.result)
            .join("\n");

          return concatenatedResults
            ? `${role} has the following context \n-----\n ${concatenatedResults}`
            : `No context found for ${role}`;
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
    context: "",
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

  const _sequentialAgent = async () => {
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

      const isParallel = task?.children?.tag === Parallel;

      if (isParallel && agentType !== "mrkl") {
        throw new Error(
          "Parallel tasks can only be used with the 'mrkl' agent type."
        );
      }

      const result = await render(
        <AgentContext.Provider value={agentContext}>
          <ModelSelector provider={provider} model={model}>
            {agentType === "none" && <>{await task.render()}</>}

            {agentType === "mrkl" &&
              (isParallel ? (
                await Promise.all(
                  task.children.props.children.map(async (child: any) => {
                    return (
                      <MrklAgent
                        role={role}
                        goal={goal}
                        backstory={backstory}
                        maxIterations={50}
                      >
                        {child}
                      </MrklAgent>
                    );
                  })
                )
              ) : (
                <MrklAgent
                  role={role}
                  goal={goal}
                  backstory={backstory}
                  maxIterations={50}
                >
                  {task.children}
                </MrklAgent>
              ))}

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

      // clear ephemeral tools after task ran
      agentContext.ephemeral.tools = [];

      agentContext.tasks[task.id].status = "success";
      agentContext.tasks[task.id].result = result;
      agentContext.tasks[task.id].completedAt = Date.now();

      if (task?.children?.props?.onDone) {
        await task?.children?.props?.onDone();
      }

      teamContext.agentResults.push({
        id: agentRunId,
        role,
        result: result, // TODO: append context instead of replacing previously added results
        task: agentContext.tasks[task.id],
      });
    }

    return JSON.stringify(agentContext);
  };

  const _hierarchicalAgent = async () => {
    throw new Error("Hierarchical agents are not yet implemented");
  };

  return (
    <>
      {teamContext.process === "sequential" && (await _sequentialAgent())}
      {teamContext.process === "hierarchical" && (await _hierarchicalAgent())}
    </>
  );
};

export default Agent;
