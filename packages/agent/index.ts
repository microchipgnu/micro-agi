import "dotenv/config";

import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import {
  createAgentTask,
  listAgentTasks,
  getAgentTask,
  listAgentTaskSteps,
  executeAgentTaskStep,
  getAgentTaskStep,
  listAgentTaskArtifacts,
  uploadAgentTaskArtifacts,
  downloadAgentTaskArtifact,
} from "./src/tasks";

const port = 8000;

// Agent Protocol implementation (https://agentprotocol.ai/)
new Elysia()
  .use(cors())
  .group("/ap/v1/agent", (app) =>
    app
      .post("/tasks", createAgentTask)
      .get("/tasks", listAgentTasks)
      .get("/tasks/:task_id", getAgentTask)
      .get("/tasks/:task_id/steps", listAgentTaskSteps)
      .post("/tasks/:task_id/steps", executeAgentTaskStep)
      .get("/tasks/:task_id/steps/:stepId", getAgentTaskStep)
      .get("/tasks/:task_id/artifacts", listAgentTaskArtifacts)
      .post("/tasks/:task_id/artifacts/", uploadAgentTaskArtifacts)
      .get("/tasks/:task_id/artifacts/:artifactId", downloadAgentTaskArtifact)
  )
  .listen(port, () => {
    console.log("Server started on port: " + port);
  });
