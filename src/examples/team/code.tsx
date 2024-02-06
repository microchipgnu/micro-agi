import * as AI from "ai-jsx";
import Agent from "../../core/components/agent.js";
import Task from "../../core/components/task.js";
import Team from "../../core/components/team.js";
import { Multimodal } from "../multimodal/index.js";
import { askUser } from "../../presets/tools/index.js";

const App = async () => {
  return (
    <Team process="sequential">
      <Agent
        role="Business Analyst"
        goal="Ask the user information about their desired product"
        backstory="You are an experienced business analyst and will ask the user to provide information about their business"
        agentType="mrkl"
      >
        <Task tools={[askUser]}>
          Ask the user to provide information about their business.
        </Task>
      </Agent>
      <Agent
        role="Front-End Developer"
        goal="Craft an engaging and intuitive user interface"
        backstory="Specializing in front-end technologies, you bring designs to life with your skills in HTML, CSS, and JavaScript. Your focus is on creating a responsive and visually appealing interface that provides an excellent user experience."
        agentType="mrkl"
      >
        <Task>
          Create HTML code for a simple landing page. You don't need to open an
          IDE, simply output the website code, nothing more than that. Base your
          code on the Business Analyst information
        </Task>
      </Agent>
    </Team>
  );
};

const renderContext = AI.createRenderContext();
const response = await renderContext.render(<App />);
console.log(response);
