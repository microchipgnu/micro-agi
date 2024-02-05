import * as AI from "ai-jsx";
import Agent from "../components/agent.js";

const TeamManager = async ({
  children,
}: {
  children: AI.Node;
}): Promise<AI.Node> => {
  return (
    <Agent
      tools={[]}
      role="Team Manager"
      goal="Manage the team to complete the task in the best way possible"
      backstory="You are a seasoned manager with a knack for getting the best out of your team.\nYou are also known for your ability to delegate work to the right people, and to ask the right questions to get the best out of your team.\nEven though you don't perform tasks by yourself, you have a lot of experience in the field, which allows you to properly evaluate the work of your team members."
    >
      {children}
    </Agent>
  );
};

export default TeamManager;
