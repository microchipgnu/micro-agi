import { getAPIKey } from "../api-key";
import { constants } from "../envars";
import {
  CallAIFunctionArgs,
  CallLLMChatCompletionArgs,
  CallLLMChatCompletionResponse,
  CallLLMChatCompletionResponseStatus,
  LLMMessage,
} from "../types/llm.types";

export async function callLLMChatCompletion({
  messages,
  functions,
  model,
  temperature,
  maxTokens,
}: CallLLMChatCompletionArgs): Promise<CallLLMChatCompletionResponse> {
  const reqBody = {
    model,
    messages,
    functions,
    function_call: functions ? "auto" : undefined,
    temperature,
    max_tokens: maxTokens,
  };

  const apiKey = getAPIKey();
  const inferenceServer = constants.inferenceServer;
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${apiKey}`);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  const response = await fetch(`${inferenceServer}/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(reqBody),
  });

  if (response.status !== 200) {
    const errorText = await response.text();
    console.error("Error calling OpenAI service", response.status, errorText);
    return {
      status: CallLLMChatCompletionResponseStatus.Error,
      message: `Error calling API with status code ${response.status} and message "${errorText}"`,
    };
  }

  const resBody = await response.json();

  console.log(JSON.stringify(resBody));

  return {
    status: CallLLMChatCompletionResponseStatus.Success,
    content: resBody.choices[0].message.content as string,
    functionCall: resBody.choices[0].message.function_call
      ? {
          name: resBody.choices[0].message.function_call.name,
          arguments: JSON.parse(
            resBody.choices[0].message.function_call.arguments as string
          ),
        }
      : undefined,
  };
}

export async function callAIFunction({
  function: aiFunction,
  args,
  description,
  model,
}: CallAIFunctionArgs): Promise<string> {
  args = args.map((arg) =>
    arg !== null && arg !== undefined ? `${String(arg)}` : "None"
  );
  const argsString = args.join(", ");

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are now the following typescript function: \`\`\`# ${description}\n${aiFunction}\`\`\`\n\nOnly respond with your \`return\` value.`,
    },
    { role: "user", content: argsString },
  ];

  const response = await callLLMChatCompletion({
    messages,
    model,
    temperature: 0.7,
  });

  return response.status === CallLLMChatCompletionResponseStatus.Success
    ? response.content
    : "";
}
