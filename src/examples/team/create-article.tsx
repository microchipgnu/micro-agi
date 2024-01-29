import * as AI from "ai-jsx";
import Agent from "../../core/components/agent.js";
import Task from "../../core/components/task.js";
import Team from "../../core/components/team.js";

const App = async () => {
  return (
    <Team>
      <Agent
        role="Paleontologist"
        goal="Provide expert insights on dinosaur biology and evolution"
        backstory="You are a renowned expert in paleontology with years of experience in studying dinosaur fossils.
        Your deep understanding of dinosaur anatomy, behavior, and evolutionary history is crucial for accurate and engaging content."
        agentType="mrkl"
      >
        <Task>
          Find and collect information about T-Rex. Return a few facts about it.
        </Task>
      </Agent>

      {/* <Agent
        role="Science Writer"
        goal="Craft an engaging and informative article about dinosaurs"
        backstory="You have a talent for making complex scientific topics accessible and exciting to a broad audience.
        Your writing skills are essential in translating the expert knowledge into a captivating article."
        agentType="mrkl"
      >
        <Task>Write an informative article in the format of Markdown.</Task>
      </Agent> */}

      {/* 
      <Agent
        role="Historian"
        goal="Provide context on the historical significance of dinosaurs"
        backstory="Your expertise in history helps in understanding the impact of dinosaur discoveries on science and culture.
        You offer a unique perspective on how dinosaurs have been perceived throughout history."
      >
        <Task>
          Research historical perspectives on dinosaurs and their influence on
          culture and science. Provide insights on how the understanding of
          dinosaurs has evolved over time. Assist the Science Writer in adding
          historical context to the article.
        </Task>
      </Agent>

      <Agent
        role="Illustrator"
        goal="Create visual representations of dinosaurs and their environment"
        backstory="You are skilled in scientific illustration, capable of bringing prehistoric creatures to life through your art.
        Your illustrations will help readers visualize the world of dinosaurs, enhancing the overall appeal of the article."
      >
        <Task>
          Design and produce illustrations of various dinosaurs, based on
          descriptions and data provided by the Paleontologist. Create images
          that depict the habitats and ecosystems in which dinosaurs lived.
          Collaborate with the Science Writer to ensure the illustrations
          complement the article's narrative.
        </Task>
      </Agent> */}
    </Team>
  );
};

const renderContext = AI.createRenderContext();
const response = await renderContext.render(<App />);
console.log(response);
