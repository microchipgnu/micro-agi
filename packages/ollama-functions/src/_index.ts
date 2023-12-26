import { ChatOllama } from "langchain/chat_models/ollama";
import { StringOutputParser } from "langchain/schema/output_parser";

const model = new ChatOllama({
  baseUrl: "http://localhost:11434", // Default value
  model: "mistral", // Default value
});

const stream = await model
  .pipe(new StringOutputParser())
  .stream(`Translate "I love programming" into German.`);

const chunks = [];
for await (const chunk of stream) {
  chunks.push(chunk);
}

console.log(chunks.join(""));