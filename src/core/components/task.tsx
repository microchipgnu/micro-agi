import * as AI from "ai-jsx";
import { Tool } from "../agents/mrkl-agent.js";
import { AgentContext } from "./agent.js";

const Task = async (
  { children, tools = [] }: { children?: AI.Node; tools?: Tool[] },
  { render, getContext }: AI.RenderContext
): Promise<AI.Node> => {
  const agentContext = getContext(AgentContext);

  // Add tools
  agentContext.tools = [...agentContext.tools, ...tools];
  
  const rendered = await render(children);
  
  // Remove tools
  // TODO: tools get removed before agent runs
  agentContext.tools = agentContext.tools.filter(
    (tool) => !tools.includes(tool)
  );

  return rendered;
};

export default Task;
