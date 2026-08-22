'use client';

import { useState, useRef, useCallback, useEffect, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './base64.module.css';

function utf8ToB64(str: string): string {
  const safeStr = typeof str.toWellFormed === 'function' ? str.toWellFormed() : str;
  return btoa(
    encodeURIComponent(safeStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

function b64ToUtf8(str: string): string {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(str), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

type TabType = 'text' | 'file';
type EncodingType = 'UTF-8' | 'ASCII';

interface FileState {
  file: File | null;
  dataUrl: string;
  rawBase64: string;
  previewType: 'image' | 'audio' | 'video' | 'text' | 'binary' | null;
  previewContent: string;
  loading: boolean;
}

interface Props {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: 'Base64 線上編碼與解碼器',
    subtitle: 'BASE64 ENCODER & DECODER',
    description:
      '專業免費的線上 Base64 編碼與解碼工具，支援純文字與檔案的快速雙向轉換，提供 UTF-8 中文解碼防亂碼、Data URL 生成與多媒體預覽功能。',
    langToggleLabel: 'English',
    langToggleUrl: '/base64/en/',
    tabText: '文字編解碼',
    tabFile: '檔案轉 Base64',
    plainTextLabel: '純文字 (Plain Text)',
    base64TextLabel: 'Base64 編碼文字',
    charCount: (count: number) => `${count} 字元`,
    placeholderPlain: '在此輸入要編碼的文字... (支援中文/外語/表情符號)',
    placeholderBase64: '在此貼上 Base64 代碼進行解碼...',
    encodingLabel: '編碼方式：',
    exampleBtn: '範例',
    clearBtn: '清除',
    copyBtn: '複製',
    shareBtn: '複製 Base64 試算分享連結',
    invalidFormat: '無效的 Base64 格式',
    urlSafeLabel: 'URL 安全格式 (-_無等號)',
    rfc2045Label: '自動換行 (76字元)',
    dropzoneText: '將檔案拖曳至此處，或點擊選擇檔案',
    dropzoneSub: '支援圖片、音訊、影片、文件等，大小建議小於 30MB',
    removeFile: '移除檔案',
    dataPreview: '資料預覽 (Data Preview)',
    binaryNoPreview: '二進制檔案，不支援即時預覽',
    dataUrlLabel: '完整 Data URL 格式 (可用於 HTML/CSS)',
    rawBase64Label: '純 Base64 編碼數據 (Raw Base64)',
    copyDataUrl: '複製 Data URL',
    copyRawData: '複製純數據',
    toastCopied: '已複製到剪貼簿',
    toastCopyFailed: '複製失敗，請手動複製',
    toastNoContent: '沒有可複製的內容',
    toastFileTooLarge: '檔案過大，請選擇小於 30MB 的檔案',
    toastReadError: '檔案讀取出錯',
    toastShareCopied: '分享連結已複製到剪貼簿',
    textDecodeFailed: '文字檔案預覽解碼失敗',
    previewTruncatedBadge: '文字預覽已截取前 3,000 字 (完整 Base64 已於下方生成)',
    truncatedSuffix: '\n\n... (檔案內容較長，此處僅顯示前 3,000 字元預覽 / 完整 Base64 數據已於下方生成)',

    // FAQ
    faqTitle: '常見問題與專業指南 (FAQ)',
    faqSubtitle: '深入了解 Base64 編碼原理、UTF-8 中文防亂碼技術、URL-Safe 規範與 Data URL 應用',
    faqItems: [
      {
        q: '什麼是 Base64 編碼？為什麼需要將二進位或文字轉換為 Base64？',
        a: 'Base64 是一種基於 64 個可列印 ASCII 字元（A-Z, a-z, 0-9, +, /）的二進位轉文字編碼法：\n\n① 解決傳輸亂碼問題：\n網路早期許多通訊協議（如 Email MIME、HTTP Header、URL 參數）僅支援 7-bit 或 ASCII 文字傳輸。直接傳輸原始二進位數據（如圖片、音訊、憑證）容易因傳輸節點編碼轉換而損毀。\n\n② 安全傳輸媒介：\n透過 Base64 將任意二進位位元組流轉換為標準純文字，能確保在任何媒介與資料庫中 100% 完整無損地傳遞。',
      },
      {
        q: '為什麼中文或特殊符號在 Base64 解碼時容易出現亂碼？本工具如何解決？',
        a: '傳統解碼出現亂碼的主因與解決方案如下：\n\n① 原生 API 限制：\n瀏覽器傳統的 `btoa()` 與 `atob()` 僅原生支援 8-bit Latin1 字元集。當字串包含多位元組的 UTF-8 中文字元或 Emoji 表情符號時，會直接拋出 `InvalidCharacterError` 錯誤。\n\n② 本工具之 UTF-8 深度支援：\n本工具採用 `encodeURIComponent` 與 TypedArray 位元組流轉換演算法，原生支援繁體中文、各國多語系文字與 Emoji 表情符號之雙向正確編碼與解碼，徹底告別亂碼困擾。',
      },
      {
        q: '什麼是「URL-Safe Base64」？它與標準 Base64 有何不同？',
        a: 'URL-Safe Base64 是為適應網址與檔案路徑而衍生的標準變體（RFC 4648 §5）：\n\n① 替換特殊字元：\n標準 Base64 中的 `+` 與 `/` 在 URL 網址中具有特殊語意（如 `+` 代表空白、`/` 代表目錄路徑）。URL-Safe 格式將 `+` 替換為 `-`（減號）、將 `/` 替換為 `_`（底線）。\n\n② 移除補位符號：\nURL-Safe 格式通常會移除結尾的 `=` 補位字元，使其能直接安全嵌入 HTTP GET 網址參數、檔名或 JWT (JSON Web Token) 的 Token 字串中。',
      },
      {
        q: '資料在經過 Base64 編碼後，為什麼檔案體積會膨脹約 33%？',
        a: '體積膨脹是 Base64 的數學換算特性：\n\n① 3 位元組轉 4 字元：\nBase64 將每 3 個原始位元組（3 Bytes × 8 bits = 24 bits）重新切分為 4 個 6-bit 單位（4 × 6 = 24 bits），每個 6-bit 單位對應至一個 ASCII 字元。\n\n② 固定膨脹比率：\n編碼後的輸出字元數固定為原始位元組數的 4/3 倍（即約增加 33.3% 體積）。若原始數據長度無法被 3 整除，結尾會補上 1 至 2 個 `=` 作為填充符號。',
      },
      {
        q: '什麼是「Data URL (data:image/png;base64,...)」？在前端開發有哪些應用場景？',
        a: 'Data URL 是一種將小型檔案直接以 Base64 內聯嵌入 HTML/CSS 的前綴協議：\n\n① 語法結構：\n標準格式為 `data:[<MIME-type>][;base64],<data>`，例如 `data:image/svg+xml;base64,...`。\n\n② 應用場景與優缺點：\n適合將小於 10KB 的小圖標 (Icon)、SVG 或字型直接內嵌在單一 HTML/CSS 檔案中，減少 HTTP 網路連線請求次數以加速首屏渲染；但大於 50KB 的檔案建議仍以外部檔案載入以利瀏覽器快取。',
      },
      {
        q: 'Base64 是一種加密演算法嗎？可以用來儲存機密密碼嗎？',
        a: '絕對不是！Base64 僅是一種「公開透明的資料編碼格式」：\n\n① 零安全性：\nBase64 沒有密鑰概念，任何人都可以使用公開演算法直接反向解碼還原出原始內容。\n\n② 安全防護建議：\n切勿將 Base64 用於儲存或傳輸密碼、API 金鑰或敏感個人資料。若需資料保密，請採用 AES、RSA 等標準密碼學加密技術，或使用 SHA-256、bcrypt 等安全雜湊函數。',
      },
      {
        q: '在線上進行檔案與圖片轉 Base64 是否有資料外洩風險？',
        a: '完全沒有！本工具為 100% 純前端（Client-Side）運算架構：\n\n① 本機記憶體處理：\n透過瀏覽器 HTML5 FileReader API 直接在您的本機記憶體中完成檔案編碼與預覽。\n\n② 零雲端上傳：\n所有文字與檔案數據均不會上傳至任何伺服器或第三方平台，確保您的商業機密與隱私安全。',
      },
    ],
  },
  en: {
    title: 'Base64 Encoder & Decoder',
    subtitle: 'BASE64 ENCODER & DECODER',
    description:
      'Professional free online Base64 encoder and decoder tool. Fast bidirectional text & file conversion, UTF-8 non-garbled decoding, Data URL generation, and multimedia preview.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/base64/',
    tabText: 'Text Encoder / Decoder',
    tabFile: 'File to Base64',
    plainTextLabel: 'Plain Text',
    base64TextLabel: 'Base64 Encoded Text',
    charCount: (count: number) => `${count} chars`,
    placeholderPlain: 'Type text here to encode... (Supports UTF-8 / Emojis)',
    placeholderBase64: 'Paste Base64 string here to decode...',
    encodingLabel: 'Encoding:',
    exampleBtn: 'Sample',
    clearBtn: 'Clear',
    copyBtn: 'Copy',
    shareBtn: 'Copy Shareable Link',
    invalidFormat: 'Invalid Base64 format',
    urlSafeLabel: 'URL Safe (-_ no padding)',
    rfc2045Label: 'Line Wrap (76 chars)',
    dropzoneText: 'Drag & drop a file here, or click to browse',
    dropzoneSub: 'Supports images, audio, video, documents (Max 30MB)',
    removeFile: 'Remove File',
    dataPreview: 'Data Preview',
    binaryNoPreview: 'Binary file, live preview unavailable',
    dataUrlLabel: 'Complete Data URL format (for HTML/CSS)',
    rawBase64Label: 'Raw Base64 Data',
    copyDataUrl: 'Copy Data URL',
    copyRawData: 'Copy Raw Data',
    toastCopied: 'Copied to clipboard',
    toastCopyFailed: 'Copy failed, please copy manually',
    toastNoContent: 'Nothing to copy',
    toastFileTooLarge: 'File is too large, please select a file under 30MB',
    toastReadError: 'Error reading file',
    toastShareCopied: 'Shareable link copied to clipboard',
    textDecodeFailed: 'Text file preview decoding failed',
    previewTruncatedBadge: 'Preview truncated to first 3,000 chars (Full Base64 ready below)',
    truncatedSuffix: '\n\n... (Content Truncated for Preview / Full Base64 available below)',

    // FAQ
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Everything you need to know about Base64 principles, UTF-8 encoding, URL-Safe format, and Data URLs',
    faqItems: [
      {
        q: 'What is Base64 encoding, and why is it necessary to convert binary data or text to Base64?',
        a: 'Base64 is a binary-to-text encoding scheme that translates raw bytes into a radix-64 representation using 64 printable ASCII characters (A-Z, a-z, 0-9, +, /):\n\n① Preventing Data Corruption in Transit:\nEarly networking protocols (Email MIME, HTTP Headers, URL query strings) only supported 7-bit or ASCII character sets. Direct transmission of raw binary streams (images, audio, cryptographic keys) resulted in corrupt bytes due to system-level encoding translations.\n\n② Universal Compatibility:\nBase64 guarantees that arbitrary binary data travels safely and intact through text-only transmission channels and databases.',
      },
      {
        q: 'Why do Chinese or special Unicode characters often get garbled during Base64 decoding, and how does this tool fix it?',
        a: 'Garbled output arises from JavaScript legacy character set limitations:\n\n① Native JavaScript Limitations:\nThe browser built-in `btoa()` and `atob()` functions only support 8-bit Latin1 character ranges. Passing multibyte UTF-8 strings (Chinese characters, Japanese kanji, emojis) triggers an `InvalidCharacterError`.\n\n② Full UTF-8 Support:\nOur tool implements a robust `encodeURIComponent` and TypedArray byte-stream conversion pipeline, ensuring flawless, bidirectional encoding and decoding of Traditional Chinese, international scripts, and emoji characters without data loss.',
      },
      {
        q: 'What is "URL-Safe Base64"? How does it differ from standard Base64?',
        a: 'URL-Safe Base64 is an official standard variant (RFC 4648 §5) tailored for web addresses and filenames:\n\n① Character Substitutions:\nStandard Base64 contains `+` (which represents space in URLs) and `/` (which represents directory separators). URL-Safe Base64 replaces `+` with `-` (hyphen) and `/` with `_` (underscore).\n\n② Padding Stripping:\nURL-Safe Base64 typically omits trailing `=` padding characters, allowing strings to be directly and safely embedded in HTTP GET parameters, file names, or JWT (JSON Web Token) signatures.',
      },
      {
        q: 'Why does file size increase by approximately 33% after Base64 encoding?',
        a: 'Size expansion is an inherent mathematical property of the 6-bit encoding algorithm:\n\n① 3 Bytes to 4 Characters:\nBase64 groups 3 raw bytes (3 × 8 = 24 bits) into 4 chunks of 6 bits (4 × 6 = 24 bits), with each chunk mapped to an ASCII character.\n\n② Consistent 4/3 Ratio:\nThe encoded output is always exactly 4/3 (133.3%) the size of the original data. If the input byte length is not divisible by 3, 1 or 2 `=` padding characters are appended.',
      },
      {
        q: 'What is a "Data URL (data:image/png;base64,...)" and when should it be used in web development?',
        a: 'A Data URL is a URI scheme that embeds media files directly inline within HTML/CSS documents:\n\n① Syntax Structure:\nFormatted as `data:[<MIME-type>][;base64],<data>`, for example `data:image/svg+xml;base64,...`.\n\n② Use Cases & Trade-offs:\nIdeal for inlining small icons (<10KB), SVG graphics, or critical fonts directly into HTML/CSS to eliminate extra HTTP round-trips; larger files (>50KB) should remain external files to leverage browser caching.',
      },
      {
        q: 'Is Base64 an encryption algorithm? Can it be used to store passwords securely?',
        a: 'No! Base64 is strictly a "data representation encoding," not encryption:\n\n① Zero Confidentiality:\nBase64 has no secret keys or protection mechanisms; anyone can reverse the encoding with standard decoders in milliseconds.\n\n② Security Best Practices:\nNever use Base64 to store passwords, API secrets, or sensitive PII. For secure data storage and transit, always use authenticated encryption (AES-GCM, RSA) or cryptographic hashes (SHA-256, bcrypt, Argon2).',
      },
      {
        q: 'Is there any data privacy risk when encoding or decoding files with this online Base64 tool?',
        a: 'Zero Risk! This tool operates entirely within your local browser memory:\n\n① 100% Client-Side Execution:\nFiles are processed locally via the HTML5 FileReader API without being uploaded to remote servers.\n\n② Offline Compatibility:\nThe application functions fully even without an internet connection, guaranteeing total privacy for sensitive enterprise assets.',
      },
    ],
  },
};

export default function Base64Client({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  // DOM IDs for Accessibility
  const plainTextId = useId();
  const base64TextId = useId();
  const encodingSelectId = useId();
  const urlSafeCheckboxId = useId();
  const rfc2045CheckboxId = useId();
  const fileInputId = useId();

  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [plainText, setPlainText] = useState('');
  const [base64Text, setBase64Text] = useState('');
  const [encoding, setEncoding] = useState<EncodingType>('UTF-8');
  const [urlSafe, setUrlSafe] = useState(false);
  const [rfc2045, setRfc2045] = useState(false);
  const [base64Error, setBase64Error] = useState(false);
  const [fileState, setFileState] = useState<FileState>({
    file: null,
    dataUrl: '',
    rawBase64: '',
    previewType: null,
    previewContent: '',
    loading: false,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });

  const isCalculating = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bind dynamic theme color to root
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ff7300');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 115, 0, 0.6)');
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  const activeFileReaderRef = useRef<FileReader | null>(null);

  const encodeText = useCallback((text: string, enc: EncodingType, safe: boolean, wrap: boolean) => {
    if (!text) {
      setBase64Text('');
      setBase64Error(false);
      return;
    }
    try {
      let encoded = enc === 'UTF-8' ? utf8ToB64(text) : btoa(text);
      if (safe) encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      if (wrap) {
        const chunks = encoded.match(/.{1,76}/g);
        encoded = chunks ? chunks.join('\n') : encoded;
      }
      setBase64Text(encoded);
      setBase64Error(false);
    } catch {
      setBase64Text('');
      setBase64Error(true);
    }
  }, []);

  const decodeBase64 = useCallback((b64: string, enc: EncodingType) => {
    if (!b64) {
      setPlainText('');
      setBase64Error(false);
      return;
    }
    let str = b64.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4 !== 0) {
      str += '=';
    }
    try {
      const decoded = enc === 'UTF-8' ? b64ToUtf8(str) : atob(str);
      setPlainText(decoded);
      setBase64Error(false);
    } catch {
      setBase64Error(true);
    }
  }, []);

  const handlePlainChange = (val: string) => {
    if (isCalculating.current) return;
    isCalculating.current = true;
    setPlainText(val);
    encodeText(val, encoding, urlSafe, rfc2045);
    isCalculating.current = false;
  };

  const handleBase64Change = (val: string) => {
    if (isCalculating.current) return;
    isCalculating.current = true;
    setBase64Text(val);
    decodeBase64(val, encoding);
    isCalculating.current = false;
  };

  useEffect(() => {
    if (plainText) encodeText(plainText, encoding, urlSafe, rfc2045);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encoding, urlSafe, rfc2045]);

  const loadExample = () => {
    const ex =
      lang === 'en'
        ? `Hello World! This is a beautiful & premium Base64 Encoder / Decoder.\n0123456789 +-=/`
        : `哈囉，世界！這是一個美麗、精緻的 Base64 編碼/解碼工具。\nHello World! This is a beautiful & premium Base64 Encoder / Decoder.\n0123456789 +-=/`;
    setPlainText(ex);
    encodeText(ex, encoding, urlSafe, rfc2045);
  };

  const clearPlain = () => {
    setPlainText('');
    setBase64Text('');
    setBase64Error(false);
  };

  const clearBase64 = () => {
    setBase64Text('');
    setPlainText('');
    setBase64Error(false);
  };

  const copyValue = (val: string) => {
    if (!val) {
      showToast(t.toastNoContent);
      return;
    }
    navigator.clipboard
      .writeText(val)
      .then(() => showToast(t.toastCopied))
      .catch(() => showToast(t.toastCopyFailed));
  };

  const processFile = useCallback(
    (file: File) => {
      if (file.size > 30 * 1024 * 1024) {
        showToast(t.toastFileTooLarge);
        return;
      }
      if (activeFileReaderRef.current) {
        activeFileReaderRef.current.abort();
      }

      setFileState(s => ({ ...s, file, loading: true, dataUrl: '', rawBase64: '', previewType: null }));

      const reader = new FileReader();
      activeFileReaderRef.current = reader;

      reader.onload = e => {
        if (activeFileReaderRef.current !== reader) return;
        const dataUrl = e.target?.result as string;
        const raw = dataUrl.split(',')[1];
        const type = file.type;

        let previewType: FileState['previewType'] = 'binary';
        let previewContent = '';

        if (type.startsWith('image/')) previewType = 'image';
        else if (type.startsWith('audio/')) previewType = 'audio';
        else if (type.startsWith('video/')) previewType = 'video';
        else if (type.startsWith('text/') || type === 'application/json' || type === 'application/javascript') {
          previewType = 'text';
          try {
            const safeRawChunk = raw.substring(0, 4000);
            const txt = b64ToUtf8(safeRawChunk);
            previewContent = txt.length > 3000 ? txt.substring(0, 3000) + t.truncatedSuffix : txt;
          } catch {
            previewContent = t.textDecodeFailed;
          }
        }

        setFileState({ file, dataUrl, rawBase64: raw, previewType, previewContent, loading: false });
      };
      reader.onerror = () => {
        if (activeFileReaderRef.current !== reader) return;
        showToast(t.toastReadError);
        setFileState(s => ({ ...s, loading: false }));
      };
      reader.readAsDataURL(file);
    },
    [showToast, t]
  );

  const resetFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFileState({ file: null, dataUrl: '', rawBase64: '', previewType: null, previewContent: '', loading: false });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#ff7300"
        accentGlow="rgba(255,115,0,0.5)"
        extraHeaderControls={
          <Link
            href={t.langToggleUrl}
            className="relative inline-flex items-center justify-center gap-1.5 h-[42px] px-3.5 text-xs font-semibold rounded-xl bg-white/[.06] border border-white/10 text-text-sub hover:text-text-main backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:border-[var(--theme-color,#ff7300)] hover:shadow-[0_0_12px_var(--theme-glow,rgba(255,115,0,0.4))] select-none"
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{t.langToggleLabel}</span>
          </Link>
        }
      >
        <div className={styles.container}>
          {/* Top Bar: Tabs & Language Switcher */}
          <div className="flex justify-between items-center mb-8 border-b border-border-glass pb-0 flex-wrap gap-4">
            <div className="flex gap-2">
              {(['text', 'file'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-sm font-semibold tracking-wide cursor-pointer rounded-t-lg transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-[rgba(255,115,0,0.12)] text-[var(--theme-color,#ff7300)] border-b-2 border-[#ff7300]'
                      : 'bg-transparent text-text-sub hover:text-text-main hover:bg-white/[.04]'
                  }`}
                >
                  {tab === 'text' ? t.tabText : t.tabFile}
                </button>
              ))}
            </div>

          </div>

          {/* Text Tab Content */}
          {activeTab === 'text' && (
            <div className="grid grid-cols-2 gap-6 max-[900px]:grid-cols-1">
              {/* Plain Text Panel */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor={plainTextId} className="text-sm font-medium text-text-sub">
                    {t.plainTextLabel}
                  </label>
                  <span className="text-xs text-text-sub">{t.charCount(plainText.length)}</span>
                </div>
                <div className={styles.panelCard}>
                  <textarea
                    id={plainTextId}
                    className={styles.customTextarea}
                    placeholder={t.placeholderPlain}
                    value={plainText}
                    onChange={e => handlePlainChange(e.target.value)}
                  />
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border-glass flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor={encodingSelectId} className="text-sm font-medium text-text-sub">
                        {t.encodingLabel}
                      </label>
                      <select
                        id={encodingSelectId}
                        className={styles.b64Select}
                        value={encoding}
                        onChange={e => setEncoding(e.target.value as EncodingType)}
                      >
                        <option value="UTF-8">UTF-8 (Default / Universal)</option>
                        <option value="ASCII">ASCII (Basic Latin)</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={loadExample} className={styles.btnSecondary}>
                        {t.exampleBtn}
                      </button>
                      <button type="button" onClick={clearPlain} className={styles.btnSecondary}>
                        {t.clearBtn}
                      </button>
                      <button type="button" onClick={() => copyValue(plainText)} className={styles.btnPrimary}>
                        {t.copyBtn}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Base64 Text Panel */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor={base64TextId} className="text-sm font-medium text-text-sub">
                    {t.base64TextLabel}
                  </label>
                  {base64Error && (
                    <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      {t.invalidFormat}
                    </span>
                  )}
                </div>
                <div className={`${styles.panelCard} ${base64Error ? styles.panelError : ''}`}>
                  <textarea
                    id={base64TextId}
                    className={styles.customTextarea}
                    placeholder={t.placeholderBase64}
                    value={base64Text}
                    onChange={e => handleBase64Change(e.target.value)}
                  />
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border-glass flex-wrap gap-2">
                    <div className="flex items-center gap-4 flex-wrap">
                      <label htmlFor={urlSafeCheckboxId} className={styles.customCheckbox}>
                        <input
                          id={urlSafeCheckboxId}
                          type="checkbox"
                          checked={urlSafe}
                          onChange={e => setUrlSafe(e.target.checked)}
                        />
                        <span className={styles.checkmark} />
                        <span>{t.urlSafeLabel}</span>
                      </label>

                      <label htmlFor={rfc2045CheckboxId} className={styles.customCheckbox}>
                        <input
                          id={rfc2045CheckboxId}
                          type="checkbox"
                          checked={rfc2045}
                          onChange={e => setRfc2045(e.target.checked)}
                        />
                        <span className={styles.checkmark} />
                        <span>{t.rfc2045Label}</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={clearBase64} className={styles.btnSecondary}>
                        {t.clearBtn}
                      </button>
                      <button type="button" onClick={() => copyValue(base64Text)} className={styles.btnPrimary}>
                        {t.copyBtn}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File Tab Content */}
          {activeTab === 'file' && (
            <div className="flex flex-col gap-6">
              {!fileState.file && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={e => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
                >
                  <label htmlFor={fileInputId} className="sr-only">
                    {t.tabFile}
                  </label>
                  <input
                    id={fileInputId}
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files?.[0]) processFile(e.target.files[0]);
                    }}
                  />
                  <svg
                    viewBox="0 0 24 24"
                    className="w-12 h-12 text-text-sub fill-none stroke-current"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="text-base text-text-sub font-medium">{t.dropzoneText}</span>
                  <span className="text-xs text-text-sub opacity-80">{t.dropzoneSub}</span>
                </div>
              )}

              {fileState.file && (
                <div className={`${styles.panelCard} p-6 flex flex-col gap-5`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[rgba(255,115,0,0.12)] rounded-lg flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" width={22} height={22} fill="#ff7300">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                      </svg>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-semibold text-text-main truncate">{fileState.file.name}</span>
                      <span className="text-xs text-text-sub">
                        {formatBytes(fileState.file.size)} | {fileState.file.type || 'Unknown Type'}
                      </span>
                    </div>
                    <button type="button" onClick={resetFile} className={styles.btnSecondary}>
                      {t.removeFile}
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs font-semibold text-text-sub uppercase tracking-wide">
                        {t.dataPreview}
                      </span>
                      {fileState.previewType === 'text' && fileState.file && fileState.file.size > 3000 && (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium">
                          <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                          </svg>
                          {t.previewTruncatedBadge}
                        </span>
                      )}
                    </div>
                    <div className={styles.previewBox}>
                      {fileState.loading && <div className={styles.spinner} />}
                      {!fileState.loading && fileState.previewType === 'image' && (
                        <img src={fileState.dataUrl} alt={fileState.file.name} className={styles.previewImg} />
                      )}
                      {!fileState.loading && fileState.previewType === 'audio' && (
                        <audio src={fileState.dataUrl} controls className="w-full" />
                      )}
                      {!fileState.loading && fileState.previewType === 'video' && (
                        <video src={fileState.dataUrl} controls className="w-full max-h-[300px]" />
                      )}
                      {!fileState.loading && fileState.previewType === 'text' && (
                        <pre className="w-full max-h-[200px] overflow-y-auto font-mono text-sm text-text-main whitespace-pre-wrap break-all text-left">
                          {fileState.previewContent}
                        </pre>
                      )}
                      {!fileState.loading && fileState.previewType === 'binary' && (
                        <div className="text-center text-text-sub text-sm">
                          <svg
                            viewBox="0 0 24 24"
                            width={40}
                            height={40}
                            fill="currentColor"
                            className="mx-auto mb-2 opacity-40"
                          >
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                          </svg>
                          {t.binaryNoPreview}
                        </div>
                      )}
                    </div>
                  </div>

                  {fileState.rawBase64 && (
                    <div className="flex flex-col gap-4">
                      {[
                        { label: t.dataUrlLabel, val: fileState.dataUrl, btnLabel: t.copyDataUrl },
                        { label: t.rawBase64Label, val: fileState.rawBase64, btnLabel: t.copyRawData },
                      ].map(row => (
                        <div key={row.label} className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-text-sub">{row.label}</span>
                            <button type="button" onClick={() => copyValue(row.val)} className={styles.btnPrimary}>
                              {row.btnLabel}
                            </button>
                          </div>
                          <textarea readOnly value={row.val} className={styles.outputTextarea} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 常見問題 FAQ 區塊 */}
        <div className="mt-8">
          <FaqSection
            title={t.faqTitle}
            subtitle={t.faqSubtitle}
            items={t.faqItems}
            accentColor="#00d2ff"
          />
        </div>
      </ToolLayout>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-8 right-8 flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl z-[100] pointer-events-none
          bg-surface-glass border border-border-glass backdrop-blur-[16px] text-text-main shadow-lg
          transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="#ff7300">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}
