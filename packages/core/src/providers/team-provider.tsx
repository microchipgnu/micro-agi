import { Tool } from "langchain/tools";
import React, { ReactNode, createContext, useContext, useReducer } from "react";
import { Agent, Process, Task, TeamAction, TeamState } from "../types";
import { useMessage } from "./messages-providers";
import { useAgentTools } from "../hooks/tools/agent-tools";

const TeamContext = createContext<
  | {
      state: TeamState;
      dispatch: React.Dispatch<TeamAction>;
      addTask: (task: Task) => void;
      removeTask: (taskId: string) => void;
      setTaskTools: (taskId: string, tools: Tool[]) => void;
      processTask: (task: Task, context?: string) => Promise<string>;
      addAgent: (agent: Agent) => void;
      removeAgent: (agentId: string) => void;
      kickoff: () => Promise<void>;
    }
  | undefined
>(undefined);

const TeamReducer = (state: TeamState, action: TeamAction): TeamState => {
  switch (action.type) {
    case "PROCESS_TASK": {
      const task = action.payload;

      if (!task) {
        return state;
      }

      if (task.execute) {
        task.execute();
      }

      return state;
    }
    case "SET_TASK_TOOLS": {
      const _tools = action.payload.tools;
      const _task = state.tasks.find((t) => t.id === action.payload.taskId);

      if (!_task) {
        return state;
      }

      if (_task) {
        _task.tools = _tools;
      }

      return {
        ...state,
        tasks: [...state.tasks, _task],
      };
    }
    case "ADD_TASK": {
      const task = action.payload;

      return { ...state, tasks: [...state.tasks, task] };
    }
    case "REMOVE_TASK": {
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
      };
    }
    case "ADD_AGENT": {
      const agent = action.payload;

      return { ...state, agents: [...state.agents, agent] };
    }
    case "REMOVE_AGENT": {
      const agentId = action.payload;

      return {
        ...state,
        agents: state.agents.filter((agent) => agent.id !== agentId),
      };
    }
    case "START": {
      return {
        ...state,
        isRunning: true,
      };
    }
    case "STOP": {
      return {
        ...state,
        isRunning: false,
      };
    }
    default:
      return state;
  }
};

const initialState: TeamState = {
  agents: [],
  tasks: [],
};

export const TeamProvider: React.FC<TeamState & { children: ReactNode }> = (
  props: TeamState & { children: ReactNode }
) => {
  const {
    children,
    process = Process.Sequential,
    verbose = false,
    agents,
    tasks: initialTasks = [],
  } = props;

  const [state, dispatch] = useReducer(TeamReducer, {
    ...initialState,
    process,
    verbose,
    agents,
    tasks: initialTasks,
  });

  const { tools } = useAgentTools({ agents: state.agents || [] });
  const { addMessage } = useMessage();

  const addTask = (task: Task) => {
    dispatch({ type: "ADD_TASK", payload: task });
  };

  const removeTask = (taskId: string) => {
    dispatch({ type: "REMOVE_TASK", payload: taskId });
  };

  const setTaskTools = (taskId: string, tools: Tool[]) => {
    dispatch({
      type: "SET_TASK_TOOLS",
      payload: {
        taskId,
        tools,
      },
    });
  };

  const addAgent = (agent: Agent) => {
    dispatch({ type: "ADD_AGENT", payload: agent });
  };

  const removeAgent = (agentId: string) => {
    dispatch({ type: "REMOVE_AGENT", payload: agentId });
  };

  const processTask = async (task: Task, context?: string) => {
    try {
      if (task.agent && task.agent.executeTask !== undefined) {
        dispatch({ type: "PROCESS_TASK", payload: task });
        const result = await task.agent.executeTask(
          task.description,
          context || ""
        );
        return result;
      }
      return "";
    } catch (e) {
      throw e;
    }
  };

  const _processTasksSequentially = async (tasks: Task[]) => {
    let taskOutcome: string = "";
    if (tasks?.length) {
      for (const task of tasks) {
        if (task.agent && task.agent.allowDelegation) {
          const agentTools = tools();

          if (task.id) {
            setTaskTools(task.id, [...(task.tools || []), ...agentTools]);
          }
        }

        if (task.agent && task.agent.executeTask !== undefined) {
          addMessage({
            message: `Working Agent: ${task.agent.role}`,
            type: "warning",
          });
          addMessage({
            message: `Starting Task: ${task.description}`,
            type: "warning",
          });
          try {
            taskOutcome = await processTask(task, taskOutcome);
          } catch (e) {
            addMessage({
              message: `${e}`,
              type: "error",
            });

            dispatch({ type: "STOP", payload: null });
            break;
          }
        }
      }
    }

    dispatch({ type: "STOP", payload: null });
    addMessage({ message: `Task Outcome: ${taskOutcome}`, type: "info" });
    return taskOutcome;
  };

  const kickoff = async () => {
    if (state.isRunning) return;

    if (process === Process.Sequential) {
      dispatch({ type: "START", payload: null });
      await _processTasksSequentially(state.tasks);
    }
  };

  return (
    <TeamContext.Provider
      value={{
        state,
        dispatch,
        addTask,
        removeTask,
        setTaskTools,
        processTask,
        addAgent,
        removeAgent,
        kickoff,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = (): {
  state: TeamState;
  dispatch: React.Dispatch<TeamAction>;
  addTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  setTaskTools: (taskId: string, tools: Tool[]) => void;
  processTask: (task: Task, context?: string) => Promise<string>;
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  kickoff: () => Promise<void>;
} => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
};
