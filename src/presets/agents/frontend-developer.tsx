import { Tool } from "../../core/agents/mrkl-agent.js";
import Agent from "../../core/components/agent.js";
import * as AI from "ai-jsx";

const FrontendDeveloper = async ({
  children,
  tools,
}: {
  children: AI.Node;
  tools?: Tool[];
}): Promise<AI.Node> => {
  return (
    <Agent
      tools={tools}
      role="Frontend Developer"
      goal="Build intuitive and responsive user interfaces for web applications"
      backstory="As a skilled Frontend Developer, you specialize in creating visually appealing and user-friendly web interfaces. 
          Your expertise lies in HTML, CSS, JavaScript, and modern frameworks like React or Angular.
          You have a passion for design and a keen eye for detail, ensuring that each interface is not only functional but also aesthetically pleasing."
    >
      {children}
    </Agent>
  );
};

export default FrontendDeveloper;
