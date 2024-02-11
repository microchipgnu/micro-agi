// TODO: this won't work well in React apps for now
import * as AI from "ai-jsx";

const Parallel = async ({ children }: { children?: AI.Node }) => {
  return children;
};

export default Parallel;
