import * as AI from "ai-jsx";
import {
  ChatCompletion,
  SystemMessage,
  UserMessage
} from "ai-jsx/core/completion";
import { JSDOM } from "jsdom";
import { Tool } from "../../core/agents/mrkl-agent.js";

const renderContext = AI.createRenderContext({});

async function scrapSearchResults(query: string): Promise<string[] | string> {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURI(query)}`;

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) throw new Error("Network response was not ok");
    const html = await response.text();

    let doc;
    if (typeof window === "undefined") {
      // We are in Node.js
      const dom = new JSDOM(html);
      doc = dom.window.document;
    } else {
      // We are in the browser
      const parser = new DOMParser();
      doc = parser.parseFromString(html, "text/html");
    }

    const results = Array.from(doc.querySelectorAll(".result .links_main")).map(
      (result) => {
        const title =
          result.querySelector(".result__title")?.textContent ?? "No title";
        const href =
          result.querySelector(".result__title a")?.getAttribute("href") ?? "#";
        return `Title: ${title}; URL: ${href}`;
      }
    );

    return results;
  } catch (error) {
    console.error("Error fetching search results:", error);
    return "Error: unable to retrieve search results";
  }
}

async function scrapText(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.text();
  } catch (error) {
    console.error("Error fetching text:", error);
    return "Error: unable to retrieve website text";
  }
}

async function scrapLinks(url: string): Promise<string[] | string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const links = Array.from(doc.querySelectorAll("a")).map((link) => {
      const href = link.getAttribute("href") ?? "#";
      return `<a href="${href}">${link.innerText}</a>`;
    });
    return links;
  } catch (error) {
    console.error("Error fetching links:", error);
    return "Error: unable to retrieve website links";
  }
}

export const browseWebsiteTool: Tool<{ url: string }, string> = {
  name: "Browse Website",
  description: "Summarizes the content of a given website URL.",
  inputDescription:
    'a JSON structure that looks like { "url": "URL of the website to visit" }',
  validateInput: (input) =>
    typeof input.url === "string" && input.url.startsWith("http"),
  callback: async (input) => {
    const websiteText = await scrapText(input.url);

    // TODO: this will fail without an openai key. Need to figure this out
    const summary = await renderContext.render(
      <ChatCompletion>
        <SystemMessage>
          You are a helpful assistant. Summarize the content of the website.
        </SystemMessage>
        <UserMessage>{websiteText}</UserMessage>
      </ChatCompletion>
    );

    return `${summary}`;
  },
};

export const searchInternetTool: Tool<{ query: string }, string> = {
  name: "Search Internet",
  description: "Performs an internet search for the given query.",
  inputDescription:
    'a JSON structure that looks like { "query": "the query to search for" }',
  validateInput: (input) => typeof input.query === "string",
  callback: async (input) => {
    const result = await scrapSearchResults(input.query);

    if (typeof result === "string") {
      return result;
    }

    return `${JSON.stringify(result.slice(0, 5).join("\n"))}`;
  },
};
