import { ReactNode } from "react";
import { CacheProvider } from "../providers/cache-provider";
import { MessageProvider } from "../providers/messages-providers";
import { TeamProvider } from "../providers/team-provider";
import { Process } from "../types";

const Team: React.FC<{ children: ReactNode }> = (props: {
  children: ReactNode;
}) => {
  const { children } = props;
  return (
    <MessageProvider>
      <CacheProvider>
        <TeamProvider process={Process.Sequential} agents={[]} tasks={[]}>
          {children}
        </TeamProvider>
      </CacheProvider>
    </MessageProvider>
  );
};

export default Team;
