import * as AI from "ai-jsx";
import {
  AssistantMessage,
  ChatCompletion,
  Completion,
  SystemMessage,
  UserMessage,
} from "ai-jsx/core/completion";
import { AgentContext } from "../components/agent.js";

export interface Tool<Input = any, Output = any> {
  name: string;
  description: string;
  inputDescription?: string;
  validateInput?: (input: Input) => boolean;
  callback: (input: Input) => Promise<Output>;
}

interface MrklAgentProps {
  tools?: Tool[];
  role?: string;
  goal?: string;
  backstory?: string;
  children: AI.Node;
  maxIterations?: number;
  accumulateObservations?: boolean;
}

interface ParsedLlmResponse {
  tool: string | null;
  input: any;
  thoughts: string;
}

const ACTION_PREFIX = "Action:";
const ACTION_INPUT_PREFIX = "Action Input:";
const OBSERVATION_PREFIX = "Observation:";
const FINAL_ANSWER_PREFIX = "Final Answer:";
const THOUGHT_PREFIX = "Thought:";
const MAX_ITERATIONS_DEFAULT = 100;

const buildPrompt = (
  tools: Tool[],
  role = "assistant",
  goal = "answer the question",
  backstory = "no backstory"
) => `
You are ${role}.
${backstory}

Your personal goal is: ${goal}


TOOLS:
------
You have access to the following tools:
${tools.map((tool) => {
  return `${tool.name} - ${tool.description} - for this tool input MUST be ${
    tool.inputDescription ?? "null"
  }\n`;
})}

Use the following format in your response:

${THOUGHT_PREFIX} Do I need to use a tool? Yes
${ACTION_PREFIX} the action to take, should be one of [${tools
  .map((tool) => tool.name)
  .join(",")}]
${ACTION_INPUT_PREFIX} the input to the action
${OBSERVATION_PREFIX} the result of the action

... (this Thought/Action/Action Input/Observation can repeat N times)

When you have a response for your task, or if you DO NOT need to use a tool, you MUST use the format:

${THOUGHT_PREFIX} Do I need to use a tool? No
${FINAL_ANSWER_PREFIX} the final answer to the original input question

Begin! Solve the following tasks as best you can. This is VERY important to you, your job depends on it!
`;

const parseLlmResponseForTool = (response: string): ParsedLlmResponse => {
  const responseLines = response
    .split("\n")
    .map((responseLine: string) => responseLine.trim())
    .reverse();

  let tool: string | null = null;
  let input: any = null;
  const toolActionLine = responseLines.find((responseLine: string) =>
    responseLine.startsWith(ACTION_PREFIX)
  );

  if (toolActionLine) {
    tool = toolActionLine.substring(ACTION_PREFIX.length).trim();
    const inputString = responseLines
      .find((responseLine: string) =>
        responseLine.startsWith(ACTION_INPUT_PREFIX)
      )
      ?.substring(ACTION_INPUT_PREFIX.length)
      .trim();

    if (inputString) {
      // Check if the inputString is a valid JSON string
      if (inputString.startsWith("{") && inputString.endsWith("}")) {
        try {
          input = JSON.parse(inputString);
        } catch (error) {
          console.error("Error parsing inputString to JSON:", error);
        }
      } else {
        input = inputString; // Use the raw string as input
      }
    }
  }

  // Parse thoughts
  const thoughts = response
    .split("\n")
    .filter((line) => line.startsWith(THOUGHT_PREFIX))
    .map((line) => line.substring(THOUGHT_PREFIX.length).trim())
    .join("\n");

  return { tool, input, thoughts };
};

const parseLlmResponseForFinalAnswer = (response: string) => {
  const responseLines = response
    .split("\n")
    .map((responseLine: string) => responseLine.trim())
    .reverse();

  return (
    responseLines
      .find((responseLine: string) =>
        responseLine.startsWith(FINAL_ANSWER_PREFIX)
      )
      ?.substring(FINAL_ANSWER_PREFIX.length)
      .trim() ?? ""
  );
};

const parseLlmResponse = async (response: string, render: any) => {
  const actionRegex =
    /Action\s*:\s*(.*?)\s*Action\s*Input\s*:\s*(.*?)(?=(Action\s*:|$))/gs;
  const actions = [];

  let actionMatch;
  while ((actionMatch = actionRegex.exec(response)) !== null) {
    if (actionMatch.length >= 3) {
      const action = actionMatch[1].trim();
      const actionInputRaw = actionMatch[2].trim();
      let actionInput;

      if (actionInputRaw.startsWith("{") && actionInputRaw.endsWith("}")) {
        async function parseJsonInput(input: string) {
          try {
            return JSON.parse(input);
          } catch (error) {
            console.error("Error parsing action input as JSON:", error);

            // TODO: need a better solution for recovering errors of json parsing
            const llmResponse = await render(
              <ChatCompletion>
                <UserMessage>
                  Correct the following JSON object and output the corrected
                  JSON string only.
                  {input}
                </UserMessage>
              </ChatCompletion>
            );

            return parseJsonInput(llmResponse);
          }
        }

        actionInput = await parseJsonInput(actionInputRaw);
      }

      actions.push({ type: "action", tool: action, input: actionInput });
    }
  }

  if (response.includes(FINAL_ANSWER_PREFIX)) {
    const finalAnswerText = response.split(FINAL_ANSWER_PREFIX)[1].trim();
    return { type: "finalAnswer", finalAnswer: finalAnswerText, actions };
  }

  if (actions.length > 0) {
    return { type: "action", actions };
  }

  return { type: "unstructuredResponse", content: response, actions };
};

