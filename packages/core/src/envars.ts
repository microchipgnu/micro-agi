import { getAPIKey } from "./api-key";

const isDocker = process.env.IS_DOCKER === "1";

const inferenceServer = isDocker
  ? `http://${"host.docker.internal"}`
  : `${process.env.INFERECE_SERVER_BASE_URL}`;

const openaiKey = process.env.OPENAI_API_KEY || getAPIKey();

const constants = {
  inferenceServer,
  isDocker,
  openaiKey,
};

export { constants };
