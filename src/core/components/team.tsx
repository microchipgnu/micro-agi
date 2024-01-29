import * as AI from "ai-jsx";

export const TeamContext = AI.createContext({
  process: "sequential",
  agentResults: [] as any[],
});

const _renderTeam = async (
  children: AI.Node,
  renderContext: AI.RenderContext
) => {
  const teamContext = renderContext.getContext(TeamContext);
  const flattened = [children].flat(Infinity as 1);

  for (let index = 0; index < flattened.length; index++) {
    const child = flattened[index];
    if (child) {
      // TODO fix this -- agents need to share context
      // let prevContext = childrenResults?.[index - 1]?.context;

      // // @ts-ignore
      // const cloneChildWithContext = AI.createElement(child.tag, {
      //   // @ts-ignore
      //   ...child.props,
      //   // @ts-ignore
      //   context: flattened?.[index - 1]?.props?.role
      //     ? // @ts-ignore
      //       `${flattened[index - 1].props.role}: ${prevContext}`
      //     : "",
      // }) as AI.Node;

      // console.log(cloneChildWithContext)

      await renderContext.render(child);
    }
  }

  return teamContext.agentResults[teamContext.agentResults.length - 1].result;
};

const Team = async (
  {
    children,
    process = "sequential",
  }: { children?: AI.Node; process?: "sequential" },
  renderContext: AI.RenderContext
): Promise<AI.Node> => {
  return (
    <TeamContext.Provider value={{ process: process, agentResults: [] }}>
      {await _renderTeam(children, renderContext)}
    </TeamContext.Provider>
  );
};

export default Team;
