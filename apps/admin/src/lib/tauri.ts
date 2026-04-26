import { invoke } from '@tauri-apps/api/core';
import type {
  DocSummary,
  DocFile,
  VaultInfo,
  GleanItem,
  GleanHighlight,
  GleanSource,
  GleanStatus,
} from '@vallista/content-core';

export interface AssetData {
  mime: string;
  base64: string;
}

export interface GleanInput {
  id: string;
  url: string;
  source: GleanSource;
  title: string;
  excerpt: string;
  body: string;
}

export async function listDocs(): Promise<DocSummary[]> {
  return invoke<DocSummary[]>('list_docs');
}

export async function readDoc(path: string): Promise<DocFile> {
  return invoke<DocFile>('read_doc', { path });
}

export async function writeDoc(path: string, content: string): Promise<void> {
  await invoke('write_doc', { path, content });
}

export async function readAsset(path: string): Promise<AssetData> {
  return invoke<AssetData>('read_asset', { path });
}

export async function listGlean(): Promise<GleanItem[]> {
  return invoke<GleanItem[]>('list_glean');
}

export async function readGlean(id: string): Promise<GleanItem> {
  return invoke<GleanItem>('read_glean', { id });
}

export async function addGlean(input: GleanInput): Promise<GleanItem> {
  return invoke<GleanItem>('add_glean', { input });
}

export async function updateGleanStatus(
  id: string,
  status: GleanStatus,
  promotedDocId?: string,
): Promise<GleanItem> {
  return invoke<GleanItem>('update_glean_status', {
    id,
    status,
    promotedDocId: promotedDocId ?? null,
  });
}

export async function updateGleanHighlights(
  id: string,
  highlights: GleanHighlight[],
): Promise<GleanItem> {
  return invoke<GleanItem>('update_glean_highlights', { id, highlights });
}

export async function deleteGlean(id: string): Promise<void> {
  await invoke('delete_glean', { id });
}

export interface FetchedContent {
  url: string;
  title: string;
  excerpt: string;
  body: string;
  sourceGuess: GleanSource;
}

export async function fetchUrl(url: string): Promise<FetchedContent> {
  return invoke<FetchedContent>('fetch_url', { url });
}

export async function vaultInfo(): Promise<VaultInfo> {
  return invoke<VaultInfo>('vault_info');
}

if (typeof window !== 'undefined') {
  (window as unknown as { pensmith?: unknown }).pensmith = {
    listDocs,
    readDoc,
    writeDoc,
    readAsset,
    listGlean,
    readGlean,
    addGlean,
    updateGleanStatus,
    updateGleanHighlights,
    deleteGlean,
    fetchUrl,
    vaultInfo,
  };
}
