import { ReActSingleInputOutputParser } from "langchain/agents/react/output_parser";
import { Tool } from "../../types";

export const useOutputParser = ({
  tools,
}: {
  tools: Tool[];
}): { parser: ReActSingleInputOutputParser } => {
  return {
    parser: new ReActSingleInputOutputParser({
      toolNames: (tools || []).map((tool) => tool.name),
    }),
  };
};
