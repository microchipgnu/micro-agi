import { z } from "zod";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  AgentExecutor,
  StructuredChatOutputParserWithRetries,
} from "langchain/agents";
import { Calculator } from "langchain/tools/calculator";
import { DynamicStructuredTool } from "langchain/tools";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  PromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import { renderTextDescriptionAndArgs } from "langchain/tools/render";
import { RunnableSequence } from "langchain/schema/runnable";
import { AgentStep } from "langchain/schema";
import { formatLogToString } from "langchain/agents/format_scratchpad/log";

const model = new ChatOpenAI({
  temperature: 0,
  modelName: "gpt-4",
  configuration: {
    baseURL: "http://localhost:42069/v1",
  },
}).bind({
  stop: ["\nObservation:"],
});

const tools = [
  new Calculator(),
  new DynamicStructuredTool({
    name: "random-number-generator",
    description: "generates a random number between two input numbers",
    schema: z.object({
      low: z.number().describe("The lower bound of the generated number"),
      high: z.number().describe("The upper bound of the generated number"),
    }),
    func: async ({ low, high }) =>
      (Math.random() * (high - low) + low).toString(),
    returnDirect: false,
  }),
];
const toolNames = tools.map((tool) => tool?.name);

const PREFIX = `Answer the following questions truthfully and as best you can.`;
const AGENT_ACTION_FORMAT_INSTRUCTIONS = `Output a JSON markdown code snippet containing a valid JSON blob (denoted below by $JSON_BLOB).
This $JSON_BLOB must have a "action" key (with the name of the tool to use) and an "action_input" key (tool input).

Valid "action" values: "Final Answer" (which you must use when giving your final response to the user), or one of [{tool_names}].

The $JSON_BLOB must be valid, parseable JSON and only contain a SINGLE action. Here is an example of an acceptable output:

\`\`\`json
{{
  "action": $TOOL_NAME,
  "action_input": $INPUT
}}
\`\`\`

Remember to include the surrounding markdown code snippet delimiters (begin with "\`\`\`" json and close with "\`\`\`")!
`;
const FORMAT_INSTRUCTIONS = `You have access to the following tools.
You must format your inputs to these tools to match their "JSON schema" definitions below.

"JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.

For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}}}
would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.

Here are the JSON Schema instances for the tools you have access to:

{tool_schemas}

The way you use the tools is as follows:

------------------------

${AGENT_ACTION_FORMAT_INSTRUCTIONS}

If you are using a tool, "action_input" must adhere to the tool's input schema, given above.

------------------------

ALWAYS use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action:
\`\`\`json
$JSON_BLOB
\`\`\`
Observation: the result of the action
... (this Thought/Action/Observation can repeat N times)
Thought: I now know the final answer
Action:
\`\`\`json
{{
  "action": "Final Answer",
  "action_input": "Final response to human"
}}
\`\`\``;
const SUFFIX = `Begin! Reminder to ALWAYS use the above format, and to use tools if appropriate.`;
const inputVariables = ["input", "agent_scratchpad"];
const template = [
  PREFIX,
  FORMAT_INSTRUCTIONS,
  SUFFIX,
  `Thoughts: {agent_scratchpad}`,
].join("\n\n");
const humanMessageTemplate = "{input}";
const messages = [
  new SystemMessagePromptTemplate(
    new PromptTemplate({
      template,
      inputVariables,
      partialVariables: {
        tool_schemas: renderTextDescriptionAndArgs(tools),
        tool_names: toolNames.join(", "),
      },
    })
  ),
  new HumanMessagePromptTemplate(
    new PromptTemplate({
      template: humanMessageTemplate,
      inputVariables,
    })
  ),
];
const prompt = ChatPromptTemplate.fromMessages(messages);

const outputParser = StructuredChatOutputParserWithRetries.fromLLM(
  new ChatOpenAI({
    temperature: 0,
    configuration: {
      baseURL: "http://localhost:42069/v1",
    },
    modelName: "gpt-4",
  }),
  {
    toolNames,
  }
);

const runnableAgent = RunnableSequence.from([
  {
    input: (i: { input: string; steps: AgentStep[] }) => i.input,
    agent_scratchpad: (i: { input: string; steps: AgentStep[] }) =>
      formatLogToString(i.steps),
  },
  prompt,
  model,
  outputParser,
]);

const executor = AgentExecutor.fromAgentAndTools({
  agent: runnableAgent,
  tools,
  verbose: true,
});

console.log("Loaded agent.");
const input = `Pick a number between 1 and 10.`;
console.log(`Executing with input "${input}"...`);
const result = await executor.invoke({ input });
console.log(result);
console.log("RESULT ", result?.output);
