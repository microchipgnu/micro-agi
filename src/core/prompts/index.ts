import { PromptTemplate } from "@langchain/core/prompts";

const TaskSlice: string = `
        Begin! This is VERY important to you, your job depends on it!

        Current Task: {input}
        {agent_scratchpad}
    `;

const MemorySlice: string = `
        This is the summary of your work so far:
        {chat_history}
    `;

const RolePlayingSlice: string = `
        You are {role}.
        {backstory}

        Your personal goal is: {goal}
    `;

const ToolsSlice: string = `
        TOOLS:
        ------
        You have access to the following tools:

        {tools}

        To use a tool, please use the exact following format:


        Thought: Do I need to use a tool? Yes
        Action: the action to take, should be one of [{tool_names}]
        Action Input: the input to the action
        Observation: the result of the action


        When you have a response for your task, or if you do not need to use a tool, you MUST use the format:


        Thought: Do I need to use a tool? No
        Final Answer: [your response here]

    `;

const VotingSlice: string = `
        You are working on a crew with your co-workers and need to decide who will execute the task.

        These are your format instructions:
        {format_instructions}

        These are your co-workers and their roles:
        {coworkers}
    `;

const TaskExecutionWithMemoryPrompt = PromptTemplate.fromTemplate(
  RolePlayingSlice + ToolsSlice + MemorySlice + TaskSlice
);

const TaskExecutionPrompt = PromptTemplate.fromTemplate(
  RolePlayingSlice + ToolsSlice + TaskSlice
);

const ConsensunsVotingPrompt = PromptTemplate.fromTemplate(
  RolePlayingSlice + VotingSlice + TaskSlice
);

export {
  TaskExecutionPrompt,
  TaskExecutionWithMemoryPrompt,
  ConsensunsVotingPrompt,
};
