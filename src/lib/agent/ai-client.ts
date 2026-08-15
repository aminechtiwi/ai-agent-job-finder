/**
 * AI Client abstraction layer.
 *
 * Wraps an OpenAI-compatible SDK so the rest of the codebase never
 * references a vendor-specific package directly. Swap the underlying
 * provider by changing this single file.
 */

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
// Replace the import below with any OpenAI-compatible SDK.
// ---------------------------------------------------------------------------

let _client: AIClient | null = null;

/**
 * Create (or return the cached) AI client instance.
 *
 * The concrete SDK is imported only here, so the rest of the codebase
 * stays provider-agnostic.  To switch providers, change only this function.
 */
export async function createAIClient(): Promise<AIClient> {
  if (_client) return _client;

  // Dynamic import so the concrete SDK name only appears here.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SDK = (await import("z-ai-web-dev-sdk")).default;
  _client = await SDK.create();
  return _client as AIClient;
}
