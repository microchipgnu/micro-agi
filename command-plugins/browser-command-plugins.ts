import { callLLMChatCompletion, CallLLMChatCompletionResponseStatus } from '../utils/llm-utils';
import { countStringTokens } from '../utils/token-counter';
import { getConfig } from '../utils/config';
import type { CommandPlugin } from './command-plugins';
import type { LLMMessage, LLMModel } from "../utils/types";

let callProxyFn: (
  url: string
) => Promise<
  { status: "ok"; text: string } | { status: "error"; error: string }
>;

export function initBrowserCommandPlugins({
  callProxy,
}: {
  callProxy: typeof callProxyFn;
}) {
  callProxyFn = callProxy;
}

initBrowserCommandPlugins({
  callProxy,
})

async function callProxy(
  url: string
): Promise<
  { status: "ok"; text: string } | { status: "error"; error: string }
> {
  const proxyAPIUrl = new URL(
    "/proxy",
    `${window.location.protocol}//${window.location.host}`
  );
  proxyAPIUrl.searchParams.set("url", url);
  try {
    const response = await fetch(proxyAPIUrl.toString(), { method: "GET" });
    if (response.ok) {
      return { status: "ok", text: await response.text() };
    } else if (response.status === 520) {
      const jsonBody = await response.json();
      return { status: "error", error: `Error: HTTP ${jsonBody.status} error` };
    } else {
      return { status: "error", error: "Error: unable to visit website" };
    }
  } catch (error) {
    console.log("Error calling proxy", error);
    return { status: "error", error: "Error: unable to visit website" };
  }
}

async function callProxyAndReturnFromDocument<T>(
  url: string,
  getStringFromDocument: (doc: Document) => T
) {
  const response = await callProxyFn(url);
  if (response.status === "error") {
    return response.error;
  }

  try {
    const respDom = new DOMParser();
    const doc = await respDom.parseFromString(response.text, "text/html");
    return getStringFromDocument(doc);
  } catch (error) {
    console.error("Error parsing HTML from website", error);
    return "Error: Unable to parse website HTML";
  }
}

function scrapText(url: string): Promise<string> {
  return callProxyAndReturnFromDocument(url, (doc) => doc.body.innerText);
}

function scrapLinks(url: string): Promise<string | string[]> {
  return callProxyAndReturnFromDocument(url, (doc) => {
    const linksStr = [];
    const hyperlinks = doc.body.querySelectorAll("a");
    for (const link of hyperlinks) {
      const href = link.getAttribute("href");
      let src = href;
      if (!!href && (href[0] === "/" || !href.startsWith("http"))) {
        try {
          src = new URL(href, url).toString();
        } catch {}
      }
      linksStr.push(`<a href="${src}">${link.innerText}</a>`);
    }
    return linksStr;
  });
}

function scrapSearchResults(query: string): Promise<string | string[]> {
  return callProxyAndReturnFromDocument(
    `https://html.duckduckgo.com/html/?q=${encodeURI(query)}`,
    (doc) => {
      const results = doc.body.querySelectorAll(".result .links_main");

      const resultsToReturn: string[] = [];
      for (const result of results) {
        try {
          const anchor = result.querySelector(
            ".result__title a"
          ) as HTMLElement | null;
          if (anchor) {
            const url = new URL(
              `https://${anchor.getAttribute("href")}`
            ).searchParams.get("uddg");
            const title = anchor.innerText;

            resultsToReturn.push(`Title: ${title}; URL: ${url}`);
          }
        } catch {}
      }

      return resultsToReturn;
    }
  );
}

function* splitText(
  text: string,
  model: LLMModel,
  maxTokens = 3000
): Generator<string> {
  const paragraphs = text.split("\n");
  let currentLength = 0;
  let currentChunk: string[] = [];

  for (const paragraph of paragraphs) {
    const tokensInParagraph = countStringTokens(paragraph, model);
    if (currentLength + tokensInParagraph <= maxTokens) {
      currentChunk.push(paragraph);
      currentLength += tokensInParagraph;
    } else {
      yield currentChunk.join("\n");
      currentChunk = [paragraph];
      currentLength = tokensInParagraph;
    }
  }

  if (currentChunk.length > 0) {
    yield currentChunk.join("\n");
  }
}

async function summarizeText(text: string, isWebsite = true): Promise<string> {
  if (text === "") {
    return "Error: No text to summarize";
  }

  const currentModel = getConfig().models.plugins.browserModel;

  console.log(`Text length: ${text.length} characters`);
  const summaries: string[] = [];
  const chunks = splitText(text, currentModel);

  for (const chunk of chunks) {
    const messages: LLMMessage[] = isWebsite
      ? [
          {
            role: "user",
            content: `Please summarize the following website text, do not describe the general website, but instead concisely extract the specific information this subpage contains:\n\n 
              ${chunk}`,
          },
        ]
      : [
          {
            role: "user",
            content: `Please summarize the following text, focusing on extracting concise and specific information:\n\n
              ${chunk}`,
          },
        ];

    const summary = await callLLMChatCompletion({
      messages,
      model: currentModel,
      maxTokens: 300,
    });

    summaries.push(summary.status === CallLLMChatCompletionResponseStatus.Success ? summary.content : "error");
  }

  if (summaries.length === 1) {
    // If there is only a single summary then return that
    return summaries[0];
  }

  const combinedSummary = summaries.join("\n");
  const messages: LLMMessage[] = isWebsite
    ? [
        {
          role: "user",
          content: `Please summarize the following website text, do not describe the general website, but instead concisely extract the specific information this subpage contains:\n\n 
            ${combinedSummary}`,
        },
      ]
    : [
        {
          role: "user",
          content: `Please summarize the following text, focusing on extracting concise and specific information:\n\n
            ${combinedSummary}`,
        },
      ];

  const finalSummary = await callLLMChatCompletion({
    messages,
    model: currentModel,
    maxTokens: 300,
  });
  return finalSummary.status === CallLLMChatCompletionResponseStatus.Success ? finalSummary.content : "error";
}

const BrowserCommandPlugins: CommandPlugin[] = [
  {
    command: "browse_website",
    name: "Browse Website",
    arguments: {
      url: "url",
    },
    argumentsV2: {
      required: ["url"],
      args: {
        url: { type: "string", description: "The URL of the website to visit" },
      },
    },
    execute: async (args) => {
      const url = args["url"];
      const websiteText = await scrapText(url);
      const summary = await summarizeText(websiteText);
      let linksOrError = await scrapLinks(url);

      if (typeof linksOrError === "string") {
        // Error, so we'll return that
        return linksOrError;
      }

      return `Website Content Summary:\n ${summary}\n\nLinks:\n ${linksOrError
        .slice(0, 10)
        .join("\n")}`;
    },
  },
  {
    command: "search_internet",
    name: "Search internet",
    arguments: {
      query: "query",
    },
    argumentsV2: {
      required: ["query"],
      args: {
        query: { type: "string", description: "The to search for" },
      },
    },
    execute: async (args) => {
      const result = await scrapSearchResults(args["query"]);

      if (typeof result === "string") {
        return result;
      }

      return `Search results:\n\n${result.slice(0, 10).join("\n")}`;
    },
  },
];

export default BrowserCommandPlugins;