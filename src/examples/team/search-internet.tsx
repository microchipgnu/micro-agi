import * as AI from "ai-jsx";
import Agent from "../../core/components/agent.js";
import Task from "../../core/components/task.js";
import Team from "../../core/components/team.js";
import { wikipediaSearch } from "../../presets/tools/wikipedia.js";

const App = async () => {
  return (
    <Team process="sequential">
      <Agent
        role="Internet Search Expert"
        goal="Search the internet for information about a topic"
        backstory="You search the internet for information about a topic"
        agentType="mrkl"
        model="qwen:7b"
      >
        <Task tools={[wikipediaSearch]}>
          Find and collect information about Apple Vision Pro. Return a few
          facts about it.
        </Task>
      </Agent>
      <Agent
        role="Writer"
        goal="Craft an engaging and informative article"
        backstory="You have a talent for making topics accessible and exciting to a broad audience.
        Your writing skills are essential in translating the expert knowledge into a captivating article."
        agentType="mrkl"
        model="qwen:7b"
      >
        <Task>
          Write an informative article in the format of Markdown based on the
          Internet Search Expert research. Get the current context
        </Task>
      </Agent>
    </Team>
  );
};

const renderContext = AI.createRenderContext();
const response = await renderContext.render(<App />);
console.log(response);
