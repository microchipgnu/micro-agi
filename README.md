# micro-agi: A React-Based Framework for AI Autonomous Agents

```jsx
<Team>
  <Agent role="designer">
    <Task description="design landing page" />
  </Agent>
  <Agent role="frontend developer">
    <Task description="develop landing page with react and tailwind" />
    <Task description="publish to github" />
  </Agent>
</Team>
```

- [Introduction](#introduction)
- [What is micro-agi?](#what-is-micro-agi)
- [How It Works](#how-it-works)
- [Features](#features)
- [Examples](#examples)
- [The Why](#the-why)
- [🔗 Chat with a 🤖 GPT to create your first Team](https://chat.openai.com/g/g-KSdm64VWE-micro-agi)

## Introduction

Welcome to `micro-agi`, an innovative React-based framework designed for building and orchestrating role-player, AI autonomous agents. This project, inspired by the vast potential of the JavaScript ecosystem, provides a unique approach to managing AI agents in both browser and server-based applications.

## What is micro-agi?

`micro-agi` enables the creation of AI autonomous agents using a structured, JSX-style syntax. This framework facilitates the development of sophisticated AI agents that can perform a variety of tasks autonomously and interact with each other to solve complex problems.

`micro-agi` is built around three fundamental components: Team, Agent, and Task. Each plays a crucial role in the orchestration of AI autonomous agents. Let's delve deeper into these components.

### Team

A `Team` is a container that groups a collection of `Agent` components. It represents a collaborative unit within which agents can interact, delegate tasks, and combine their efforts to achieve common objectives.

- **Purpose:** Acts as a collaborative environment for agents.
- **Usage:** Define a `Team` to encapsulate a group of agents working towards a shared goal.

### Agent

An `Agent` is an individual entity within a `Team` with a specific role and set of responsibilities. Each agent can be assigned one or more tasks.

- **Roles:** Define the role of an agent (e.g., designer, developer) to specify its function within the team.
- **Autonomy:** Agents can work independently or collaborate with other agents.
- **Interaction:** Agents within the same team can communicate and delegate tasks among themselves.
- **Tools Compatibility**: Agents can be attributed tools that are compatible with Langchain, enhancing their capabilities in natural language processing and understanding.

### Task

A `Task` is an actionable item assigned to an agent. It defines what needs to be done and can include specific parameters or requirements.

- **Flexibility:** Tasks can range from simple to complex and can be dynamically assigned or re-assigned to agents.
- **Customizable:** Each task can be tailored with specific descriptions, parameters, and tools needed for completion.
- **Tools Assignment**: Tasks can be assigned specific tools compatible with Langchain, allowing for more sophisticated processing and execution.

## How It Works

Using `micro-agi`, you can create complex systems of AI agents that work together to accomplish tasks. Here's a simple example

```jsx
<Team>
  <Agent role="designer">
    <Task description="design landing page" />
  </Agent>
  <Agent role="frontend developer">
    <Task description="develop landing page with react and tailwind" />
    <Task description="publish to github" />
  </Agent>
</Team>
```

In this example, the [Team](#team) contains two [Agent](#agent) components: one with the role of a designer and the other as a frontend developer. Each agent has specific [Task](#task) components assigned to them, and these tasks can be enhanced with tools compatible with Langchain for advanced language processing capabilities.

## Features

- Role-Based Agent Design: Customize agents with specific roles, goals, and tools.
- Autonomous Inter-Agent Delegation: Agents can autonomously delegate tasks and inquire amongst themselves, enhancing problem-solving efficiency.
- Flexible Task Management: Define tasks with customizable tools and assign them to agents dynamically.
- Processes Driven: Currently only supports sequential task execution but more complex processes like consensual and hierarchical being worked on.
- React-based framework: Taps into the whole React ecosystem
- Suitable for browser and server-based apps
  - See [App](./packages/app/) example
  - See [CLI](./packages/cli/) example

## Examples

Coming soon...

## The Why

Back in December 2023 I started exploring the different options to build, orchestrate and run AI autonomous agents and I found several options like AutoGPT, baby-agi, smol-dev and a few others. I got frustrated with the lack of projects that would tap in the vast JS ecosystem (browser and node). I started running a few experiments -- that can be found in the branch [deprecated](https://github.com/microchipgnu/micro-agi/tree/deprecated).

Now (January 2024), I got inspired by [CrewAI](https://github.com/joaomdmoura/crewAI) approach. I felt that I could try to replicate some of its functionality into the ideas I had spinning in my head over the holidays, more specifically having a JSX-style to declaritively express teams and then having teams that can tap

```
 ███╗   ███╗ ██╗  ██████╗ ██████╗   ██████╗       █████╗   ██████╗  ██╗
 ████╗ ████║ ██║ ██╔════╝ ██╔══██╗ ██╔═══██╗     ██╔══██╗ ██╔════╝  ██║
 ██╔████╔██║ ██║ ██║      ██████╔╝ ██║   ██║     ███████║ ██║  ███╗ ██║
 ██║╚██╔╝██║ ██║ ██║      ██╔══██╗ ██║   ██║     ██╔══██║ ██║   ██║ ██║
 ██║ ╚═╝ ██║ ██║ ╚██████╗ ██║  ██║ ╚██████╔╝     ██║  ██║ ╚██████╔╝ ██║
 ╚═╝     ╚═╝ ╚═╝  ╚═════╝ ╚═╝  ╚═╝  ╚═════╝      ╚═╝  ╚═╝  ╚═════╝  ╚═╝
```