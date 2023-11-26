import { chatWithAI } from "./chat";
import { executeCommand } from "../command-plugins/index";
import { generatePrompt } from "./prompt-v2";
import { permanentMemory } from "../command-plugins/memory-command-plugins";
import type { AIResponseSchema, LLMMessage, LLMModel } from "./types";
import {
  addThoughtArgsToSchema,
  getFunctionSchema,
} from "./functions-schema";
import {
  CallLLMChatCompletionResponse,
  CallLLMChatCompletionResponseStatus,
} from "./llm-utils";
import { Activity } from "../types";

let USER_INPUT = "Determine which function to call.";

const generateId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

async function autoGPT() {
  let fullMessageHistory: LLMMessage[] = [];
  let userInput: string = USER_INPUT;
  let isChatInProgress: boolean = false;
  let prevMessageIndexRan: number = -1;
  let currMessageIndex: number = 0;
  let taskCompleted = false;

  let activities: Activity[] = [];

  const appendToFullMessageHistory = (messages: LLMMessage[]) =>
    fullMessageHistory.push(...messages);

  const setActivity = (activity: Activity) => {
    activities.push(activity);
  };

  const processCommand = async (
    assistantReply: CallLLMChatCompletionResponse
  ) => {
    let commandName: string = "error";
    let args: string | { [key: string]: string } = {};
    let rawParsedResponse: AIResponseSchema | undefined = undefined;

    console.log("assistantReply", assistantReply);

    try {
      if (
        assistantReply.status === CallLLMChatCompletionResponseStatus.Success
      ) {
        commandName = assistantReply.functionCall?.name ?? "error";
        args = assistantReply.functionCall?.arguments ?? {};
        rawParsedResponse = {
          command: {
            name: assistantReply.functionCall?.name!,
            args: assistantReply.functionCall?.arguments || {},
          },
          thoughts: {
            reasoning: assistantReply.functionCall?.arguments["_reasoning"],
            criticism: assistantReply.functionCall?.arguments["_criticism"],
            plan: assistantReply.functionCall?.arguments["_plan"],
            text: assistantReply.functionCall?.arguments["_thought"],
          },
        };
      }
    } catch (error) {
      console.error("Error when getting command", error);
    }

    USER_INPUT = `GENERATE NEXT FUNCTION`;

    let result: string;
    if (commandName.toLowerCase() != "error" && typeof args !== "string") {
      if (rawParsedResponse) {
        if (
          rawParsedResponse["command"] &&
          rawParsedResponse["command"]["name"] == "write_to_file" &&
          !!rawParsedResponse["command"]["args"]["file"] &&
          /\.(js|py)$/.test(rawParsedResponse["command"]["args"]["file"])
        ) {
          setActivity({
            type: "chat:command:code",
            response: rawParsedResponse,
            code: rawParsedResponse["command"]["args"]["text"],
            id: generateId(),
          });
        } else if (
          rawParsedResponse["command"] &&
          (rawParsedResponse["command"]["name"] === "evaluate_code" ||
            rawParsedResponse["command"]["name"] === "improve_code" ||
            rawParsedResponse["command"]["name"] === "write_tests") &&
          !!rawParsedResponse["command"]["args"]["code"]
        ) {
          setActivity({
            type: "chat:command:code",
            response: rawParsedResponse,
            code: rawParsedResponse["command"]["args"]["code"],
            id: generateId(),
          });
        } else if (rawParsedResponse["thoughts"]) {
          setActivity({
            type: "chat:command",
            response: rawParsedResponse,
            id: generateId(),
          });
        }
      }

      const executedCommandResponse = await executeCommand(commandName, args);

      setActivity({
        type: "chat:command:executed",
        executionResponse: executedCommandResponse,
        id: generateId(),
      });

      result = `Command ${commandName} returned: ${executedCommandResponse}`;
    } else {
      result = `Command ${commandName} threw the following error: ${args}`;

      setActivity({
        type: "chat:command:error",
        error: "Error when getting command",
        id: generateId(),
      });
    }

    appendToFullMessageHistory([
      {
        role: "user",
        content: result,
      },
    ]);

    if (commandName === "task_complete") {
      taskCompleted = true;
    } else {
      isChatInProgress = false;
      taskCompleted = false;
      currMessageIndex++;
    }
  };

  while (!taskCompleted) {
    if (isChatInProgress || prevMessageIndexRan === currMessageIndex) {
      continue; // Skip iteration if chat is in progress or no new input
    }

    isChatInProgress = true;
    prevMessageIndexRan = currMessageIndex;

    setActivity({
      type: "system:info",
      prompt: "Generating next command",
      id: generateId(),
    });

    const assistantReply = await chatWithAI({
      prompt: generatePrompt(
        "MarketTrendGPT",
        `An AI designed to help businesses make informed decisions. ALWAYS respond in JSON format. Follow this ${JSON.stringify(addThoughtArgsToSchema(getFunctionSchema()))}`,
        ["Discover the latest trends in AI"]
      ),
      fullMessageHistory,
      permanentMemory,
      tokenLimit: 5000,
      model: "gpt-3.5-turbo",
      userInput,
      debug: false,
      appendToFullMessageHistory,
      functions: addThoughtArgsToSchema(getFunctionSchema()),
    });

    await processCommand(assistantReply);
  }
}

export { autoGPT };
