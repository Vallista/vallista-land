import { invoke } from '@tauri-apps/api/core';
import type { DocSummary, DocFile, VaultInfo } from '@vallista/content-core';

export async function listDocs(): Promise<DocSummary[]> {
  return invoke<DocSummary[]>('list_docs');
}

export async function readDoc(path: string): Promise<DocFile> {
  return invoke<DocFile>('read_doc', { path });
}

export async function writeDoc(path: string, content: string): Promise<void> {
  await invoke('write_doc', { path, content });
}

export async function vaultInfo(): Promise<VaultInfo> {
  return invoke<VaultInfo>('vault_info');
}

if (typeof window !== 'undefined') {
  (window as unknown as { pensmith?: unknown }).pensmith = {
    listDocs,
    readDoc,
    writeDoc,
    vaultInfo,
  };
}
