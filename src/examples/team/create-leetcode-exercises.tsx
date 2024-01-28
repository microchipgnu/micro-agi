import * as AI from "ai-jsx";
import Agent from "../../core/components/agent.js";
import Task from "../../core/components/task.js";
import Team from "../../core/components/team.js";
import { askUser } from "../../presets/tools/index.js";

const App = async () => {
  return (
    <Team>
      <Agent
        role="Problem Designer"
        goal="Create engaging and challenging coding exercises"
        backstory="With a background in competitive programming and software development, 
               you excel at designing problems that test algorithmic thinking and coding skills. 
               You understand the nuances of different programming paradigms and data structures."
      >
        <Task>
          Develop a set of unique coding problems, ranging from easy to hard
          difficulty. Each problem should challenge different aspects of coding,
          such as algorithms, data structures, or logic.
        </Task>
      </Agent>
      <Agent
        role="Solution Architect"
        goal="Develop optimal solutions and explanations for coding exercises"
        backstory="As an experienced software engineer and educator, 
               you have a deep understanding of algorithms and efficiency. 
               You are skilled at explaining complex concepts in a clear, concise manner."
      >
        <Task>
          For each coding problem created by the Problem Designer, develop an
          optimal solution. Write clear explanations and provide a complexity
          analysis for each solution paired with the problem.
        </Task>
      </Agent>
    </Team>
  );
};

const renderContext = AI.createRenderContext();
const response = await renderContext.render(<App />);
console.log(response);
