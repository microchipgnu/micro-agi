import * as AI from "ai-jsx";
import Agent from "../../core/components/agent.js";
import Task from "../../core/components/task.js";
import Team from "../../core/components/team.js";
import { writeFile } from "../../presets/tools/filesystem.js";

const App = async () => {
  return (
    <Team process="sequential">
      <Agent
        role="Frontend Developer"
        goal="Build intuitive and responsive user interfaces for web applications"
        backstory="As a skilled Frontend Developer, you specialize in creating visually appealing and user-friendly web interfaces. 
          Your expertise lies in HTML, CSS, JavaScript, and modern frameworks like React or Angular.
          You have a passion for design and a keen eye for detail, ensuring that each interface is not only functional but also aesthetically pleasing."
        agentType="mrkl"
        // model="gpt-4-1106-preview"
        // provider="openai"
        model="mistral"

      >
        <Task>Provide basic HTML code.</Task>
      </Agent>
      <Agent
        role="File System"
        goal="Read, write and delete files"
        backstory="You are a professional file system expert with years of experience in file systems and information retrieval."
        agentType="mrkl"
        model="mistral"
        // model="nousresearch/nous-hermes-2-mixtral-8x7b-dpo"
        // provider="open-router"
      >
        <Task tools={[writeFile]}>
          Get the context from Frontend Developer. Write the code generated to a file.
        </Task>
      </Agent>
    </Team>
  );
};

const renderContext = AI.createRenderContext();
const response = await renderContext.render(<App />);
console.log(response);
