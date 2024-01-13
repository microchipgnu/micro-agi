import { Agent, Task, Team, useTeam } from "@micro-agi/core";
import { useMessage } from "@micro-agi/core/src/providers/messages-providers";
import { nanoid } from "nanoid";
import { Button } from "./components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { DynamicTool } from "langchain/tools";
import { OpenAI } from "langchain/llms/openai";

const chatgpt = new OpenAI({
  openAIApiKey: "XXX",
  temperature: 1,
  modelName: "gpt-4-1106-preview",
});

const Main = () => {
  return (
    <Team>
      <Agent
        role="Meteorological Analyst"
        goal="Provide accurate and up-to-date weather forecasts"
        backstory="With a passion for meteorology, you have extensive experience
        in analyzing weather patterns and predicting climate conditions.
        Your accuracy in forecasts is unmatched."
        llm={chatgpt}
        verbose
        tools={[
          new DynamicTool({
            name: "Weather Forecasts",
            description: "Provides weather forecasts",
            func: async (input: string) => {
              return "It will rain";
            },
          }),
        ]}
      >
        <Task
          description="Analyze the current weather conditions and provide a detailed forecast
  for the day."
        />
      </Agent>
      <Agent
        role="Fashion Coordinator"
        goal="Select the perfect outfit based on weather conditions"
        backstory="As a fashion expert, you have an eye for style and comfort.
        You're adept at choosing outfits that are not only fashionable but also
        suitable for the day's weather."
        llm={chatgpt}
      >
        <Task
          description="Using the weather forecast provided, select a set of clothes
  that are appropriate for the day's weather. Ensure the outfit is stylish yet
  practical, considering factors like comfort, occasion, and current fashion trends."
        />
      </Agent>
      <App />
    </Team>
  );
};

const App = ({ children }: { children?: React.ReactNode }) => {
  const { kickoff, state } = useTeam();

  const {
    state: { messages },
  } = useMessage();

  return (
    <>
      <div className="bg-slate-200 h-[100vh] p-4">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">micro-agi</h1>
          <Button variant={"link"}>
            <a href="https://chat.openai.com/g/g-KSdm64VWE-micro-agi">
              Use ChatGPT to create a micro-agi compatible Team
            </a>
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="bg-white rounded p-2">
            <Table>
              <TableCaption>
                <div className="flex flex-col gap-2 items-center justify-center">
                  <span>micro-agi tasks overview</span>
                </div>
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Task</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      {task.agent?.name || task.agent?.role}
                    </TableCell>
                    <TableCell>{task.agent?.llm?.getName()}</TableCell>
                    <TableCell>{task.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {messages && (
            <div className="bg-white rounded p-2">
              <Table>
                <TableCaption>
                  <div className="flex flex-col gap-2 items-center justify-center">
                    <span>system messages</span>
                  </div>
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages &&
                    messages.map((message) => (
                      <TableRow key={nanoid()}>
                        <TableCell
                          className={`font-medium ${
                            message.type === "error" && "text-red-500"
                          } ${
                            message.type === "info" &&
                            "font-bold text-slate-600"
                          } ${message.type === "warning" && "text-yellow-500"}`}
                        >
                          {message.message}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Button onClick={kickoff} disabled={state.isRunning}>
            {state.isRunning ? "Running..." : "Start"}
          </Button>
        </div>
      </div>

      {children}
    </>
  );
};

export default Main;
