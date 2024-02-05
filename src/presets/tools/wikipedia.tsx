import { Tool } from "../../core/agents/mrkl-agent.js";
interface SearchResults {
  query: {
    search: Array<{ title: string }>;
  };
}

interface Page {
  pageid: number;
  ns: number;
  title: string;
  extract: string;
}

interface PageResult {
  batchcomplete: string;
  query: {
    pages: Record<string, Page>;
  };
}

export interface WikipediaQueryInput {
  query: string;
}

async function fetchSearchResults(query: string): Promise<SearchResults> {
  const baseUrl = "https://en.wikipedia.org/w/api.php";
  const searchParams = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    format: "json",
  });

  const response = await fetch(`${baseUrl}?${searchParams.toString()}`);
  if (!response.ok) throw new Error("Network response was not ok");
  const data: SearchResults = await response.json();
  return data;
}

// Helper Function: Fetch Page Details
async function fetchPageDetails(page: string): Promise<Page> {
  const baseUrl = "https://en.wikipedia.org/w/api.php";
  const params = new URLSearchParams({
    action: "query",
    prop: "extracts",
    explaintext: "true",
    format: "json",
    titles: page,
  });

  const response = await fetch(`${baseUrl}?${params.toString()}`);
  if (!response.ok) throw new Error("Network response was not ok");
  const data: PageResult = await response.json();
  const pageId = Object.keys(data.query.pages)[0];

  return data.query.pages[pageId];
}

export const wikipediaSearch: Tool<WikipediaQueryInput, string> = {
  name: "WikipediaSearch",
  description:
    "A tool for interacting with and fetching data from the Wikipedia API.",
  inputDescription:
    'a JSON structure that looks like { "query": "a query to search" }',

  validateInput: (input: WikipediaQueryInput): boolean => {
    return typeof input.query === "string" && input.query.trim().length > 0;
  },

  callback: async (input: WikipediaQueryInput): Promise<string> => {
    const searchResults = await fetchSearchResults(input.query);
    const summaries: string[] = [];

    for (
      let i = 0;
      i < Math.min(3, searchResults.query.search.length);
      i += 1
    ) {
      const page = searchResults.query.search[i].title;
      const pageDetails = await fetchPageDetails(page);

      if (pageDetails) {
        const summary = `${pageDetails.extract}`;
        summaries.push(summary);
      }
    }

    if (summaries.length === 0) {
      throw new Error("No good Wikipedia Search Result was found");
    }

    return `"""${summaries.join("\n").slice(0, 4000).replace(/\n/g, "")}"""`; // TODO: Make this configurable
  },
};
