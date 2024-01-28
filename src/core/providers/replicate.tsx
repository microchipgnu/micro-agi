import * as AI from "ai-jsx";
import Replicate from "replicate";

const key: string = "AI_JSX_REPLICATE_API_KEY";
const getReplicateApiKey = () => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  } else if (
    typeof window !== "undefined" &&
    window[key as keyof typeof window]
  ) {
    return window[key as keyof typeof window] as string;
  } else if (typeof localStorage !== "undefined" && localStorage[key]) {
    return localStorage[key];
  }

  return undefined;
};

/**
 * Run a Llama2 model on Replicate.
 */
async function queryReplicate(
  modelId: string, //Parameters<Replicate['run']>[0],
  input: any,
  logger: AI.ComponentContext["logger"]
) {
  const replicate = new Replicate({
    auth: getReplicateApiKey(),
  });

  logger.debug({ modelId, input }, "Calling Replicate llama2");

  const output = (await replicate.run(
    modelId as Parameters<Replicate["run"]>[0],
    { input }
  )) as string[];
  const result = output.join("");
  logger.debug({ result }, "Replicate llama2 output");
  return result;
}

const defaultBuildReplicateArgs = (
  prompt: string,
  props: Record<string, any>
) => ({
  prompt,
  ...props,
});

const defaultParseReplicateResult = (
  output: Awaited<ReturnType<typeof queryReplicate>>
) => output;

interface ReplicateSdkWrapperProps extends Record<string, any> {
  children: AI.Node;
  model: string; // Parameters<Replicate['run']>[0],
  buildReplicateArgs?: (
    prompt: string,
    props: Record<string, any>
  ) => Parameters<typeof queryReplicate>[1];
  parseReplicateResutl?: (
    output: Awaited<ReturnType<typeof queryReplicate>>
  ) => AI.AppendOnlyStreamValue;
}

export async function* ReplicateModel(
  {
    children,
    model,
    buildReplicateArgs = defaultBuildReplicateArgs,
    parseReplicateResult = defaultParseReplicateResult,
    ...defaults
  }: ReplicateSdkWrapperProps,
  { render, logger, memo }: AI.ComponentContext
): AI.RenderableStream {
  yield AI.AppendOnlyStream;

  const prompt = await render(children);
  const replaicateAgs = buildReplicateArgs(prompt, defaults);

  logger.debug({ replaicateAgs }, "Calling Replicate");

  const response = await queryReplicate(model, replaicateAgs, logger);

  yield parseReplicateResult(response);

  return AI.AppendOnlyStream;
}
