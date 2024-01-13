import Sandbox from "@e2b/sdk";
import { Alert, Spinner } from "@inkjs/ui";
import { Agent, Task, Team, useTeam } from "@micro-agi/core";
import { useMessage } from "@micro-agi/core/src/providers/messages-providers";
import { Box, Text, render } from "ink";
import BigText from "ink-big-text";
import Gradient from "ink-gradient";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import readline from "readline";

const AnimatedText = ({
  text,
  easingFunction,
  time,
}: {
  text: string;
  easingFunction: (t: number) => number;
  time: number;
}) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) return;
    let currentLength = 0;

    const animateText = () => {
      // Determine the next index
      currentLength = currentLength < text.length ? currentLength + 1 : 0;

      // Update the displayed text
      setDisplayedText(text.substring(0, currentLength));

      // Calculate the next timeout duration
      const nextTimeout = easingFunction(currentLength / text.length) * time; // Adjust the base speed here

      // If not at the end of the text, continue animating, else restart after a delay
      if (currentLength < text.length) {
        setTimeout(animateText, nextTimeout);
      } else {
        // Set a timeout to restart the animation
        setTimeout(() => {
          setDisplayedText(""); // Reset the displayed text
          currentLength = 0; // Reset currentLength
          animateText(); // Restart the animation
        }, 1000); // Delay before restart (1 second in this case)
      }
    };

    animateText();

    // No cleanup function needed since we're not using setInterval
  }, [text, easingFunction]); // Add easingFunction to dependency array

  return (
    <Gradient name="mind">
      <BigText text={`${displayedText}_` || "_"} />
    </Gradient>
  );
};

const App = () => {
  const {
    state: { agents, tasks, isRunning },
    kickoff,
  } = useTeam();

  const {
    state: { messages },
  } = useMessage();

  useEffect(() => {
    if (isRunning) return;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on("line", (input) => {
      if (input === "") {
        kickoff();
      }
    });

    return () => rl.close();
  }, [kickoff]);

  return (
    <Box flexDirection="column" gap={1}>
      <Text>
        <Text bold>{agents.length} agent(s)</Text> loaded and{" "}
        <Text bold>{tasks.length} task(s)</Text> loaded.
      </Text>

      {messages &&
        messages.map((message) => {
          return (
            <Alert key={nanoid()} variant={message.type}>
              {message.message}
            </Alert>
          );
        })}

      <Spinner label={isRunning ? "Running..." : "Press ENTER to start"} />
    </Box>
  );
};

const CLI = ({ children }: { children?: React.ReactNode }) => {
  return (
    <>
      <Gradient name="mind">
        <BigText text={"micro agi"} />
      </Gradient>
      <Team>
        {children}
        <App />
      </Team>
    </>
  );
};

render(<CLI />);
