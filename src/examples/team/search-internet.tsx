import * as AI from "ai-jsx";
import Agent from "../../core/components/agent.js";
import Task from "../../core/components/task.js";
import Team from "../../core/components/team.js";
import {
  browseWebsiteTool,
  searchInternetTool,
} from "../../presets/tools/search-internet.js";
import { writeFile } from "../../presets/tools/filesystem.js";

const App = async () => {
  return (
    <Team process="sequential">
      <Agent
        role="Internet Search Expert"
        goal="Gather links and information about a topic"
        backstory="You are a professional internet search expert with years of experience in search engines and information retrieval."
        agentType="mrkl"
        model="openhermes"
        // model="nousresearch/nous-hermes-2-mixtral-8x7b-dpo"
        // provider="open-router"
      >
        <Task tools={[searchInternetTool]}>
          Find links about Apple Vision Pro. Your final answer should contain a
          list of links and a summary of the content.
        </Task>
      </Agent>
      <Agent
        role="Writer"
        goal="Craft an engaging and informative article"
        backstory="You have a talent for making topics accessible and exciting to a broad audience.
        Your writing skills are essential in translating the expert knowledge into a captivating article."
        agentType="mrkl"
        model="openhermes"
        // model="nousresearch/nous-hermes-2-mixtral-8x7b-dpo"
        // provider="open-router"
      >
        <Task tools={[browseWebsiteTool]}>
          Write an informative article in the format of Markdown based on the
          Internet Search Expert research. Get the current context Internet
          Search Expert. Your answer should include a markdown article about the
          topic.
        </Task>
        <Task tools={[writeFile]}>Get the current article. Write it to a file.</Task>
      </Agent>
    </Team>
  );
};

const renderContext = AI.createRenderContext();
const response = await renderContext.render(<App />);
console.log(response);
