<img src="./assets/banner.png"/>

---


**micro-agi** is an innovative **[React-compatible](https://agi.microchipgnu.pt/getting-started/why-jsx) cross-platform framework designed for building and orchestrating role-player AI autonomous agents** that works both in server or client applications.


With `micro-agi`, you can create complex systems of AI agents that work together to accomplish tasks. Here's a simple example

```jsx
<Team>
  <Agent role="designer">
    <Task>Design landing page</Task>
  </Agent>
  <Agent role="frontend developer">
    <Task>Develop landing page with React and Tailwind</Task>
    <Task>Publish to GitHub</Task>
  </Agent>
</Team>
```

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

1. [Bun](https://bun.sh)
2. Basic understanding of JSX


### Installation

To get started with `micro-agi`, you need to install the package in your project. 

```sh
bun add micro-agi
```

micro-agi works seamlessly with [AI.JSX](https://docs.ai-jsx.com), a framework for building AI applications using JavaScript and JSX. To take full advantage of micro-agi, make sure you have [AI.JSX](https://docs.ai-jsx.com) installed in your project.

### Creating an AI Agent Team

With `micro-agi`, you can create a team of AI agents, each with specific roles and tasks. 

The following example is taken from [micro-agi-starter](https://github.com/microchipgnu/micro-agi-starter) repo. Feel free to clone it and run it against [Ollama locally](https://agi.microchipgnu.pt/getting-started/providers#ollama).

Here's a simple example to get you started:

```jsx
/** @jsxImportSource ai-jsx */
import * as AI from "ai-jsx";
import Agent from "micro-agi/core/components/agent";
import Task from "micro-agi/core/components/task";
import Team from "micro-agi/core/components/team";

const App = async ({ topic }: { topic: string }) => {
  return (
    <Team process="sequential">
      <Agent
        agentType="mrkl"
        role="Writer"
        goal="Write articles about a topic"
        backstory="You are a very experienced writer. You've written thousands of article in your career."
        model="mistral"
        provider="ollama"
      >
        <Task
          onStart={async () => {
            console.log("Started writing article about", topic);
          }}
          onDone={async () => {
            console.log("Done writing article about", topic);
          }}
        >
          Write an article about {topic}. Your result in markdown format.
        </Task>
      </Agent>
    </Team>
  );
};

const renderContext = AI.createRenderContext();
const result = await renderContext.render(<App topic="Apple" />);
await Bun.write(`./result.json`, result);
```

