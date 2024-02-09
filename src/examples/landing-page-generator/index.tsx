import * as AI from "ai-jsx";
import Agent from "../../core/components/agent.js";
import Task from "../../core/components/task.js";
import Team from "../../core/components/team.js";
import { searchInternetTool } from "../../presets/tools/search-internet.js";

const App = async () => {
  return (
    <Team process="sequential">
      <Agent
        role="Senior Idea Analyst"
        goal="Understand and expand upon the essence of ideas, make sure they are great and focus on real pain points other could benefit from."
        backstory="Recognized as a thought leader, I thrive on refining concepts into campaigns that resonate with audiences"
        agentType="mrkl"
      >
        <Task tools={[searchInternetTool]}>
        THIS IS A GREAT IDEA! Analyze and expand it 
        by conducting a comprehensive research.
    
        Final answer MUST be a comprehensive idea report 
        detailing why this is a great idea, the value 
        proposition, unique selling points, why people should 
        care about it and distinguishing features. 
    
        IDEA: 
        ----------

        landing page for shampoo
        </Task>
      </Agent>
      {/* <Agent
        role="Senior Communications Strategist"
        goal="Craft compelling stories using the Golden Circle method to captivate and engage people around an idea."
        backstory="A narrative craftsman for top-tier launches, I reveal the 'why' behind projects, aligning with visions and speaking to audiences."
        agentType="mrkl"
      >
        <Task>
          Create HTML code for a simple landing page. You don't need to open an
          IDE, simply output the website code, nothing more than that. Base your
          code on the Business Analyst information
        </Task>
      </Agent> */}
    </Team>
  );
};

const renderContext = AI.createRenderContext();
const response = await renderContext.render(<App />);
console.log(response);
