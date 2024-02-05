export const internalDelegateWork = (teamContext: any) => ({
  name: "internalDelegateWork",
  description: "Delegate work to co-worker",
  inputDescription: `Useful to delegate a specific task to one of the following co-workers: ${teamContext.agents.join(
    ", "
  )}.\nThe input to this tool should be a pipe (|) separated text of length 3 (three), representing the co-worker you want to ask it to (one of the options), the task and all actual context you have for the task.\nFor example, "coworker|task|context".`,
  callback: async () => {
    console.log(teamContext);
  },
});

export const internalAskQuestion = {
  name: "internalAskQuestion",
  description: "Ask question to co-worker",
  inputDescription: "",
  callback: async (input: { question: string }) => {},
};
