export interface CallAIFunctionArgs {
  function: string;
  args: any[];
  description: string;
  model: LLMModel;
}

export interface CallLLMChatCompletionArgs {
  messages: LLMMessage[];
  model: LLMModel;
  functions?: {
    name: string;
    description: string;
    parameters: { [key: string]: any };
  }[];
  temperature?: number;
  maxTokens?: number;
}

export enum CallLLMChatCompletionResponseStatus {
  Success,
  Error,
}
export interface CallLLMChatCompletionResponseSuccess {
  status: CallLLMChatCompletionResponseStatus.Success;
  content: string;
  functionCall?: {
    name: string;
    arguments: { [key: string]: any };
  };
}

export interface CallLLMChatCompletionResponseError {
  status: CallLLMChatCompletionResponseStatus.Error;
  message: string;
}

export type CallLLMChatCompletionResponse =
  | CallLLMChatCompletionResponseSuccess
  | CallLLMChatCompletionResponseError;


export interface AIResponseSchema {
    command: {
      name: string;
      args: { [key: string]: string };
    };
    thoughts: {
      text: string;
      reasoning: string;
      plan: string;
      criticism: string;
    };
  }
  
  export type ResponseSchema = "YAML" | "JSON";
  
  export type LLMMessage =
    | { role: "system"; content: string }
    | { role: "assistant"; content: string }
    | { role: "user"; content: string }
    | { role: "function"; content: string; name: string };
  
  export type LLMModel =
    | "gpt-3.5-turbo"
    | "gpt-3.5-turbo-0301"
    | "gpt-3.5-turbo-16k"
    | "gpt-4"
    | "gpt-4-32k"
    | "gpt-4-1106-preview"
  
  export interface AutoGPTConfig {
    models: {
      mainLoopModel: LLMModel;
      schemaFixingModel: LLMModel;
      plugins: {
        agentModel: LLMModel;
        browserModel: LLMModel;
        codeCreationModel: LLMModel;
      };
    };
  }
  