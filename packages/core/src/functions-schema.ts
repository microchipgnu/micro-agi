import { InternalPlugins } from "@micro-agi/plugins";
import { CallLLMChatCompletionArgs } from "./types/llm.types";

let functionSchema: CallLLMChatCompletionArgs["functions"];
export function getFunctionSchema(): Exclude<
  CallLLMChatCompletionArgs["functions"],
  undefined
> {
  if (!functionSchema) {
    functionSchema = InternalPlugins.map((commandPlugin) => ({
      name: commandPlugin.command,
      description: commandPlugin.name,
      parameters: {
        type: "object",
        properties: Object.entries(commandPlugin.argumentsV2.args).reduce(
          (params, [key, arg]) => {
            // @ts-ignore
            // TODO: fix
            params[key] = { ...arg };
            return params;
          },
          {} as any
        ),
      },
    }));
  }

  return functionSchema;
}

export function addThoughtArgsToSchema(
  functions: Exclude<CallLLMChatCompletionArgs["functions"], undefined>
) {
  return functions.map((func) => {
    return {
      ...func,
      parameters: {
        ...func.parameters,
        properties: {
          _thought: {
            type: "string",
            description: "Thought",
          },
          _reasoning: {
            type: "string",
            description: "Reasoning for thought",
          },
          _plan: {
            type: "string",
            description:
              "<ul><li>short bulleted</li><li>list that conveys</li><li>long-term plan</li></ul>",
          },
          _criticism: {
            type: "string",
            description: "constructive self-criticism",
          },
          ...func.parameters.properties,
        },
      },
    };
  });
}
