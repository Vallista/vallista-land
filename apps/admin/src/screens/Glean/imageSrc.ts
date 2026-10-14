import { gleanAssetUrl } from '../../lib/tauri';

/** 저장 시 분리된 이미지의 본문 참조. `[img]asset:<n>.<ext>` */
export const ASSET_REF = 'asset:';

export function isAssetRef(ref: string): boolean {
  return ref.startsWith(ASSET_REF);
}

export function assetFileName(ref: string): string {
  return ref.slice(ASSET_REF.length);
}

/** 분리된 이미지는 glean:// 프로토콜 URL로, data URI·외부 URL은 그대로 돌려준다. */
export function resolveGleanImage(itemId: string, ref: string): string {
  return isAssetRef(ref) ? gleanAssetUrl(itemId, assetFileName(ref)) : ref;
}
