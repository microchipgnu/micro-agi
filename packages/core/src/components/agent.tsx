import { ReactNode } from "react";
import { AgentProvider } from "../providers/agent-provider";
import { Agent as AgentType } from "../types";

const Agent: React.FC<AgentType & { children?: ReactNode }> = (
  props: AgentType & { children?: ReactNode }
) => {
  const { children, ...restProps } = props;

  return <AgentProvider {...restProps}>{props.children}</AgentProvider>;
};

export default Agent;
