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

function sanitizeKey(val?: string | null): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "");
}

interface ProviderConfig {
  name: string;
  client: OpenAI;
  model: string;
  fallbackModel?: string;
}

/**
 * Auto-detecting, Self-Healing Multi-Provider AI Client:
 * Scans all environment variables, inspects key prefixes (gsk_, AIza, sk-or-, sk-),
 * and automatically routes to the correct provider with automatic failover.
 */
export async function createAIClient(): Promise<AIClient> {
  if (_client) return _client;

  // Gather and sanitize all possible keys
  const groqKey = sanitizeKey(process.env.GROQ_API_KEY);
  const openRouterKey = sanitizeKey(process.env.OPENROUTER_API_KEY);
  const geminiKey = sanitizeKey(process.env.GEMINI_API_KEY);
  const openaiKey = sanitizeKey(process.env.OPENAI_API_KEY);

  // Collect all non-empty candidate keys from env
  const allEnvKeys = [
    groqKey,
    openRouterKey,
    geminiKey,
    openaiKey,
    sanitizeKey(process.env.AI_API_KEY),
  ].filter(Boolean);

  const providers: ProviderConfig[] = [];

  // 1. Check for Groq keys (starts with gsk_ or passed in GROQ_API_KEY)
  const actualGroqKey = allEnvKeys.find((k) => k.startsWith("gsk_")) || (groqKey && !groqKey.startsWith("AIza") && !groqKey.startsWith("sk-") ? groqKey : "");
  if (actualGroqKey) {
    providers.push({
      name: "Groq",
      client: new OpenAI({
        apiKey: actualGroqKey,
        baseURL: "https://api.groq.com/openai/v1",
      }),
      model: "llama-3.3-70b-versatile",
      fallbackModel: "llama-3.1-8b-instant",
    });
  }

  // 2. Check for OpenRouter keys (starts with sk-or- or passed in OPENROUTER_API_KEY)
  const actualOpenRouterKey = allEnvKeys.find((k) => k.startsWith("sk-or-")) || openRouterKey;
  if (actualOpenRouterKey) {
    providers.push({
      name: "OpenRouter",
      client: new OpenAI({
        apiKey: actualOpenRouterKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://ai-agent-job-finder.vercel.app",
          "X-Title": "AI Job Matcher",
        },
      }),
      model: "meta-llama/llama-3.3-70b-instruct:free",
      fallbackModel: "google/gemini-2.0-flash-exp:free",
    });
  }

  // 3. Check for OpenAI keys (starts with sk- and not sk-or-)
  const actualOpenAIKey = allEnvKeys.find((k) => k.startsWith("sk-") && !k.startsWith("sk-or-")) || openaiKey;
  if (actualOpenAIKey) {
    providers.push({
      name: "OpenAI",
      client: new OpenAI({
        apiKey: actualOpenAIKey,
      }),
      model: "gpt-4o-mini",
    });
  }

  // 4. Check for Google Gemini keys (starts with AIza or passed in GEMINI_API_KEY)
  const actualGeminiKey = allEnvKeys.find((k) => k.startsWith("AIza")) || geminiKey;
  if (actualGeminiKey) {
    providers.push({
      name: "Gemini",
      client: new OpenAI({
        apiKey: actualGeminiKey,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      }),
      model: "gemini-1.5-flash",
      fallbackModel: "gemini-2.0-flash",
    });
  }

  if (providers.length === 0) {
    throw new Error(
      "No valid AI API Key found. Please add a GROQ_API_KEY (starts with gsk_), OPENROUTER_API_KEY, or OPENAI_API_KEY in your Vercel Environment Variables."
    );
  }

  _client = {
    chat: {
      completions: {
        create: async (params) => {
          const messages = params.messages.map((m) => ({
            role: m.role as "system" | "user" | "assistant",
            content: m.content,
          }));

          let lastError: any = null;

          // Try available providers in order with automatic fallback
          for (const prov of providers) {
            try {
              const response = await prov.client.chat.completions.create({
                model: prov.model,
                messages: messages as any,
                temperature: 0.2,
              });
              return response as unknown as ChatCompletionResult;
            } catch (err: any) {
              console.warn(`Provider ${prov.name} with model ${prov.model} failed:`, err?.message);
              lastError = err;

              // Try provider's fallback model if available
              if (prov.fallbackModel) {
                try {
                  const fallbackResp = await prov.client.chat.completions.create({
                    model: prov.fallbackModel,
                    messages: messages as any,
                    temperature: 0.2,
                  });
                  return fallbackResp as unknown as ChatCompletionResult;
                } catch (fallbackErr: any) {
                  console.warn(`Provider ${prov.name} fallback ${prov.fallbackModel} failed:`, fallbackErr?.message);
                  lastError = fallbackErr;
                }
              }
            }
          }

          // If all providers failed, throw helpful error with provider name
          const errDetail = lastError?.message || "Unknown error";
          throw new Error(
            `AI completion failed on ${providers.map((p) => p.name).join(", ")}. Error: ${errDetail}. Please verify your API key in Vercel Settings -> Environment Variables.`
          );
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
                    snippet: r.description || "Job opening on " + (r.url.split("/")[2] || "web"),
                  });
                }
              }
            }
          } catch (searchErr) {
            console.warn("Live web scraping error, generating targeted direct job links:", searchErr);
          }

          if (searchResults.length < 3) {
            const enc = encodeURIComponent(cleanQuery || "Software Engineer");
            searchResults.push(
              {
                title: `${cleanQuery} Jobs on LinkedIn`,
                link: `https://www.linkedin.com/jobs/search/?keywords=${enc}&f_TPR=r2592000`,
                snippet: `Live active job openings for ${cleanQuery} on LinkedIn.`,
              },
              {
                title: `${cleanQuery} Careers on Indeed`,
                link: `https://www.indeed.com/jobs?q=${enc}`,
                snippet: `Search and apply directly to verified ${cleanQuery} jobs on Indeed.`,
              },
              {
                title: `${cleanQuery} on Google Jobs`,
                link: `https://www.google.com/search?q=${enc}+jobs&ibp=htl;jobs`,
                snippet: `Aggregated Google for Jobs search for ${cleanQuery}.`,
              },
              {
                title: `${cleanQuery} on Glassdoor`,
                link: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${enc}`,
                snippet: `Open positions and hiring companies for ${cleanQuery} on Glassdoor.`,
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
