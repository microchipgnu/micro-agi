import * as AI from "ai-jsx";
import { Completion } from "ai-jsx/core/completion";

export interface Tool<Input = any, Output = any> {
  name: string;
  description: string;
  inputDescription?: string;
  validateInput?: (input: Input) => boolean;
  callback: (input: Input) => Promise<Output>;
}

interface MrklAgentProps {
  tools: Tool[];
  role?: string;
  goal?: string;
  backstory?: string;
  children: AI.Node;
  maxIterations?: number;
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
) => `Answer the following questions as best you can.

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
        Observation: the result of the action
${OBSERVATION_PREFIX} the result of the action

... (this Thought/Action/Action Input/Observation can repeat N times)

When you have a response for your task, or if you do not need to use a tool, you MUST use the format:

${THOUGHT_PREFIX}: Do I need to use a tool? No
${FINAL_ANSWER_PREFIX} the final answer to the original input question

Begin! This is VERY important to you, your job depends on it!
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

const parseLlmResponse = (response: string) => {
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
        try {
          actionInput = JSON.parse(actionInputRaw);
        } catch (error) {
          console.error("Error parsing action input as JSON:", error);
          actionInput = actionInputRaw; // Use raw string as a fallback
        }
      } else {
        actionInput = actionInputRaw;
      }

      actions.push({ type: "action", tool: action, input: actionInput });
    }
  }

  if (actions.length > 0) {
    return { type: "action", actions };
  }

  if (response.includes(FINAL_ANSWER_PREFIX)) {
    const finalAnswerText = response.split(FINAL_ANSWER_PREFIX)[1].trim();
    return { type: "finalAnswer", finalAnswer: finalAnswerText, actions };
  }

  return { type: "unstructuredResponse", content: response, actions };
};

export const MrklAgent = async (
  {
    tools,
    role,
    goal,
    backstory,
    children: question,
    maxIterations = MAX_ITERATIONS_DEFAULT,
  }: MrklAgentProps,
  { render, logger }: AI.ComponentContext
): Promise<AI.Node> => {
  let finalAnswer = "";
  let iteration = 0;
  let scratchPad = `${question}\n`;

  while (!finalAnswer && iteration < maxIterations) {

    // TODO: add support to chat completions to get access to better models
    const llmResponse = await render(
      <Completion stop={[OBSERVATION_PREFIX]}>
        {buildPrompt(tools, role, goal, backstory)}
        {scratchPad}
      </Completion>
    );

    logger.debug({ type: "llmResponse", value: llmResponse });

    try {
      const parsedResponse = parseLlmResponse(llmResponse);

      logger.debug({ type: "parsedResponse", value: parsedResponse });

      if (parsedResponse.type === "action" && parsedResponse.actions) {
        for (const action of parsedResponse.actions) {
          const toolToUse = tools.find((tool) => tool.name === action.tool);

          if (toolToUse) {
            let toolResult = "";

            try {
              toolResult = await toolToUse.callback(action.input);

              logger.debug({ type: "toolResult", value: toolResult });
            } catch (error) {
              console.error(error);
            }
            scratchPad += `${OBSERVATION_PREFIX} ${toolResult}\n`;
          } else {
            scratchPad += `${OBSERVATION_PREFIX} DO NOT REPEAT "${action.tool}"\n`;
          }
        }
      } else if (parsedResponse.type === "finalAnswer") {
        finalAnswer = parsedResponse.finalAnswer!;
        return finalAnswer;
      }
    } catch (error) {
      console.error(error);

      continue;
    }

    iteration++;
  }

  return finalAnswer || "Unable to find an answer within the iteration limit.";
};

export default MrklAgent;
