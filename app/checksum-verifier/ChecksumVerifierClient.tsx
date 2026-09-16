'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import { formatBytes } from '../utils/formatBytes';
import styles from './checksum-verifier.module.css';
import {
  HASH_ALGORITHMS,
  type HashAlgorithm,
  type ChecksumEntry,
  type MatchStatus,
  computeAllHashes,
  parseChecksumText,
  matchEntryAgainstFile,
  entryAppliesToFileName,
  looksLikeChecksumManifestFilename,
} from './engine';

interface Props {
  lang?: 'zh-TW' | 'en';
}

interface HashedFile {
  id: string;
  file: File;
  status: 'hashing' | 'done' | 'error';
  hashes: Partial<Record<HashAlgorithm, string>>;
  progress: { algorithm: HashAlgorithm; percent: number } | null;
  errorMsg?: string;
}

const ACCENT = '#10b981';
const ACCENT_GLOW = 'rgba(16, 185, 129, 0.5)';

const TRANSLATIONS = {
  'zh-TW': {
    title: '檔案雜湊計算與校驗工具',
    subtitle: 'FILE HASH CALCULATOR & CHECKSUM VERIFIER',
    description:
      '純前端檔案雜湊計算與完整性校驗工具，拖曳檔案即可算出 MD5 / SHA-1 / SHA-256 / SHA-512 / CRC32，並可直接丟入官方提供的校驗清單檔案（含 .sfv）自動比對是否相符。',
    langToggleLabel: 'English',
    langToggleUrl: '/checksum-verifier/en/',
    dropzoneText: '拖曳檔案至此計算雜湊，或點擊選擇檔案',
    dropzoneSub: '支援多檔同時拖入；也可把 .sha256 / .md5 / CHECKSUMS 等校驗清單檔案一起丟進來，會自動判斷並用於比對',
    appendDropzoneText: '拖曳更多檔案（或校驗清單）加入',
    globalDragOverlay: '放開滑鼠以新增檔案',
    fileCountLabel: (n: number) => `已載入 ${n} 個檔案`,
    clearAllBtn: '全部清除',
    removeFileBtn: '移除',
    copyBtn: '複製',
    toastCopied: '已複製到剪貼簿',
    toastCopyFailed: '複製失敗，請手動複製',
    toastManifestLoaded: (n: number) => `已載入 ${n} 份校驗清單並解析`,
    toastReadError: '讀取檔案時發生錯誤',
    hashingLabel: (algo: string, pct: number) => `正在計算 ${algo}… ${pct}%`,
    hashingLabelGeneric: '正在計算雜湊值…',
    errorLabel: '計算失敗',
    verifyPanelTitle: '驗證雜湊值',
    verifyPanelDesc:
      '貼上單一雜湊字串，或標準校驗清單格式（md5sum / sha256sum / shasum 輸出、CHECKSUMS、或 OpenSSL 的 SHA256 (file) = hash 格式），會自動與左側檔案比對。',
    checksumTextareaPlaceholder:
      '在此貼上雜湊值或校驗清單，例如：\n\nba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad\n\n或\n\nd41d8cd98f00b204e9800998ecf8427e  filename.iso\nSHA256 (filename.iso) = 3a7bd3e2360a3d...',
    uploadManifestBtn: '上傳校驗清單檔案',
    clearChecksumBtn: '清除清單',
    parsedEntriesTitle: '解析結果',
    parsedEntriesCount: (n: number) => `共 ${n} 筆`,
    noEntriesHint: '尚未貼上或上傳任何校驗清單，僅顯示左側檔案的雜湊計算結果。',
    entryWildcardLabel: '（套用於所有檔案）',
    entryNoFileFound: '找不到對應檔案',
    entryPending: '計算中…',
    badgeMatch: '相符',
    badgeMismatch: '不符',
    badgeUnsupported: '不支援比對',
    unsupportedHint: '（本工具未提供此演算法，請人工比對）',
    dropAnyFileHint: '拖曳任意雜湊清單文字檔至此',

    // FAQ
    faqTitle: '常見問題與專業指南 (FAQ)',
    faqSubtitle: '關於檔案雜湊、完整性校驗與常見校驗清單格式的深入說明',
    faqItems: [
      {
        q: '什麼是檔案雜湊值（Hash）？為什麼下載軟體時官方常附上 MD5/SHA256？',
        a: '雜湊值是透過單向數學函數，將任意大小的檔案內容濃縮成一組固定長度的英數字指紋：\n\n① 完整性驗證：\n只要檔案內容有任何一個位元組被竄改（無論是傳輸過程損毀，或遭惡意置換），計算出的雜湊值就會完全不同，藉此確認下載到的檔案與官方發布的原始檔案 100% 一致。\n\n② 常見用途：\n作業系統映像檔（ISO）、開源軟體安裝包、Docker 映像層等大型檔案，官方網站通常會公布 MD5/SHA-1/SHA-256/SHA-512 供使用者下載後自行驗證，防範中間人攻擊或 CDN 節點檔案損毀。',
      },
      {
        q: 'MD5、SHA-1、SHA-256、SHA-512 之間有什麼差異？該用哪一種？',
        a: '四種演算法輸出長度與安全性不同：\n\n① 輸出長度：\nMD5 輸出 128 位元（32 個十六進位字元）、SHA-1 輸出 160 位元（40 字元）、SHA-256 輸出 256 位元（64 字元）、SHA-512 輸出 512 位元（128 字元）。\n\n② 安全性建議：\nMD5 與 SHA-1 已被證實存在雜湊碰撞漏洞，不應再用於數位簽章或密碼儲存等安全場景，但用來單純核對「下載檔案是否損毀/被竄改」仍相當實用。若官方同時提供多種雜湊值，建議優先採用 SHA-256 或 SHA-512 進行校驗。',
      },
      {
        q: '本工具支援哪些校驗清單格式？可以直接把下載的 .sha256 檔案丟進來嗎？',
        a: '完全支援，且會自動判斷檔案用途：\n\n① 自動分流：\n將檔案拖曳至主要拖放區時，若副檔名或檔名符合常見校驗清單慣例（如 .sha256、.md5、SHA256SUMS、CHECKSUMS 等），會自動視為校驗清單解析，不會誤判成待計算雜湊的目標檔案。\n\n② 支援格式：\nGNU coreutils 輸出格式（`<hash>  <檔名>`，md5sum/sha256sum/shasum 皆採此格式）、BSD/OpenSSL 格式（`SHA256 (檔名) = <hash>`），以及沒有檔名、僅單一雜湊字串的格式（會套用比對所有已上傳檔案）。',
      },
      {
        q: '比對結果顯示「不支援比對」是什麼意思？',
        a: '這代表校驗清單中的雜湊值長度對應到本工具未提供運算的演算法：\n\n① 常見原因：\n本工具提供 MD5、SHA-1、SHA-256、SHA-512、CRC32 五種最常見的雜湊/校驗演算法運算；若清單中出現 SHA-384（96 個字元）等其他變體，由於未內建對應運算，系統會誠實標示「不支援比對」，而非給出錯誤的比對結果。\n\n② 因應方式：\n可自行使用作業系統內建指令（如 macOS/Linux 的 `shasum -a 384`、Windows PowerShell 的 `Get-FileHash -Algorithm SHA384`）計算後，再與清單肉眼核對。',
      },
      {
        q: 'CRC32 是什麼？支援 .sfv 校驗清單檔案嗎？',
        a: 'CRC32 是一種輕量的循環冗餘校驗碼，廣泛用於 ZIP、PNG、SFV 等格式的錯誤偵測：\n\n① 與雜湊演算法的差異：\nCRC32 並非密碼學安全雜湊，設計目的是快速偵測隨機傳輸錯誤（如硬碟壞軌、傳輸雜訊），而非防止人為蓄意竄改，因此不建議用於安全驗證場景，但檢查下載檔案是否損毀仍相當實用。\n\n② SFV 格式支援：\n本工具支援標準 `.sfv` 格式（`檔名  crc32碼`，檔名在前、8 碼十六進位 CRC32 在後，以 `;` 開頭的行視為註解），拖曳 `.sfv`／`.cksum` 檔案至主拖放區會自動判斷為校驗清單並解析比對。',
      },
      {
        q: '為什麼計算大型檔案（如數 GB 的映像檔）的 MD5 感覺比 SHA-256 慢？',
        a: '這與底層運算引擎有關：\n\n① 原生加速 vs. 純軟體實作：\nSHA-1/256/512 由瀏覽器原生的 Web Crypto API（SubtleCrypto）計算，具備底層最佳化甚至硬體加速；MD5 因未被瀏覽器原生支援，本工具採用純 JavaScript 實作 RFC 1321 演算法，速度自然較慢。\n\n② 不卡頓保證：\n即便如此，本工具在計算 MD5 時仍會定期讓出主執行緒，確保頁面在處理大型檔案時依然可以捲動、拖曳新檔案，不會凍結瀏覽器分頁。',
      },
      {
        q: '在此網站計算檔案雜湊值，檔案內容會被上傳到伺服器嗎？',
        a: '完全不會！本工具為 100% 純前端（Client-Side）運算架構：\n\n① 本機記憶體處理：\n所有檔案讀取與雜湊運算皆透過瀏覽器原生 File API 與 Web Crypto API 在您的裝置本機記憶體中完成。\n\n② 零雲端上傳：\n檔案內容、檔名與計算結果完全不會傳輸至任何伺服器或第三方服務，適合驗證含機密資訊的內部文件或商業軟體安裝包。',
      },
    ],
  },
  en: {
    title: 'File Hash Calculator & Checksum Verifier',
    subtitle: 'FILE HASH CALCULATOR & CHECKSUM VERIFIER',
    description:
      'Client-side file hash calculator and integrity checker. Drag & drop files to instantly compute MD5 / SHA-1 / SHA-256 / SHA-512 / CRC32, and drop the official checksum manifest (including .sfv) alongside it for automatic verification.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/checksum-verifier/',
    dropzoneText: 'Drag & drop files here to compute hashes, or click to browse',
    dropzoneSub: 'Supports multiple files at once; you can also drop .sha256 / .md5 / CHECKSUMS manifest files here — they are auto-detected and used for verification',
    appendDropzoneText: 'Drag more files (or a checksum manifest) here',
    globalDragOverlay: 'Release to add files',
    fileCountLabel: (n: number) => `${n} file(s) loaded`,
    clearAllBtn: 'Clear All',
    removeFileBtn: 'Remove',
    copyBtn: 'Copy',
    toastCopied: 'Copied to clipboard',
    toastCopyFailed: 'Copy failed, please copy manually',
    toastManifestLoaded: (n: number) => `Loaded and parsed ${n} checksum manifest(s)`,
    toastReadError: 'Error reading file',
    hashingLabel: (algo: string, pct: number) => `Computing ${algo}… ${pct}%`,
    hashingLabelGeneric: 'Computing hashes…',
    errorLabel: 'Computation failed',
    verifyPanelTitle: 'Verify Hash',
    verifyPanelDesc:
      'Paste a single hash string, or a standard checksum manifest (md5sum / sha256sum / shasum output, CHECKSUMS, or OpenSSL\'s SHA256 (file) = hash format) — it will be automatically compared against the files on the left.',
    checksumTextareaPlaceholder:
      'Paste a hash or checksum manifest here, e.g.:\n\nba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad\n\nor\n\nd41d8cd98f00b204e9800998ecf8427e  filename.iso\nSHA256 (filename.iso) = 3a7bd3e2360a3d...',
    uploadManifestBtn: 'Upload Checksum File',
    clearChecksumBtn: 'Clear',
    parsedEntriesTitle: 'Parsed Entries',
    parsedEntriesCount: (n: number) => `${n} entrie(s)`,
    noEntriesHint: 'No checksum pasted or uploaded yet — only the computed hashes on the left are shown.',
    entryWildcardLabel: '(applies to all files)',
    entryNoFileFound: 'No matching file found',
    entryPending: 'Computing…',
    badgeMatch: 'Match',
    badgeMismatch: 'Mismatch',
    badgeUnsupported: 'Unsupported',
    unsupportedHint: "(this algorithm isn't computed here — please verify manually)",
    dropAnyFileHint: 'Drop any checksum text file here',

    // FAQ
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Deep dive into file hashing, integrity verification, and common checksum manifest formats',
    faqItems: [
      {
        q: 'What is a file hash, and why do official downloads publish MD5/SHA256 checksums?',
        a: 'A hash is a one-way function that condenses arbitrary file content into a fixed-length fingerprint:\n\n① Integrity Verification:\nIf even a single byte of the file is altered (corrupted in transit, or maliciously swapped), the resulting hash changes completely, confirming whether your downloaded file exactly matches the original published by the vendor.\n\n② Common Use Cases:\nOS installation images (ISOs), open-source software packages, and Docker image layers are typically published alongside MD5/SHA-1/SHA-256/SHA-512 checksums so users can verify the download after the fact, guarding against man-in-the-middle tampering or CDN mirror corruption.',
      },
      {
        q: 'What is the difference between MD5, SHA-1, SHA-256, and SHA-512? Which one should I use?',
        a: 'These four algorithms differ in output length and security guarantees:\n\n① Output Length:\nMD5 produces 128 bits (32 hex characters), SHA-1 produces 160 bits (40 characters), SHA-256 produces 256 bits (64 characters), and SHA-512 produces 512 bits (128 characters).\n\n② Security Recommendation:\nMD5 and SHA-1 have known collision vulnerabilities and should never be used for digital signatures or password storage, though they remain useful for simply checking whether a download is corrupted or altered. When multiple checksums are provided, prefer SHA-256 or SHA-512 for verification.',
      },
      {
        q: 'Which checksum manifest formats are supported? Can I just drop a downloaded .sha256 file in?',
        a: 'Yes, and the tool automatically figures out what each dropped file is for:\n\n① Automatic Routing:\nWhen you drop a file into the main dropzone, if its extension or filename matches common checksum manifest conventions (e.g. .sha256, .md5, SHA256SUMS, CHECKSUMS), it is automatically parsed as a checksum manifest instead of being treated as a file to hash.\n\n② Supported Formats:\nGNU coreutils output (`<hash>  <filename>`, used by md5sum/sha256sum/shasum), BSD/OpenSSL format (`SHA256 (filename) = <hash>`), and a bare hash string with no filename (applied to every uploaded file).',
      },
      {
        q: 'What does "Unsupported" in the comparison result mean?',
        a: 'It means the hash length in the manifest corresponds to an algorithm this tool does not compute:\n\n① Common Cause:\nThis tool computes the five most common algorithms — MD5, SHA-1, SHA-256, SHA-512, and CRC32. If the manifest contains a SHA-384 hash (96 characters) or another variant, the tool honestly reports "Unsupported" rather than producing a misleading comparison.\n\n② Workaround:\nCompute it yourself with a built-in OS command (e.g. `shasum -a 384` on macOS/Linux, or `Get-FileHash -Algorithm SHA384` in Windows PowerShell) and compare visually against the manifest.',
      },
      {
        q: 'What is CRC32? Does this tool support .sfv checksum files?',
        a: 'CRC32 is a lightweight cyclic redundancy check widely used by ZIP, PNG, and SFV formats for error detection:\n\n① How It Differs From Cryptographic Hashes:\nCRC32 is not a cryptographically secure hash — it is designed to quickly catch random transmission errors (disk bad sectors, transfer noise) rather than deliberate tampering, so it should not be relied on for security verification, though it remains useful for checking whether a download got corrupted.\n\n② SFV Support:\nThis tool supports the standard `.sfv` format (`filename  crc32hex`, filename first followed by the 8-character hex CRC32, with lines starting with `;` treated as comments). Dropping a `.sfv` or `.cksum` file into the main dropzone automatically routes it to the checksum manifest parser.',
      },
      {
        q: 'Why does computing MD5 on a large file (e.g. a multi-GB disk image) feel slower than SHA-256?',
        a: 'This comes down to the underlying compute engine:\n\n① Native Acceleration vs. Pure Software:\nSHA-1/256/512 are computed via the browser\'s native Web Crypto API (SubtleCrypto), which benefits from low-level and sometimes hardware-accelerated implementations. MD5 is not natively supported by browsers, so this tool implements RFC 1321 in pure JavaScript, which is inherently slower.\n\n② No Freezing, Guaranteed:\nEven so, this tool periodically yields control back to the main thread while computing MD5, so the page stays scrollable and you can keep dragging in new files even while a large file is being hashed.',
      },
      {
        q: 'Is my file content uploaded to a server when I compute its hash on this site?',
        a: 'Never! This tool is a 100% client-side application:\n\n① Local Memory Processing:\nAll file reading and hash computation happen entirely within your browser via the native File API and Web Crypto API, on your local device memory.\n\n② Zero Cloud Upload:\nFile content, filenames, and computed results are never transmitted to any server or third party, making this safe for verifying confidential internal documents or proprietary software installers.',
      },
    ],
  },
};

function makeFileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
}

function getFileMatchSummary(file: HashedFile, entries: ChecksumEntry[]): MatchStatus | null {
  const relevant = entries.filter(e => entryAppliesToFileName(e, file.file.name));
  if (relevant.length === 0 || file.status !== 'done') return null;
  const results = relevant.map(e => matchEntryAgainstFile(e, file.file.name, file.hashes)!.status);
  if (results.includes('match')) return 'match';
  if (results.includes('mismatch')) return 'mismatch';
  return 'unsupported';
}

export default function ChecksumVerifierClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  const fileInputId = useId();
  const appendFileInputId = useId();
  const manifestInputId = useId();
  const checksumTextareaId = useId();

  const [files, setFiles] = useState<HashedFile[]>([]);
  const [checksumText, setChecksumText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAppendDragOver, setIsAppendDragOver] = useState(false);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });

  const dragCounterRef = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', ACCENT);
    document.documentElement.style.setProperty('--accent-glow', ACCENT_GLOW);
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast(s => ({ ...s, show: false })), 2500);
  }, []);

  const processTargetFile = useCallback(async (id: string, file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const hashes = await computeAllHashes(buffer, HASH_ALGORITHMS, (algorithm, percent) => {
        setFiles(prev => prev.map(f => (f.id === id ? { ...f, progress: { algorithm, percent } } : f)));
      });
      setFiles(prev => prev.map(f => (f.id === id ? { ...f, status: 'done', hashes, progress: null } : f)));
    } catch (err) {
      setFiles(prev =>
        prev.map(f => (f.id === id ? { ...f, status: 'error', errorMsg: String(err), progress: null } : f))
      );
    }
  }, []);

  const loadManifestFiles = useCallback(
    (manifestFiles: File[]) => {
      Promise.all(manifestFiles.map(f => f.text().then(text => `# ${f.name}\n${text.trim()}`)))
        .then(chunks => {
          setChecksumText(prev => (prev.trim() ? prev.trim() + '\n\n' : '') + chunks.join('\n\n'));
          showToast(t.toastManifestLoaded(manifestFiles.length));
        })
        .catch(() => showToast(t.toastReadError));
    },
    [showToast, t]
  );

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      if (incoming.length === 0) return;

      const manifestFiles = incoming.filter(f => looksLikeChecksumManifestFilename(f.name));
      const targetFiles = incoming.filter(f => !looksLikeChecksumManifestFilename(f.name));

      if (manifestFiles.length > 0) loadManifestFiles(manifestFiles);

      if (targetFiles.length > 0) {
        const newEntries: HashedFile[] = targetFiles.map(file => ({
          id: makeFileKey(file),
          file,
          status: 'hashing',
          hashes: {},
          progress: null,
        }));
        setFiles(prev => [...prev, ...newEntries]);
        newEntries.forEach(entry => processTargetFile(entry.id, entry.file));
      }
    },
    [loadManifestFiles, processTargetFile]
  );

  // 全域 Drag & Drop 監聽（持續性拖曳上傳 UX）
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current += 1;
      if (e.dataTransfer?.types?.includes('Files')) setIsDraggingGlobal(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDraggingGlobal(false);
      }
    };
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDraggingGlobal(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [addFiles]);

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));
  const clearAll = () => setFiles([]);

  const copyValue = (val: string) => {
    navigator.clipboard
      .writeText(val)
      .then(() => showToast(t.toastCopied))
      .catch(() => showToast(t.toastCopyFailed));
  };

  const parsedEntries = useMemo(() => parseChecksumText(checksumText), [checksumText]);

  const entryUiResults = useMemo(() => {
    return parsedEntries.map(entry => {
      const relevantFiles = files.filter(f => entryAppliesToFileName(entry, f.file.name));
      const results = relevantFiles.map(f => {
        if (f.status !== 'done') return { file: f, status: 'pending' as const };
        const r = matchEntryAgainstFile(entry, f.file.name, f.hashes)!;
        return { file: f, status: r.status as MatchStatus };
      });
      return { entry, results };
    });
  }, [parsedEntries, files]);

  const algoLabel = (algo: HashAlgorithm) => algo;

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor={ACCENT}
        accentGlow={ACCENT_GLOW}
      >
        {isDraggingGlobal && (
          <div className={styles.dragOverlay}>
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center border shadow-2xl"
              style={{ background: 'rgba(16,185,129,0.2)', color: ACCENT, borderColor: 'rgba(16,185,129,0.4)' }}
            >
              <svg viewBox="0 0 24 24" width={40} height={40} fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-text-main">{t.globalDragOverlay}</span>
          </div>
        )}

        <div className={styles.container}>
          {files.length === 0 ? (
            <div
              onClick={() => document.getElementById(fileInputId)?.click()}
              onDragEnter={e => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragOver={e => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
              }}
              className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
            >
              <label htmlFor={fileInputId} className="sr-only">
                {t.dropzoneText}
              </label>
              <input
                id={fileInputId}
                type="file"
                multiple
                className="hidden"
                onChange={e => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = '';
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
              <span className="text-xs text-text-sub opacity-80 text-center max-w-md">{t.dropzoneSub}</span>
            </div>
          ) : (
            <div className="grid grid-cols-[1.15fr_1fr] gap-6 max-lg:grid-cols-1 items-start">
              {/* 左欄：目標檔案清單 */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-text-main">{t.fileCountLabel(files.length)}</span>
                  <button type="button" onClick={clearAll} className={styles.btnSecondary}>
                    {t.clearAllBtn}
                  </button>
                </div>

                {files.map(f => {
                  const summary = getFileMatchSummary(f, parsedEntries);
                  return (
                    <div key={f.id} className={styles.fileCard}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(16,185,129,0.12)' }}
                        >
                          <svg viewBox="0 0 24 24" width={20} height={20} fill={ACCENT}>
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                          </svg>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-semibold text-text-main truncate">{f.file.name}</span>
                          <span className="text-xs text-text-sub">{formatBytes(f.file.size)}</span>
                        </div>
                        {summary === 'match' && (
                          <span className={`${styles.badge} ${styles.badgeMatch}`}>{t.badgeMatch}</span>
                        )}
                        {summary === 'mismatch' && (
                          <span className={`${styles.badge} ${styles.badgeMismatch}`}>{t.badgeMismatch}</span>
                        )}
                        {summary === 'unsupported' && (
                          <span className={`${styles.badge} ${styles.badgeUnsupported}`}>{t.badgeUnsupported}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(f.id)}
                          className={styles.iconBtn}
                          aria-label={t.removeFileBtn}
                        >
                          <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                          </svg>
                        </button>
                      </div>

                      {f.status === 'hashing' && (
                        <div className="flex items-center gap-2 text-xs text-text-sub">
                          <div className={styles.spinner} />
                          {f.progress ? t.hashingLabel(algoLabel(f.progress.algorithm), f.progress.percent) : t.hashingLabelGeneric}
                        </div>
                      )}

                      {f.status === 'error' && (
                        <div className="text-xs text-red-500">
                          {t.errorLabel}: {f.errorMsg}
                        </div>
                      )}

                      {f.status === 'done' && (
                        <div className="flex flex-col gap-1.5">
                          {HASH_ALGORITHMS.map(algo => (
                            <div key={algo} className={styles.hashRow}>
                              <span className={styles.hashAlgoLabel}>{algo}</span>
                              <span className={styles.hashValue}>{f.hashes[algo]}</span>
                              <button
                                type="button"
                                onClick={() => copyValue(f.hashes[algo] || '')}
                                className={styles.iconBtn}
                                aria-label={t.copyBtn}
                              >
                                <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor">
                                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 持續性拖曳追加入口 */}
                <div
                  onClick={() => document.getElementById(appendFileInputId)?.click()}
                  onDragEnter={e => {
                    e.preventDefault();
                    setIsAppendDragOver(true);
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    setIsAppendDragOver(true);
                  }}
                  onDragLeave={() => setIsAppendDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setIsAppendDragOver(false);
                    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
                  }}
                  className={`${styles.appendDropzone} ${isAppendDragOver ? styles.appendDropzoneActive : ''}`}
                >
                  <label htmlFor={appendFileInputId} className="sr-only">
                    {t.appendDropzoneText}
                  </label>
                  <input
                    id={appendFileInputId}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={e => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  {t.appendDropzoneText}
                </div>
              </div>

              {/* 右欄：驗證面板 */}
              <div className="flex flex-col gap-4">
                <div className={styles.panelCard}>
                  <div className="px-4 pt-4">
                    <h3 className="text-sm font-bold text-text-main mb-1">{t.verifyPanelTitle}</h3>
                    <p className="text-xs text-text-sub mb-3 leading-relaxed">{t.verifyPanelDesc}</p>
                  </div>
                  <label htmlFor={checksumTextareaId} className="sr-only">
                    {t.verifyPanelTitle}
                  </label>
                  <textarea
                    id={checksumTextareaId}
                    className={styles.customTextarea}
                    placeholder={t.checksumTextareaPlaceholder}
                    value={checksumText}
                    onChange={e => setChecksumText(e.target.value)}
                  />
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border-glass flex-wrap gap-2">
                    <label htmlFor={manifestInputId} className={styles.btnSecondary} style={{ cursor: 'pointer' }}>
                      {t.uploadManifestBtn}
                      <input
                        id={manifestInputId}
                        type="file"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files?.[0]) loadManifestFiles([e.target.files[0]]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <button type="button" onClick={() => setChecksumText('')} className={styles.btnSecondary}>
                      {t.clearChecksumBtn}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-text-main">{t.parsedEntriesTitle}</span>
                  {parsedEntries.length > 0 && (
                    <span className="text-xs text-text-sub">{t.parsedEntriesCount(parsedEntries.length)}</span>
                  )}
                </div>

                {parsedEntries.length === 0 ? (
                  <p className="text-xs text-text-sub px-1">{t.noEntriesHint}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {entryUiResults.map(({ entry, results }, idx) => (
                      <div key={idx} className={styles.entryRow}>
                        <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                          <span className="text-xs font-semibold text-text-main truncate">
                            {entry.filename ?? t.entryWildcardLabel}
                          </span>
                          <span className={styles.hashValue} style={{ fontSize: '0.72rem' }}>
                            {entry.hash}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {results.length === 0 && (
                            <span className={`${styles.badge} ${styles.badgeNeutral}`}>{t.entryNoFileFound}</span>
                          )}
                          {results.map((r, i) => (
                            <span key={i}>
                              {r.status === 'pending' && (
                                <span className={`${styles.badge} ${styles.badgeNeutral}`}>{t.entryPending}</span>
                              )}
                              {r.status === 'match' && (
                                <span className={`${styles.badge} ${styles.badgeMatch}`}>{t.badgeMatch}</span>
                              )}
                              {r.status === 'mismatch' && (
                                <span className={`${styles.badge} ${styles.badgeMismatch}`}>{t.badgeMismatch}</span>
                              )}
                              {r.status === 'unsupported' && (
                                <span className={`${styles.badge} ${styles.badgeUnsupported}`}>
                                  {t.badgeUnsupported}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 常見問題 FAQ 區塊 */}
        <div className="mt-8">
          <FaqSection title={t.faqTitle} subtitle={t.faqSubtitle} items={t.faqItems} accentColor={ACCENT} />
        </div>
      </ToolLayout>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-8 right-8 flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl z-[100] pointer-events-none
          bg-surface-glass border border-border-glass backdrop-blur-[16px] text-text-main shadow-lg
          transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill={ACCENT}>
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}
