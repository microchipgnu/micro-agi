import { Node, createRenderContext } from "ai-jsx";
import {
  Completion
} from "ai-jsx/core/completion";
import { Ollama } from "../../core/providers/ollama.js";
import { LlavaImage } from "../../core/utils/llava-image.js";

const renderContext = createRenderContext();
export const Multimodal = async ({ url }: { url: string }): Promise<Node> => {
  return await renderContext.render(
    <Ollama model="llava">
      <Completion>
        Describe this image
        <LlavaImage url={url} />
      </Completion>
    </Ollama>
  );
};