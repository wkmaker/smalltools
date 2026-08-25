/**
 * 動態從 Google Fonts 獲取指定字元集的 Noto Sans TC / Roboto 字型檔 (TTF)，
 * 透過 Google Fonts Subsetting 只下載圖片中出現的字元，大幅縮減體積至 5~15KB。
 */
export async function getGoogleFont(
  text: string,
  fontFamily: string = 'Noto+Sans+TC',
  weight: number = 700
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@${weight}&text=${encodeURIComponent(
    text
  )}`;

  // 使用特定的 User-Agent 確保 Google Fonts 返回 TrueType (TTF) 格式以適配 Satori / Next.js ImageResponse
  const css = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/538.1 (KHTML, like Gecko) Safari/538.1',
    },
  }).then((res) => {
    if (!res.ok) throw new Error(`Google Fonts API returned ${res.status}`);
    return res.text();
  });

  const resource = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);

  if (resource && resource[1]) {
    const res = await fetch(resource[1]);
    if (!res.ok) throw new Error(`Failed to fetch font file from ${resource[1]}`);
    return await res.arrayBuffer();
  }

  throw new Error(`Failed to parse font URL for ${fontFamily}`);
}
