import { keychainHasToken } from './tauri';

export const CLAUDE_KEY_REMOTE = 'llm-apikey-claude';
export const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-5';

export interface ClaudeModelOption {
  id: string;
  label: string;
  hint: string;
}

export const CLAUDE_MODELS: ClaudeModelOption[] = [
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', hint: '기본 · 품질과 비용의 균형' },
  { id: 'claude-opus-5', label: 'Claude Opus 5', hint: '가장 높은 품질 · 느리고 비쌈' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', hint: '가장 빠르고 저렴' },
];

export async function llmAvailable(): Promise<boolean> {
  try {
    return await keychainHasToken(CLAUDE_KEY_REMOTE);
  } catch {
    return false;
  }
}
