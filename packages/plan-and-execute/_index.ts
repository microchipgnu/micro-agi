import { Calculator } from "langchain/tools/calculator";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PlanAndExecuteAgentExecutor } from "langchain/experimental/plan_and_execute";

const tools = [new Calculator()];
const model = new ChatOpenAI({
  temperature: 0,
  modelName: "gpt-3.5-turbo",
  openAIApiKey: "not-needed",
  configuration: { baseURL: "http://localhost:42069/v1" },
  verbose: true,
});
const executor = await PlanAndExecuteAgentExecutor.fromLLMAndTools({
  llm: model,
  tools,
});

const result = await executor.invoke({
  input: `How to find the square root of 9?`,
});

console.log({ result });
