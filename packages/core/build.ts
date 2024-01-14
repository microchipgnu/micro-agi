import packageJson from "./package.json";

const BUILD_DIR = `${import.meta.dir}/dist`;
const ENTRYPOINT = `${import.meta.dir}/index.ts`;

const result = await Bun.build({
  entrypoints: [ENTRYPOINT],
  outdir: BUILD_DIR,
  sourcemap: "external",
  external: ["langchain", "@langchain", "react"],
});

await Bun.write(
  `${BUILD_DIR}/package.json`,
  JSON.stringify({ ...packageJson, module: "index.js" }, null, 2)
);

if (!result.success) {
  console.error("Build failed");
  for (const message of result.logs) {
    // Bun will pretty print the message object
    console.error(message);
  }
}
