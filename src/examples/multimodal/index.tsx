import { Ollama } from "../../core/providers/ollama.js";
import { LlavaImage } from "../../core/utils/llava-image.js";
import { Node, createRenderContext } from "ai-jsx";
import { Completion } from "ai-jsx/core/completion";

const renderContext = createRenderContext();
export const Multimodal = async ({ url }: { url: string }): Promise<Node> => {
  return await renderContext.render(
    <Ollama model="llava">
      <Completion>
        Describe
        <LlavaImage url={url} />
      </Completion>
    </Ollama>
  );
};
