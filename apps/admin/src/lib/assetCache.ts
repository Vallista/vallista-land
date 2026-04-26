import { readAsset } from './tauri';

const cache = new Map<string, Promise<string>>();

export function loadAssetUrl(path: string): Promise<string> {
  let p = cache.get(path);
  if (p) return p;
  p = readAsset(path).then((a) => `data:${a.mime};base64,${a.base64}`);
  cache.set(path, p);
  p.catch(() => cache.delete(path));
  return p;
}
