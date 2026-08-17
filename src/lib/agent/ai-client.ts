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

function cleanKey(val?: string | null): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "");
}

/**
 * Direct HTTP caller for Groq with automatic model failover.
 * Tries llama-3.3-70b-versatile -> llama-3.1-8b-instant -> mixtral-8x7b-32768
 */
async function callGroqDirect(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"];
  let lastErr = "";

  for (const model of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      lastErr = data?.error?.message || `HTTP ${res.status}`;
    } catch (e: any) {
      lastErr = e?.message || "Network error";
    }
  }

  throw new Error(`Groq failed: ${lastErr}`);
}

/**
 * Direct HTTP caller for OpenRouter (Free models)
 */
async function callOpenRouterDirect(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const models = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "deepseek/deepseek-chat:free",
  ];
  let lastErr = "";

  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ai-agent-job-finder.vercel.app",
          "X-Title": "AI Job Matcher",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      lastErr = data?.error?.message || `HTTP ${res.status}`;
    } catch (e: any) {
      lastErr = e?.message || "Network error";
    }
  }

  throw new Error(`OpenRouter failed: ${lastErr}`);
}

/**
 * Direct HTTP caller for OpenAI
 */
async function callOpenAIDirect(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.2,
    }),
  });

  const data = await res.json();
  if (res.ok && data?.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }

  throw new Error(`OpenAI failed: ${data?.error?.message || `HTTP ${res.status}`}`);
}

export async function createAIClient(): Promise<AIClient> {
  if (_client) return _client;

  const groqKey = cleanKey(process.env.GROQ_API_KEY);
  const openRouterKey = cleanKey(process.env.OPENROUTER_API_KEY);
  const geminiKey = cleanKey(process.env.GEMINI_API_KEY);
  const openaiKey = cleanKey(process.env.OPENAI_API_KEY);
  const genericKey = cleanKey(process.env.AI_API_KEY);

  const allKeys = [groqKey, openRouterKey, geminiKey, openaiKey, genericKey].filter(Boolean);

  // Find keys by prefix or name
  const foundGroq = allKeys.find((k) => k.startsWith("gsk_")) || (groqKey && !groqKey.startsWith("AIza") && !groqKey.startsWith("sk-") ? groqKey : "");
  const foundOpenRouter = allKeys.find((k) => k.startsWith("sk-or-")) || openRouterKey;
  const foundOpenAI = allKeys.find((k) => k.startsWith("sk-") && !k.startsWith("sk-or-")) || openaiKey;

  _client = {
    chat: {
      completions: {
        create: async (params) => {
          const messages = params.messages.map((m) => ({
            role: m.role as "system" | "user" | "assistant",
            content: m.content,
          }));

          // 1. Try Groq if key exists
          if (foundGroq) {
            try {
              const text = await callGroqDirect(foundGroq, messages);
              return { choices: [{ message: { content: text } }] };
            } catch (groqErr: any) {
              console.warn("Groq attempt failed:", groqErr?.message);
              if (!foundOpenRouter && !foundOpenAI) {
                throw groqErr;
              }
            }
          }

          // 2. Try OpenRouter if key exists
          if (foundOpenRouter) {
            try {
              const text = await callOpenRouterDirect(foundOpenRouter, messages);
              return { choices: [{ message: { content: text } }] };
            } catch (orErr: any) {
              console.warn("OpenRouter attempt failed:", orErr?.message);
              if (!foundOpenAI) {
                throw orErr;
              }
            }
          }

          // 3. Try OpenAI if key exists
          if (foundOpenAI) {
            const text = await callOpenAIDirect(foundOpenAI, messages);
            return { choices: [{ message: { content: text } }] };
          }

          throw new Error(
            "No working AI API Key found. Please add a valid GROQ_API_KEY (starts with gsk_) in your Vercel Project Settings -> Environment Variables."
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

          // 1. Try Jina AI Search (Free, reliable, works from cloud servers)
          try {
            const jinaRes = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
              headers: {
                Accept: "application/json",
                "X-No-Cache": "true",
              },
              signal: AbortSignal.timeout(4000),
            });

            if (jinaRes.ok) {
              const jinaData = await jinaRes.json();
              const items = Array.isArray(jinaData?.data) ? jinaData.data : [];
              for (const item of items.slice(0, 8)) {
                if (item.url && (item.title || item.description)) {
                  searchResults.push({
                    title: item.title || cleanQuery,
                    link: item.url,
                    snippet: item.description || item.content?.slice(0, 180) || "Active job listing / company vacancy.",
                  });
                }
              }
            }
          } catch {
            // fallback to next search engine
          }

          // 2. Fallback to Google scraper if fewer than 3 results
          if (searchResults.length < 3) {
            try {
              const options = {
                page: 0,
                safe: false,
                parse_ads: false,
                additional_params: { hl: "en" },
              };
              const response = await google.search(query, options);
              if (response?.results?.length) {
                for (const r of response.results.slice(0, 6)) {
                  if (r.url && (r.title || r.description)) {
                    searchResults.push({
                      title: r.title || cleanQuery,
                      link: r.url,
                      snippet: r.description || "Job posting on " + (r.url.split("/")[2] || "web"),
                    });
                  }
                }
              }
            } catch {
              // fallback
            }
          }

          // 3. Guarantee direct company career search links if still empty
          if (searchResults.length < 3) {
            const enc = encodeURIComponent(cleanQuery || "Software Engineer");
            searchResults.push(
              {
                title: `${cleanQuery} - Active Openings on LinkedIn`,
                link: `https://www.linkedin.com/jobs/search/?keywords=${enc}&f_TPR=r2592000`,
                snippet: `Verified live job offers and hiring companies for ${cleanQuery} on LinkedIn.`,
              },
              {
                title: `${cleanQuery} - Direct Company Vacancies on Indeed`,
                link: `https://www.indeed.com/jobs?q=${enc}`,
                snippet: `Browse company job postings and apply for ${cleanQuery} on Indeed.`,
              },
              {
                title: `${cleanQuery} - Google Jobs Board Search`,
                link: `https://www.google.com/search?q=${enc}+jobs&ibp=htl;jobs`,
                snippet: `Direct multi-source job offers matching ${cleanQuery} on Google for Jobs.`,
              },
              {
                title: `${cleanQuery} - Regional Opportunities on Bayt`,
                link: `https://www.bayt.com/en/international/jobs/?q=${enc}`,
                snippet: `Regional and international company positions for ${cleanQuery} on Bayt.com.`,
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
