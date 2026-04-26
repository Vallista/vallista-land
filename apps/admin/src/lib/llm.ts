import { llmChat, llmHealth, llmStart, llmStatus, llmStop, type LlmStatus } from './tauri';

export type LLMProviderKind = 'noop' | 'local';

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

class NoOpProvider implements LLMProvider {
  readonly kind = 'noop' as const;
  async isAvailable(): Promise<boolean> {
    return false;
  }
  async status(): Promise<LlmStatus | null> {
    return null;
  }
  async ensureRunning(): Promise<void> {
    throw new Error('local LLM is not available');
  }
  async chat(): Promise<string> {
    throw new Error('local LLM is not available');
  }
  async stop(): Promise<void> {}
}

class LocalLlamaProvider implements LLMProvider {
  readonly kind = 'local' as const;

  async isAvailable(): Promise<boolean> {
    const s = await llmStatus();
    return s.binPresent && s.models.length > 0;
  }

  async status(): Promise<LlmStatus | null> {
    return llmStatus();
  }

  async ensureRunning(modelName?: string): Promise<void> {
    const s = await llmStatus();
    if (!s.binPresent) {
      throw new Error(`llama-server binary missing at ${s.binPath}`);
    }
    if (s.models.length === 0) {
      throw new Error(`no .gguf models found in ${s.modelsDir}`);
    }
    if (s.running) {
      if (modelName && s.currentModel !== modelName) {
        await llmStop();
      } else {
        return;
      }
    }
    const target = modelName ?? s.models[0]!.name;
    await llmStart({ modelName: target });
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    return llmChat({
      messages,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });
  }

  async stop(): Promise<void> {
    await llmStop();
  }

  async health(): Promise<boolean> {
    return llmHealth();
  }
}

let cached: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (cached) return cached;
  if (typeof window === 'undefined') {
    cached = new NoOpProvider();
    return cached;
  }
  const hasTauri =
    '__TAURI_INTERNALS__' in window || '__TAURI__' in window || '__TAURI_METADATA__' in window;
  cached = hasTauri ? new LocalLlamaProvider() : new NoOpProvider();
  return cached;
}

export function resetLLMProvider(): void {
  cached = null;
}
