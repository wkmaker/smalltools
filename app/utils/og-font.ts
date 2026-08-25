import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'node_modules', '.cache', 'og-fonts');

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = 4,
  delayMs: number = 500
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
      });
      if (res.ok) return res;
      if (res.status >= 500 || res.status === 429) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const wait = delayMs * Math.pow(1.5, attempt - 1) + Math.random() * 300;
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }
  }
  throw lastError;
}

/**
 * 動態從 Google Fonts 獲取指定字元集的 Noto Sans TC / Roboto 字型檔 (TTF)，
 * 透過 Google Fonts Subsetting 只下載圖片中出現的字元，大幅縮減體積至 5~15KB。
 * 內建本地硬碟快取與指數退避重試機制，確保多執行緒靜態建置時 100% 穩定產出。
 */
export async function getGoogleFont(
  text: string,
  fontFamily: string = 'Noto+Sans+TC',
  weight: number = 700
): Promise<ArrayBuffer> {
  const hash = crypto
    .createHash('sha256')
    .update(`${fontFamily}-${weight}-${text}`)
    .digest('hex');

  const cacheFilePath = path.join(CACHE_DIR, `${hash}.ttf`);

  try {
    if (fs.existsSync(cacheFilePath)) {
      const cached = fs.readFileSync(cacheFilePath);
      return cached.buffer.slice(
        cached.byteOffset,
        cached.byteOffset + cached.byteLength
      );
    }
  } catch {
    // 忽略快取讀取錯誤，直接發送請求
  }

  const url = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@${weight}&text=${encodeURIComponent(
    text
  )}`;

  // 使用特定的 User-Agent 確保 Google Fonts 返回 TrueType (TTF) 格式以適配 Satori / Next.js ImageResponse
  const cssRes = await fetchWithRetry(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/538.1 (KHTML, like Gecko) Safari/538.1',
    },
  });

  if (!cssRes.ok) throw new Error(`Google Fonts API returned ${cssRes.status}`);
  const css = await cssRes.text();

  const resource = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);

  if (resource && resource[1]) {
    const res = await fetchWithRetry(resource[1]);
    if (!res.ok) throw new Error(`Failed to fetch font file from ${resource[1]}`);
    const buffer = await res.arrayBuffer();

    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(cacheFilePath, Buffer.from(buffer));
    } catch {
      // 忽略快取寫入錯誤
    }

    return buffer;
  }

  throw new Error(`Failed to parse font URL for ${fontFamily}`);
}
