import * as AI from "ai-jsx";

export const TeamContext = AI.createContext({
  process: "sequential",
  agentResults: [] as any[],
});

const _renderSequentialTeam = async (
  children: AI.Node,
  renderContext: AI.RenderContext
) => {
  const teamContext = renderContext.getContext(TeamContext);
  const flattened = [children].flat(Infinity as 1);

  for (let index = 0; index < flattened.length; index++) {
    const child = flattened[index];
    if (child) {
      await renderContext.render(child);
    }
  }

  return JSON.stringify(teamContext)
};

const Team = async (
  {
    children,
    process = "sequential",
  }: { children?: AI.Node; process?: "sequential" | "parallel" },
  renderContext: AI.RenderContext
): Promise<AI.Node> => {
  const teamContext = renderContext.getContext(TeamContext);

  teamContext.process = process;

  return (
    <TeamContext.Provider value={{ process: process, agentResults: [] }}>
      {process === "sequential" &&
        (await _renderSequentialTeam(children, renderContext))}
    </TeamContext.Provider>
  );
};

export default Team;