export const MrklAgent = async (
  {
    tools = [],
    role,
    goal,
    backstory,
    children,
    maxIterations = MAX_ITERATIONS_DEFAULT,
    accumulateObservations = false,
  }: MrklAgentProps,
  { render, logger, getContext }: AI.ComponentContext
): Promise<AI.Node> => {
  const agentContext = getContext(AgentContext);
  const task = await render(children);

  let finalAnswer = "";
  let iteration = 0;
  let scratchPad = "";
  const _tools = [...agentContext.getCurrentTools(), ...tools];

  while (!finalAnswer && iteration < maxIterations) {
    const prompt = `
    ${buildPrompt(_tools, role, goal, backstory)}
    Current task: ${task}
    ${
      scratchPad &&
      `The SCRATCHPAD contains the context you're working with! I only see what you return as "${FINAL_ANSWER_PREFIX}"
      
      You have ${
        maxIterations - iteration
      } iterations left to provide a final answer.
      
      Here is the SCRATCHPAD:\n----\n${scratchPad}\n`
    }
    `;

    // TODO: add support to chat completions to get access to better models
    const llmResponse = await render(
      <ChatCompletion stop={[OBSERVATION_PREFIX]}>
        <SystemMessage>
          {buildPrompt(_tools, role, goal, backstory)}
          {`Current task: ${task}\n`}
        </SystemMessage>
        {scratchPad && (
          <UserMessage>
            {`The SCRATCHPAD contains the context you're working with! I only see what you return as "${FINAL_ANSWER_PREFIX}"\nYou have ${
              maxIterations - iteration
            } iterations left to provide a final answer.\n Here is the SCRATCHPAD:\n----
            """
            ${scratchPad}
            """
          `}
          </UserMessage>
        )}
      </ChatCompletion>
    );

    logger.debug({ type: "llmResponse", value: llmResponse });

    try {
      const parsedResponse = await parseLlmResponse(llmResponse, render);

      logger.debug({ type: "parsedResponse", value: parsedResponse });

      if (
        parsedResponse.type === "unstructuredResponse" &&
        parsedResponse.content
      ) {
        scratchPad = `${OBSERVATION_PREFIX} ${JSON.stringify(parsedResponse)}`;
      }

      if (parsedResponse.type === "action" && parsedResponse.actions) {
        let toolResult = "";
        for (const action of parsedResponse.actions) {
          const toolToUse = _tools.find((tool) => tool.name === action.tool);

          if (toolToUse) {
            try {
              toolResult = await toolToUse.callback(action.input);

              logger.debug({ type: "toolResult", value: toolResult });
            } catch (error) {
              console.error(error);
            }

            if (toolResult) {
              if (accumulateObservations) {
                scratchPad += `${OBSERVATION_PREFIX} tool used "${action.tool}"\n${OBSERVATION_PREFIX} ${toolResult}\n`;
              } else {
                scratchPad = `${OBSERVATION_PREFIX} tool used "${action.tool}"\n${OBSERVATION_PREFIX} ${toolResult}\n`;
              }
            } else {
              scratchPad += `${OBSERVATION_PREFIX} DO NOT USE AGAIN "${action.tool}"\n`;
            }
          } else {
            // scratchPad += `${OBSERVATION_PREFIX} DO NOT USE AGAIN "${action.tool}"\n`;
          }
        }
      } else if (parsedResponse.type === "finalAnswer") {
        // TODO: run through all actions and then return final answer
        for (const action of parsedResponse.actions) {
          const toolToUse = _tools.find((tool) => tool.name === action.tool);
          if (toolToUse) {
            try {
              await toolToUse.callback(action.input);
            } catch (error) {
              console.error(error);
            }
          }
        }

        finalAnswer = parsedResponse.finalAnswer!;
        return <AssistantMessage>{finalAnswer}</AssistantMessage>;
      }
    } catch (error) {
      console.error(error);

      continue;
    }

    iteration++;
  }

  return (
    <AssistantMessage>{finalAnswer}</AssistantMessage> || (
      <AssistantMessage>
        Unable to find an answer within the iteration limit.
      </AssistantMessage>
    )
  );
};

export default MrklAgent;
