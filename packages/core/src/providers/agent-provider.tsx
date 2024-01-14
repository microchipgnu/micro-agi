import { Ollama } from "@langchain/community/llms/ollama";
import { RunnableSequence } from "@langchain/core/runnables";
import { AgentExecutor } from "langchain/agents";
import { InputValues } from "langchain/memory";
import { renderTextDescription } from "langchain/tools/render";
import { nanoid } from "nanoid";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { useOutputParser } from "../hooks/parsers/use-output-parser";
import { AgentAction, AgentState, Task } from "../types";
import { TaskExecutionPrompt } from "../utils/prompts";
import { useMessage } from "./messages-providers";
import { useTeam } from "./team-provider";
import { formatLogToString } from "langchain/agents/format_scratchpad/log";

const DEFAULT_LLM = new Ollama({
  model: "mistral",
  temperature: 0,
  stop: ["\nObservation:"],
});

const AgentContext = createContext<
  | {
      state: AgentState;
      dispatch: React.Dispatch<AgentAction>;
      addTask: (task: Task) => void;
      removeTask: (taskId: string) => void;
    }
  | undefined
>(undefined);

const AgentReducer = (state: AgentState, action: AgentAction): AgentState => {
  switch (action.type) {
    default:
      return state;
  }
};

const getInitialState = (): AgentState => {
  return {
    executeTask: async (task: string, information: string) => {
      return task;
    },
    allowDelegation: false,
    backstory: "",
    goal: "",
    id: nanoid(),
    llm: DEFAULT_LLM,
    memory: false,
    name: "",
    role: "",
    tools: [],
    verbose: false,
  };
};

export const AgentProvider: React.FC<AgentState & { children: ReactNode }> = (
  props: AgentState & { children: ReactNode }
) => {
  const { children, ...restProps } = props;

  const _initialState = { ...getInitialState(), ...restProps };

  const [state, dispatch] = useReducer(AgentReducer, {
    ..._initialState,
    executeTask: async (task: string, information: string) => {
      try {
        const toolNames = (state.tools || []).map((tool) => tool.name);

        const executionPrompt = await TaskExecutionPrompt.partial({
          goal: state.goal || "no goal",
          role: state.role || "no role",
          backstory: state.backstory || "no backstory",
          tool_names: toolNames.join(", "),
          // @ts-ignore
          // TODO: fix this
          tools: renderTextDescription(state.tools || []),
        });

        // @ts-ignore
        // TODO: fix this
        const runnable = RunnableSequence.from([
          {
            input: (i: InputValues) => i.input,
            agent_scratchpad: (i: InputValues) => formatLogToString(i.steps),
          },
          executionPrompt,
          state.llm || DEFAULT_LLM,
          parser,
        ]);

        const agentExecutor = AgentExecutor.fromAgentAndTools({
          // @ts-ignore
          // TODO: fix this
          agent: runnable,
          // @ts-ignore
          // TODO: fix this
          tools: state.tools || [],
          verbose: state.verbose || false,
          handleParsingErrors: `Check you output and make sure it conforms! Do not output an "Action Input:" and a "Final Answer:" at the same time`,
          returnIntermediateSteps: true,
        });

        let _task = "";
        if (information) {
          _task = `
          ${task}
  
          This is the context you are working with:
          ${information}
        `;
        } else {
          _task = task;
        }

        const _output = await agentExecutor?.invoke({
          input: _task,
          tool_names: toolNames.join(", "),
          // @ts-ignore
          // TODO: fix this
          tools: renderTextDescription(state.tools || []),
        });

        addMessage({
          message: `Agent output: ${JSON.stringify(_output.output)}`,
          type: "info",
        });

        return _output.output;
      } catch (e) {
        throw e;
      }
    },
  });

  const { addAgent, removeAgent, dispatch: dispatchTeam } = useTeam();
  const { addMessage } = useMessage();
  // @ts-ignore
  // TODO: fix this
  const { parser } = useOutputParser({ tools: state.tools || [] });

  useEffect(() => {
    addAgent({
      ...state,
    });

    return () => {
      if (!state.id) return;
      removeAgent(state.id);
    };
  }, []);

  const addTask = (task: Task) =>
    dispatchTeam({ type: "ADD_TASK", payload: task });

  const removeTask = (taskId: string) => {
    dispatchTeam({ type: "REMOVE_TASK", payload: taskId });
  };

  return (
    <AgentContext.Provider value={{ state, dispatch, addTask, removeTask }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = (): {
  state: AgentState;
  dispatch: React.Dispatch<AgentAction>;
  addTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
} => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
};
