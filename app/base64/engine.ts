/**
 * Base64 編碼／解碼純函式引擎（無 UI 依賴，可獨立單元測試）。
 */

export type EncodingType = 'UTF-8' | 'ASCII';

export function utf8ToB64(str: string): string {
  const safeStr = typeof str.toWellFormed === 'function' ? str.toWellFormed() : str;
  return btoa(
    encodeURIComponent(safeStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

export function b64ToUtf8(str: string): string {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(str), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

export interface EncodeOptions {
  encoding?: EncodingType;
  urlSafe?: boolean;
  rfc2045?: boolean;
}

export function encodeBase64Text(text: string, options: EncodeOptions = {}): string {
  if (!text) return '';
  const { encoding = 'UTF-8', urlSafe = false, rfc2045 = false } = options;
  let encoded = encoding === 'UTF-8' ? utf8ToB64(text) : btoa(text);
  if (urlSafe) {
    encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  if (rfc2045) {
    const chunks = encoded.match(/.{1,76}/g);
    encoded = chunks ? chunks.join('\n') : encoded;
  }
  return encoded;
}

export function decodeBase64Text(b64: string, encoding: EncodingType = 'UTF-8'): string {
  if (!b64) return '';
  let str = b64.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4 !== 0) {
    str += '=';
  }
  return encoding === 'UTF-8' ? b64ToUtf8(str) : atob(str);
}

export function extractRawBase64FromDataUrl(dataUrl: string): string {
  const commaIdx = dataUrl.indexOf(',');
  return commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : '';
}
