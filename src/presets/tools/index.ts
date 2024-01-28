import readline from "node:readline";

import { Tool } from "../../core/agents/mrkl-agent.js";

export const tools: Tool[] = [
  {
    name: "whatDate",
    description: "use this tool to get the current date",
    callback: async () => {
      return `current date is ${Date.now()}`;
    },
  },
  {
    name: "gpsService",
    description: "get the current location",
    callback: async () => {
      return "location is Portugal";
    },
  },
  {
    name: "weatherForecast",
    description: "get weather forecast for a given date",
    inputDescription:
      'a JSON structure that looks like { "date": "the date for which you need forecast" }',
    callback: async (input: { date: string }) => {
      return `for the ${input.date} the weather is clear !`;
    },
  },
  {
    name: "meaningOf",
    description: "helps you find the meaning of anything",
    inputDescription:
      'a JSON structure that looks  { "key": "what you need help find the meaning of" }',
    callback: async () => {},
  },
  {
    name: "samlltalk",
    description: "generate small talk response to have a nice conversation",
    inputDescription:
      'a JSON structure that looks  { "key": "user\'s question or saying" }',
    callback: async () => {},
  },
];

export const askUser = {
  name: "askUser",
  description: "ask the user a question",
  inputDescription:
    'a JSON structure that looks like { "question": "the question for which you need a response" }',
  callback: async (input: { question: string }) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(`> ${input.question} `, (answer) => {
        rl.close();
        resolve(`Question: ${input.question}. Answer: ${answer}`);
      });
    });
  },
};
