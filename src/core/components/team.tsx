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
  renderContext: AI.ComponentContext
): Promise<AI.Node> => {
  const teamContext = renderContext.getContext(TeamContext);
  const flattened = [children].flat(Infinity as 1);

  const logger = renderContext.logger;

  for (let index = 0; index < flattened.length; index++) {
    const child = flattened[index] as any; // TODO: fix this

    logger.debug({
      type: "child",
      value: { children: child, tag: child?.tag },
    });

    // TODO: if renderer is AI.JSX in react, child.tag will be undefined
    // Need to think of an alternative way to do this
    if (child && child.tag === Agent) {
      await renderContext.render(child);
    } else if (child && child.tag === Parallel) {
      await Promise.all(
        child.props.children.map(async (child: any) => {
          return await renderContext.render(child);
        })
      );
    } else {
      await renderContext.render(child);
    }
  }

  // TODO: this won't work well in React apps for now
  // Converting circular structure to JSON
  //   --> starting at object with constructor 'FiberRootNode'
  //   |     property 'containerInfo' -> object with constructor 'HTMLDivElement'
  //   |     property '__reactContainer$gl6rtz5ryp4' -> object with constructor 'FiberNode'
  //   --- property 'stateNode' closes the circle

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
