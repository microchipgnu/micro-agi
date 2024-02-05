import * as AI from "ai-jsx";
import Agent from "../../core/components/agent.js";
import Task from "../../core/components/task.js";
import Team from "../../core/components/team.js";
import { wikipediaSearch } from "../../presets/tools/wikipedia.js";
import Parallel from "../../core/tasks/parallel.js";

const App = async () => {
  return (
    <Team process="sequential">
      <Agent
        role="Paleontologist"
        goal="Provide expert insights on dinosaur biology and evolution"
        backstory="You are a renowned expert in paleontology with years of experience in studying dinosaur fossils.
        Your deep understanding of dinosaur anatomy, behavior, and evolutionary history is crucial for accurate and engaging content."
        agentType="mrkl"
      >
        <Parallel>
          <Task tools={[wikipediaSearch]}>
            Find and collect information about T-Rex. Return a few facts about
            it.
          </Task>
          <Task tools={[wikipediaSearch]}>
            Find and collect information about flying dinosaurs. Return a few
            facts about it.
          </Task>
        </Parallel>
      </Agent>

      <Agent
        role="Science Writer"
        goal="Craft an engaging and informative article about dinosaurs"
        backstory="You have a talent for making complex scientific topics accessible and exciting to a broad audience.
        Your writing skills are essential in translating the expert knowledge into a captivating article."
        agentType="mrkl"
      >
        <Task>
          Write an informative article in the format of Markdown based on the
          Paleontologist research. Get the current context
        </Task>
      </Agent>
    </Team>
  );
};

const renderContext = AI.createRenderContext();
const response = await renderContext.render(<App />);
console.log(response);
