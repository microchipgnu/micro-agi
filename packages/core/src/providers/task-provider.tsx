import { nanoid } from "nanoid";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { TaskAction, TaskState } from "../types";
import { useAgent } from "./agent-provider";

const TaskContext = createContext<
  | {
      state: TaskState;
      dispatch: React.Dispatch<TaskAction>;
    }
  | undefined
>(undefined);

const TaskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    default:
      return state;
  }
};

const getInitialState = (): TaskState => {
  return {
    description: "",
    tools: [],
    execute: async () => {
      return "";
    },
    agent: undefined,
    id: nanoid(),
  };
};

export const TaskProvider: React.FC<TaskState & { children: ReactNode }> = (
  props: TaskState & { children: ReactNode }
) => {
  const { children, ...restProps } = props;

  const _initialState = { ...getInitialState(), ...restProps };

  const [state, dispatch] = useReducer(TaskReducer, {
    ..._initialState,
  });

  const { addTask, removeTask, state: agentState } = useAgent();

  useEffect(() => {
    addTask({
      ...state,
      agent: agentState,
    });

    return () => {
      if (!state.id) return;
      removeTask(state.id);
    };
  }, []);

  return (
    <TaskContext.Provider value={{ state, dispatch }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = (): {
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
} => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("Please wrap your component within a TaskProvider, AgentProvider and TeamProvider.");
  }
  return context;
};
