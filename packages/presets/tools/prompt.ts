import { DynamicTool } from "langchain/tools";

const Prompt = (input: string) => {
  return new DynamicTool({
    name: "prompt",
    description: `A prompt box is a dialog that appears on a web page, requesting the user to enter a value.`,
    func: async () => {
      let _input = prompt(input, "Placeholder");
      let response;
      if (_input == null || _input == "") {
        response = "User cancelled the prompt.";
      } else {
        response = _input;
      }

      return `
        Question: "${input}"?
        Answer: "${response}" 
      `;
    },
  });
};

export default Prompt;
