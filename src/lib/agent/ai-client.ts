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
 * Uses Groq (Llama 3) for blazing fast, 100% free AI with zero regional 404 bugs.
 */
export async function createAIClient(): Promise<AIClient> {
  if (_client) return _client;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GROQ_API_KEY in environment variables. Please add it to your Vercel project."
    );
  }

  // Use the standard OpenAI SDK but point it to Groq's superfast servers
  const openai = new OpenAI({ 
    apiKey,
    baseURL: "https://api.groq.com/openai/v1"
  });

  _client = {
    chat: {
      completions: {
        create: async (params) => {
          const response = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile", // Groq's most capable free model
            messages: params.messages as any,
            temperature: 0.1, // Low temperature for accurate JSON extraction
            response_format: { type: "json_object" }, // FORCE strict JSON
          });
          return response as unknown as ChatCompletionResult;
        },
      },
    },
    functions: {
      invoke: async (name, args) => {
        if (name === "web_search") {
          const query = args.query as string;
          const options = {
            page: 0,
            safe: false,
            parse_ads: false,
            additional_params: { hl: "en" },
          };
          const response = await google.search(query, options);
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
