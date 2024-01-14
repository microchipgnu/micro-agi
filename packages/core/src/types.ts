import { BaseLanguageModel } from "langchain/base_language";
import { Tool as LangchainTool } from "langchain/tools";
import Agent from "./components/agent";

export interface Agent {
  id?: string;
  name?: string;
  role?: string;
  goal?: string;
  backstory?: string;
  llm?: BaseLanguageModel | any | undefined; // TODO: fix this type
  memory?: boolean;
  verbose?: boolean;
  allowDelegation?: boolean;
  tools?: Tool[];
  executeTask?: (task: string, information: string) => any;
}

export type AgentState = Agent;
export type AgentAction =
  | { type: "ADD_TASK"; payload: Task }
  | { type: "REMOVE_TASK"; payload: string };

// =================================================================================

export interface Task {
  id?: string;
  description: string;
  agent?: Agent;
  tools?: Tool[];
  execute?: (context?: string) => Promise<string>;
}

export type TaskState = Task;

export type TaskAction =
  | {
      type: "ADD_TOOL";
      payload: Tool;
    }
  | {
      type: "REMOVE_TOOL";
      payload: Tool;
    };

// =================================================================================

export interface TeamState {
  agents: Agent[];
  tasks: Task[];
  process?: Process;
  verbose?: boolean;
  isRunning?: boolean;
  // cacheHandler?: any;
}

export type TeamAction =
  | { type: "ADD_AGENT"; payload: Agent }
  | { type: "REMOVE_AGENT"; payload: string }
  | { type: "ADD_TASK"; payload: Task }
  | {
      type: "SET_TASK_TOOLS";
      payload: {
        taskId: string;
        tools: Tool[];
      };
    }
  | { type: "REMOVE_TASK"; payload: string }
  | { type: "PROCESS_TASK"; payload: Task }
  | { type: "START"; payload: null }
  | { type: "STOP"; payload: null };

export enum Process {
  Sequential,
  Parallel,
}

export type Tool = LangchainTool;

export interface AgentToolsContextProps {
  delegateWork: (command: string, agents: Agent[]) => any;
  askQuestion: (command: string, agents: Agent[]) => any;
  tools: (agents: Agent[]) => Tool[];
}

export type Message = {
  message: string;
  type: "error" | "info" | "success" | "warning";
};

export interface MessageState {
  messages?: Message[];
}

export type MessageAction = {
  type: "ADD_MESSAGE";
  payload: Message;
};
