import Elysia from "elysia";
import { ChatOllama } from "langchain/chat_models/ollama";
import { OllamaFunctions } from "langchain/experimental/chat_models/ollama_functions";
import { HumanMessage } from "langchain/schema";
import { StringOutputParser } from "langchain/schema/output_parser";
import { DynamicStructuredTool, formatToOpenAIFunction } from "langchain/tools";
import { z } from "zod";

const BASE_URL = "http://localhost:11434";
const MODEL = "mistral";

let db = {} as Record<string, string>;

const run = async (input: string) => {
  const tools = [
    new DynamicStructuredTool({
      name: "random_number_generator",
      description: "generates a random number between two input numbers",
      schema: z.object({
        low: z.number().describe("The lower bound of the generated number"),
        high: z.number().describe("The upper bound of the generated number"),
      }),
      func: async ({ low, high }) =>
        (Math.random() * (high - low) + low).toString(),
      returnDirect: false,
    }),
    new DynamicStructuredTool({
      name: "store_db",
      description: "stores value to key db",
      schema: z.object({
        key: z.string().describe("the key"),
        value: z.string().describe("the value"),
      }),
      func: async ({ key, value }) => {
        db = { ...db, [key]: value };

        return "";
      },

      returnDirect: false,
    }),
    new DynamicStructuredTool({
      name: "read_db",
      description: "get data from db",
      schema: z.object({
        key: z.string().describe("the key"),
      }),
      func: async ({ key }) => {
        return "";
      },

      returnDirect: false,
    }),
  ];

  const functionsModel = new OllamaFunctions({
    temperature: 0.1,
    model: MODEL,
    baseUrl: BASE_URL,
  }).bind({
    functions: [
      ...tools.map((tool) => formatToOpenAIFunction(tool)),
      {
        name: "get_current_weather",
        description: "Get the current weather in a given location",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state, e.g. San Francisco, CA",
            },
            unit: { type: "string", enum: ["celsius", "fahrenheit"] },
          },
          required: ["location"],
        },
      },
    ],
  });

  const functionResponse = await functionsModel.invoke([
    new HumanMessage({
      content: input,
    }),
  ]);

  const functionName = functionResponse.additional_kwargs.function_call?.name;
  const functionArgs =
    functionResponse.additional_kwargs.function_call?.arguments;

  let executionResponse = undefined;

  if (functionName === "random_number_generator" && functionArgs) {
    const { low, high } = JSON.parse(functionArgs);
    executionResponse = Math.floor(Math.random() * (high - low + 1) + low);
  } else if (functionName === "get_current_weather" && functionArgs) {
    const { location, unit = "celcius" } = JSON.parse(functionArgs);

    executionResponse = Math.floor(Math.random() * (50 - -10 + 1) - 10);
  } else if (functionName === "store_db" && functionArgs) {
    const { key, value } = JSON.parse(functionArgs);

    db = { ...db, [key]: value };

    executionResponse = `key: ${key}, value: ${value}`;
  } else if (functionName === "read_db" && functionArgs) {
    const { key } = JSON.parse(functionArgs);

    const value = Object.keys(db).length > 0 ? db[key] : "";

    executionResponse = `key: ${key}, value: ${value}`;
  }

  const chatModel = new ChatOllama({
    baseUrl: BASE_URL,
    model: MODEL,
    temperature: 0.1,
  });

  const stream = await chatModel
    .pipe(new StringOutputParser())
    .stream(
      `The user input is You just ran a function called ${functionName}, the inputs where ${functionArgs} and the result was ${executionResponse}. Explain this in few words.`
    );

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return {
    explanation: chunks.join(""),
    execution: executionResponse,
  };
};

const app = new Elysia()
  .get("/:id", async (req) => {
    const { id } = req.params;
    const input = id.split("+").join(" ");
    const { execution, explanation } = await run(input);

    return Response.json({
      input,
      execution,
      explanation,
    });
  })
  .get("/db", async (req) => {
    return Response.json({
      db,
    });
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
