// TODO: this is WIP
import { nanoid } from "nanoid";
import { Tool } from "../../core/agents/mrkl-agent.js";

export const writeFile: Tool = {
  inputDescription:
    'a JSON structure that looks like { "content": "the content to write to the file" }',
  validateInput: (input) => typeof input.content === "string",
  callback: async (input) => {
    const a = await Bun.write(`./${nanoid()}.txt`, input.content);
    return `Wrote content to ./${nanoid()}.txt`;
  },
  name: "writeFile",
  description: "Write a file",
};
