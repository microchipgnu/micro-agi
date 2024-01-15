// @ts-ignore
// TODO: fix this import
import packageJson from "./package.json";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

const BASE_DIR = import.meta.dir;
const BUILD_DIR = `${BASE_DIR}/dist`;
const ENTRYPOINT = `${BASE_DIR}/index.tsx`; // Adjusted to point to compiled JS file

async function build() {
  try {
    const { stdout, stderr } = await execAsync(`tsc -p ${BASE_DIR}`);
    console.log(stdout);
    if (stderr) {
      console.log(stderr);
      throw new Error(`TypeScript compilation error: ${stderr}`);
    }

    // Bun build process
    const result = await Bun.build({
      entrypoints: [ENTRYPOINT],
      outdir: BUILD_DIR,
      target: "node",
      external: Object.keys(packageJson.dependencies),
    });

    // Write package.json in the build directory
    await Bun.write(
      `${BUILD_DIR}/package.json`,
      JSON.stringify(
        {
          ...packageJson,
          module: "index.js",
          bin: {
            "micro-agi-cli": "./index.js",
          },
          dependencies: {
            ...packageJson.dependencies,
            "@micro-agi/core": "latest",
          },
        },
        null,
        2
      )
    );

    if (!result.success) {
      throw new Error("Bun build failed");
    }

    console.log("Build completed successfully");
  } catch (error) {
    console.error("Build error:", error);
    process.exit(1);
  }
}

build();
