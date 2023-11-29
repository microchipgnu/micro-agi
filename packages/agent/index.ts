import "dotenv/config";

import Agent, {
  type StepHandler,
  type StepInput,
  type StepResult,
  type TaskInput,
} from "agent-protocol";

async function taskHandler(taskInput: TaskInput | null): Promise<StepHandler> {
  console.log(`task: ${taskInput}`);

  async function stepHandler(stepInput: StepInput | null): Promise<StepResult> {
    console.log(`step: ${stepInput}`);
    return {
      output: stepInput,
    };
  }

  return stepHandler;
}

const port = 8000;

Agent.handleTask(taskHandler, {
  port: port,
  workspace: import.meta.dir,
}).start();
