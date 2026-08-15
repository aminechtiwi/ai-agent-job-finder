import OpenAI from "openai";
import google from "googlethis";

// ---------------------------------------------------------------------------
// Types – mirroring the subset of the OpenAI chat-completions interface
// that the recruiter agent actually uses.
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: "system" | "assistant" | "user";
  content: string;
}

export interface ChatCompletionChoice {
  message: { content: string | null };
}

export interface ChatCompletionResult {
  choices: ChatCompletionChoice[];
}

export interface AIClient {
  chat: {
    completions: {
      create: (params: {
        messages: ChatMessage[];
        thinking?: { type: string };
      }) => Promise<ChatCompletionResult>;
    };
  };
  functions: {
    invoke: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  };
}

// ---------------------------------------------------------------------------
// Factory – initialises and returns the AI client singleton.
// ---------------------------------------------------------------------------

let _client: AIClient | null = null;

/**
 * Create (or return the cached) AI client instance.
 *
 * Uses the official OpenAI SDK for LLM completions and `googlethis` 
 * for free, keyless web search.
 */
export async function createAIClient(): Promise<AIClient> {
  if (_client) return _client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment variables. Please add it to your .env file.");
  }

  // Point the OpenAI client to Google's free Gemini servers
  const openai = new OpenAI({ 
    apiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
  });

  _client = {
    chat: {
      completions: {
        create: async (params) => {
          // Use Google's free and fast flash model
          const response = await openai.chat.completions.create({
            model: "gemini-1.5-flash",
            messages: params.messages as any,
          });
          return response as unknown as ChatCompletionResult;
        },
      },
    },
    functions: {
      invoke: async (name, args) => {
        if (name === "web_search") {
          const query = args.query as string;
          
          // Use googlethis for free keyless Google scraping
          const options = {
            page: 0,
            safe: false,
            parse_ads: false,
            additional_params: { hl: "en" },
          };
          
          const response = await google.search(query, options);
          
          // Map to the format expected by the recruiter agent
          return response.results.slice(0, 8).map((r) => ({
            title: r.title,
            link: r.url,
            snippet: r.description,
          }));
        }
        throw new Error(`Function ${name} not implemented.`);
      },
    },
  };

  return _client;
}
