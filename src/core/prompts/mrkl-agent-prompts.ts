import { Tool } from "../agents/mrkl-agent.js";

export const ACTION_PREFIX = "Action:";
export const ACTION_INPUT_PREFIX = "Action Input:";
export const OBSERVATION_PREFIX = "Observation:";
export const FINAL_ANSWER_PREFIX = "Final Answer:";
export const THOUGHT_PREFIX = "Thought:";
export const MAX_ITERATIONS_DEFAULT = 100;

export const buildPrompt = (
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
