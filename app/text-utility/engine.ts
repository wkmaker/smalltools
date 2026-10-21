/**
 * 文字工具純函數引擎：
 * 單次巡訪 (Single-pass O(N)) 字元統計演算法，避免產生中介大字串與陣列，消除鍵盤打字掉幀。
 */

export interface TextStatistics {
  totalChars: number;
  totalCharsNoSpace: number;
  totalLines: number;
  chineseChars: number;
  englishWords: number;
}

export function computeTextStatistics(str: string): TextStatistics {
  const len = str ? str.length : 0;
  if (len === 0) {
    return {
      totalChars: 0,
      totalCharsNoSpace: 0,
      totalLines: 0,
      chineseChars: 0,
      englishWords: 0,
    };
  }

  let totalCharsNoSpace = 0;
  let totalLines = 1;
  let chineseChars = 0;
  let englishWords = 0;
  let inWord = false;

  for (let i = 0; i < len; i++) {
    const code = str.charCodeAt(i);

    // 換行符 (LF: 10)
    if (code === 10) {
      totalLines++;
    }

    // 非空白字元（排除空白 32、Tab 9、LF 10、CR 13 等）
    const isWhitespace = code === 32 || (code >= 9 && code <= 13);
    if (!isWhitespace) {
      totalCharsNoSpace++;
    }

    // 中文字元範圍 (Unicode CJK Unified Ideographs: 0x4E00 - 0x9FA5)
    if (code >= 0x4e00 && code <= 0x9fa5) {
      chineseChars++;
    }

    // 英文字母 (A-Z: 65-90, a-z: 97-122)
    const isAsciiLetter = (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    if (isAsciiLetter) {
      if (!inWord) {
        englishWords++;
        inWord = true;
      }
    } else {
      inWord = false;
    }
  }

  return {
    totalChars: len,
    totalCharsNoSpace,
    totalLines,
    chineseChars,
    englishWords,
  };
}
