import * as AI from "ai-jsx";
import Agent from "./agent.js";
import { internalDelegateWork } from "../tools/agent-tools.js";
import Parallel from "../tasks/parallel.js";

export const TeamContext = AI.createContext({
  process: "sequential",
  agentResults: [] as any[],
  getAgents: (): string => "",
});

const SequentialTeam = async (
  { children }: { children?: AI.Node },
  renderContext: AI.RenderContext
): Promise<AI.Node> => {
  const teamContext = renderContext.getContext(TeamContext);
  const flattened = [children].flat(Infinity as 1);


  for (let index = 0; index < flattened.length; index++) {
    const child = flattened[index] as any;

    if (child /*TODO: && child.tag === Agent*/) {
      await renderContext.render(child);
    } else if (child && child.tag === Parallel) { // TODO: Parallel won't work
      await Promise.all(
        child.props.children.map(async (child: any) => {
          return await renderContext.render(child);
        })
      );
    } else {
      throw new Error("Agent not found");
    }
  }

  return JSON.stringify(teamContext);
};

const Team = async (
  {
    children,
    process = "sequential",
  }: { children?: AI.Node; process?: "sequential" | "hierarchical" },
  renderContext: AI.RenderContext
): Promise<AI.Node> => {
  let teamContext = {
    process: process,
    agentResults: [],
    getAgents: (): string => {
      const agents = [];
      const flattened = [children].flat(Infinity as 1);

      for (let index = 0; index < flattened.length; index++) {
        const child = flattened[index] as any; // TODO: fix type
        if (child && child.tag === Agent) {
          agents.push(child);
        }
      }

      return agents
        .map((agent) => {
          return agent.props.role;
        })
        .join(", ");
    },
  };

  const _renderHierarchicalTeam = async (
    children: AI.Node,
    renderContext: AI.RenderContext
  ) => {
    throw new Error("Hierarchical team not yet implemented");
  };

  return renderContext.render(
    <TeamContext.Provider value={teamContext}>
      {process === "sequential" && <SequentialTeam>{children}</SequentialTeam>}
      {process === "hierarchical" &&
        (await _renderHierarchicalTeam(children, renderContext))}
    </TeamContext.Provider>
  );
};

export default Team;
