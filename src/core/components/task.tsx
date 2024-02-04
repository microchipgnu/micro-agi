import * as AI from "ai-jsx";
import { Tool } from "../agents/mrkl-agent.js";
import { AgentContext } from "./agent.js";

export const TaskContext = AI.createContext({
  tools: [] as Tool[],
});

const Task = async (
  { children, tools = [] }: { children?: AI.Node; tools?: Tool[] },
  { render, getContext }: AI.ComponentContext
): Promise<AI.Node> => {
  const agentContext = getContext(AgentContext);
  agentContext.setEphemeralTools(tools);

  let taskContext = {
    tools: tools || [],
  };

  const rendered = (
    <TaskContext.Provider value={taskContext}>
      {await render(children)}
    </TaskContext.Provider>
  );

  return rendered;
};

export default Task;
