import OpenAI from "openai";
import google from "googlethis";

// ---------------------------------------------------------------------------
// Types
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

let _client: AIClient | null = null;

/**
 * Universal Multi-Provider AI Client:
 * Automatically supports whichever key is provided in environment variables:
 * - GROQ_API_KEY (Groq - Llama 3.3 70B & Llama 3.1 8B)
 * - OPENROUTER_API_KEY (OpenRouter - Free DeepSeek, Gemini, Llama)
 * - GEMINI_API_KEY (Google Gemini)
 * - OPENAI_API_KEY (OpenAI - GPT-4o-mini)
 */
export async function createAIClient(): Promise<AIClient> {
  if (_client) return _client;

  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  let openai: OpenAI;
  let defaultModel: string;
  let fallbackModel: string | null = null;

  if (groqKey) {
    openai = new OpenAI({
      apiKey: groqKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    defaultModel = "llama-3.3-70b-versatile";
    fallbackModel = "llama-3.1-8b-instant"; // Higher rate limit fallback
  } else if (openRouterKey) {
    openai = new OpenAI({
      apiKey: openRouterKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://ai-agent-job-finder.vercel.app",
        "X-Title": "AI Job Matcher",
      },
    });
    defaultModel = "meta-llama/llama-3.3-70b-instruct:free";
    fallbackModel = "google/gemini-2.0-flash-exp:free";
  } else if (geminiKey) {
    openai = new OpenAI({
      apiKey: geminiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
    defaultModel = "gemini-1.5-flash";
    fallbackModel = "gemini-2.0-flash";
  } else if (openaiKey) {
    openai = new OpenAI({
      apiKey: openaiKey,
    });
    defaultModel = "gpt-4o-mini";
    fallbackModel = null;
  } else {
    throw new Error(
      "No AI API key found. Please add GROQ_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY to your environment variables."
    );
  }

  _client = {
    chat: {
      completions: {
        create: async (params) => {
          // Normalize messages: Ensure system message has role: 'system'
          const messages = params.messages.map((m) => ({
            role: m.role as "system" | "user" | "assistant",
            content: m.content,
          }));

          try {
            const response = await openai.chat.completions.create({
              model: defaultModel,
              messages: messages as any,
              temperature: 0.2,
            });
            return response as unknown as ChatCompletionResult;
          } catch (err: any) {
            // If primary model hits rate limit or error, try fallback model if available
            if (fallbackModel) {
              console.warn(
                `Primary model ${defaultModel} failed (${err?.message}). Trying fallback ${fallbackModel}...`
              );
              const fallbackResponse = await openai.chat.completions.create({
                model: fallbackModel,
                messages: messages as any,
                temperature: 0.2,
              });
              return fallbackResponse as unknown as ChatCompletionResult;
            }
            throw err;
          }
        },
      },
    },
    functions: {
      invoke: async (name, args) => {
        if (name === "web_search") {
          const query = String(args.query || "");
          const cleanQuery = query.replace(/site:[^\s]+/gi, "").trim();

          const searchResults: Array<{ title: string; link: string; snippet: string }> = [];

          try {
            const options = {
              page: 0,
              safe: false,
              parse_ads: false,
              additional_params: { hl: "en" },
            };
            const response = await google.search(query, options);
            if (response?.results?.length) {
              for (const r of response.results.slice(0, 8)) {
                if (r.url && (r.title || r.description)) {
                  searchResults.push({
                    title: r.title || cleanQuery,
                    link: r.url,
                    snippet: r.description || "Job posting on " + (r.url.split("/")[2] || "web"),
                  });
                }
              }
            }
          } catch (searchErr) {
            console.warn("Live web scraping error, falling back to direct job search links:", searchErr);
          }

          // If web search returned fewer than 3 links, populate guaranteed real job search URLs
          if (searchResults.length < 3) {
            const enc = encodeURIComponent(cleanQuery || "Software Engineer");
            searchResults.push(
              {
                title: `${cleanQuery} Jobs on LinkedIn`,
                link: `https://www.linkedin.com/jobs/search/?keywords=${enc}`,
                snippet: `Live job listings for ${cleanQuery} on LinkedIn with active applications.`,
              },
              {
                title: `${cleanQuery} Openings on Indeed`,
                link: `https://www.indeed.com/jobs?q=${enc}`,
                snippet: `Search and apply to verified ${cleanQuery} jobs on Indeed.`,
              },
              {
                title: `${cleanQuery} Careers on Glassdoor`,
                link: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${enc}`,
                snippet: `Salaries, reviews, and job openings for ${cleanQuery} on Glassdoor.`,
              },
              {
                title: `${cleanQuery} Opportunities on Bayt`,
                link: `https://www.bayt.com/en/international/jobs/?q=${enc}`,
                snippet: `Top regional and international job openings for ${cleanQuery} on Bayt.com.`,
              }
            );
          }

          return searchResults;
        }
        throw new Error(`Function ${name} not implemented.`);
      },
    },
  };

  return _client;
}
