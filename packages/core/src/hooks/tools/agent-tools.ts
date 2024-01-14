import { DynamicTool } from "@langchain/community/tools/dynamic";
import { Agent } from "../../types";

const getDelegateWorkDescription = (coworkerNames: string) => `
Useful to delegate a specific task to one of the following co-workers: [${coworkerNames}].
The input to this tool should be a pipe (|) separated text of length three, representing the role you want to delegate it to, the task, and information necessary. For example, 'coworker|task|information'.
`;

const getAskQuestionDescription = (coworkerNames: string) => `
Useful to ask a question, opinion or take from one of the following co-workers: [${coworkerNames}].
The input to this tool should be a pipe (|) separated text of length three, representing the role you want to ask it to, the question, and information necessary. For example, 'coworker|question|information'.
`;

export const useAgentTools = ({ agents }: { agents: Agent[] }) => {
  const tools = () => {
    const coworkerNames = agents.map((agent) => agent.role).join(", ");

    return [
      new DynamicTool({
        name: "Delegate Work to Co-Worker",
        description: getDelegateWorkDescription(coworkerNames),
        func: async (command: string) => {
          return delegateWork(command);
        },
      }),
      new DynamicTool({
        name: "Ask Question to Co-Worker",
        description: getAskQuestionDescription(coworkerNames),
        func: async (command: string) => {
          return askQuestion(command);
        },
      }),
    ];
  };

  const execute = async (command: string): Promise<string> => {
    try {
      const [agentRole, task, information] = command.split("|");
      if (!agentRole || !task || !information) {
        return "Error: Missing values. Format should be `coworker|task|information`.";
      }
      const agent = agents.find((a) => a.role === agentRole);
      if (!agent || !agent.executeTask) {
        return `Error: Co-worker ${agentRole} not found.`;
      }
      return agent.executeTask(task, information);
    } catch (error) {
      return "Error executing command.";
    }
  };

  const delegateWork = async (command: string) => execute(command);
  const askQuestion = async (command: string) => execute(command);

  return { tools, delegateWork, askQuestion };
};
