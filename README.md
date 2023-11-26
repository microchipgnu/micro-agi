# micro-agi

It is TypeScript framework designed to facilitate the integration of autonomous AI agents with open-source Large Language Models (LLMs). Drawing inspiration from AutoGPT and BabyAGI, this framework is developed to support both browser and server applications.

## Overview

micro-agi aims to provide a straightforward and effective solution for developers looking to incorporate AI functionalities into their applications. It is built with a focus on compatibility and ease of use, catering to a wide range of development needs.

### Key Features

- **Integration with Open Source LLMs**: Enables connection with various Large Language Models via LM Studio.
- **Browser and Server Compatibility**: Designed to work in both web browsers and server-side via Node.js.
- **Local File Management via Web APIs:** This feature allows the manipulation and retrieval of files directly from your computer, utilizing the latest Web File System Access APIs for enhanced interaction with the local file system.
- **Deployment and Operation of Additional GPT Agents:** Enables the creation and execution of multiple GPT-based AI agents, offering flexibility in managing diverse AI functionalities within the same environment.
- **Automated Code Generation:** Facilitates the automatic creation of code snippets or entire code blocks, streamlining the development process and reducing manual coding efforts.
- **Limited Duration Memory Capabilities:** Possesses a short-term memory feature, enabling the AI to temporarily store and recall recent interactions or data, useful for context-aware processing.
- **Integrated Search via Duck Duck Go:** Incorporates a search functionality using Duck Duck Go, which involves indirect retrieval of search results through a server proxy, ensuring privacy-focused and unbiased search results.
- **Non-persistent Web Browsing:** Offers a stateless method for accessing web content, where visits to URLs are conducted without retaining any session information, done through server-proxied requests to ensure privacy and security.


### Future Plans
- Wait for LM Studio support Function Calls
- Integrate Agent Protocol
- Dockerize
- Websocket server that streams events
- State manager

### Ideas
- Ink CLI (?)
- Integration with e2b for agent deployment (?)
- BentoLM integration for LLM cloud deployment (?)
- Web-browsing with Puppeteer (?)
- Support local vector embeddings (memgpt?) (?)
- Support interaction with OpenAI / other plugins (?)


## How to 

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.0.6. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
