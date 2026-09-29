import {
  keychainHasToken,
  keychainSetToken,
  llmChat,
  llmGetApiKey,
  llmGetSettings,
  llmHealth,
  llmSaveSettings,
  llmStart,
  llmStatus,
  llmStop,
  type LlmSettings,
  type LlmStatus,
} from './tauri';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

export type LLMProviderKind = 'noop' | 'local' | 'claude' | 'openai' | 'gemini';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  readonly kind: LLMProviderKind;
  isAvailable(): Promise<boolean>;
  status(): Promise<LlmStatus | null>;
  ensureRunning(modelName?: string): Promise<void>;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
  stop(): Promise<void>;
}

// ── NoOp ──────────────────────────────────────────────────────
class NoOpProvider implements LLMProvider {
  readonly kind = 'noop' as const;
  async isAvailable() {
    return false;
  }
  async status() {
    return null;
  }
  async ensureRunning(): Promise<void> {
    throw new Error('LLM을 사용할 수 없습니다');
  }
  async chat(): Promise<string> {
    throw new Error('LLM을 사용할 수 없습니다');
  }
  async stop(): Promise<void> {}
}

// ── Local llama.cpp ───────────────────────────────────────────
class LocalLlamaProvider implements LLMProvider {
  readonly kind = 'local' as const;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;

  private resetIdleTimer() {
    if (this.idleTimer !== null) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(async () => {
      this.idleTimer = null;
      await llmStop().catch(() => {});
    }, IDLE_TIMEOUT_MS);
  }

  async isAvailable() {
    const s = await llmStatus();
    return s.binPresent && s.models.length > 0;
  }

  async status() {
    return llmStatus();
  }

  private async waitUntilReady(maxWaitMs = 90_000) {
    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      try {
        if (await llmHealth()) return;
      } catch {}
      await new Promise<void>((r) => setTimeout(r, 800));
    }
    throw new Error('LLM 서버가 90초 내에 준비되지 않았습니다');
  }

  async ensureRunning(modelName?: string) {
    const s = await llmStatus();
    if (!s.binPresent) throw new Error(`llama-server binary missing at ${s.binPath}`);
    if (s.models.length === 0) throw new Error(`no .gguf models found in ${s.modelsDir}`);
    if (s.running) {
      if (modelName && s.currentModel !== modelName) await llmStop();
      else {
        await this.waitUntilReady();
        return;
      }
    }
    const target = modelName ?? s.models[0]!.name;
    await llmStart({ modelName: target });
    await this.waitUntilReady();
  }

  async chat(messages: ChatMessage[], options?: ChatOptions) {
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const result = await llmChat({
          messages,
          temperature: options?.temperature,
          maxTokens: options?.maxTokens,
        });
        this.resetIdleTimer();
        return result;
      } catch (e) {
        const msg = String(e);
        if (msg.includes('503') && msg.includes('Loading model') && attempt < 5) {
          await new Promise<void>((r) => setTimeout(r, 2000));
          continue;
        }
        throw e;
      }
    }
    throw new Error('LLM chat failed after retries');
  }

  async stop() {
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    await llmStop();
  }
}

// ── Claude API ───────────────────────────────────────────────
class ClaudeProvider implements LLMProvider {
  readonly kind = 'claude' as const;
  constructor(private model: string) {}

  async isAvailable() {
    return keychainHasToken('llm-apikey-claude');
  }
  async status() {
    return null;
  }
  async ensureRunning() {
    const ok = await this.isAvailable();
    if (!ok) throw new Error('Claude API 키가 설정되지 않았습니다');
  }

  async chat(messages: ChatMessage[], options?: ChatOptions) {
    const key = await llmGetApiKey('claude');
    if (!key) throw new Error('Claude API 키가 없습니다');
    const systemMsg = messages.find((m) => m.role === 'system');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options?.maxTokens ?? 2048,
        messages: messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role, content: m.content })),
        ...(systemMsg ? { system: systemMsg.content } : {}),
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`Claude API error ${res.status}: ${err}`);
    }
    const data = (await res.json()) as {
      content: Array<{ type: string; text: string }>;
    };
    return data.content.find((c) => c.type === 'text')?.text ?? '';
  }

  async stop() {}
}

// ── OpenAI API ───────────────────────────────────────────────
class OpenAIProvider implements LLMProvider {
  readonly kind = 'openai' as const;
  constructor(private model: string) {}

  async isAvailable() {
    return keychainHasToken('llm-apikey-openai');
  }
  async status() {
    return null;
  }
  async ensureRunning() {
    const ok = await this.isAvailable();
    if (!ok) throw new Error('OpenAI API 키가 설정되지 않았습니다');
  }

  async chat(messages: ChatMessage[], options?: ChatOptions) {
    const key = await llmGetApiKey('openai');
    if (!key) throw new Error('OpenAI API 키가 없습니다');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: options?.maxTokens ?? 2048,
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }
    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message.content ?? '';
  }

  async stop() {}
}

// ── Gemini API ───────────────────────────────────────────────
class GeminiProvider implements LLMProvider {
  readonly kind = 'gemini' as const;
  constructor(private model: string) {}

  async isAvailable() {
    return keychainHasToken('llm-apikey-gemini');
  }
  async status() {
    return null;
  }
  async ensureRunning() {
    const ok = await this.isAvailable();
    if (!ok) throw new Error('Gemini API 키가 설정되지 않았습니다');
  }

  async chat(messages: ChatMessage[], options?: ChatOptions) {
    const key = await llmGetApiKey('gemini');
    if (!key) throw new Error('Gemini API 키가 없습니다');
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    const systemMsg = messages.find((m) => m.role === 'system');
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents,
          ...(systemMsg
            ? { systemInstruction: { parts: [{ text: systemMsg.content }] } }
            : {}),
          generationConfig: { maxOutputTokens: options?.maxTokens ?? 2048 },
        }),
      },
    );
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }
    const data = (await res.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    return data.candidates[0]?.content.parts[0]?.text ?? '';
  }

  async stop() {}
}

// ── Provider factory ─────────────────────────────────────────
let cached: LLMProvider | null = null;

function hasTauri(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window || '__TAURI_METADATA__' in window)
  );
}

function createProvider(settings: LlmSettings): LLMProvider {
  if (!hasTauri()) return new NoOpProvider();
  switch (settings.provider) {
    case 'claude':
      return new ClaudeProvider(settings.claudeModel ?? 'claude-sonnet-4-6');
    case 'openai':
      return new OpenAIProvider(settings.openaiModel ?? 'gpt-4o');
    case 'gemini':
      return new GeminiProvider(settings.geminiModel ?? 'gemini-2.0-flash');
    default:
      return new LocalLlamaProvider();
  }
}

export async function loadLLMProvider(): Promise<LLMProvider> {
  if (!hasTauri()) {
    cached = new NoOpProvider();
    return cached;
  }
  try {
    const settings = await llmGetSettings();
    cached = createProvider(settings);
  } catch {
    cached = new LocalLlamaProvider();
  }
  return cached!;
}

export function getLLMProvider(): LLMProvider {
  if (cached) return cached;
  cached = hasTauri() ? new LocalLlamaProvider() : new NoOpProvider();
  return cached;
}

export function resetLLMProvider(): void {
  cached = null;
}

export { llmGetSettings, llmSaveSettings, keychainSetToken, keychainHasToken };
