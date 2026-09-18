/**
 * 檔案雜湊計算與校驗工具頁面中英文案（從 ChecksumVerifierClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
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
    toastNoDoneFiles: '尚無已完成計算的檔案可匯出',
    toastManifestDownloaded: '校驗清單已下載',
    downloadManifestLabel: '下載校驗清單：',
    downloadManifestBtn: '下載',
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
    entryMatchedFile: (name: string) => `符合檔案：${name}`,
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
        q: '如何把已算好的雜湊值匯出成檔案分享給別人？下載的校驗清單可以用系統內建指令核對嗎？',
        a: '檔案清單上方的「下載校驗清單」功能就是為此設計：\n\n① 使用方式：\n從下拉選單選擇一種演算法（MD5 / SHA-1 / SHA-256 / SHA-512 / CRC32），按下「下載」，就會把目前已計算完成的所有檔案，以該演算法的雜湊值匯出成單一 GNU coreutils 相容格式的文字檔（如 `SHA256SUMS.txt`），檔頭附上 UTC 產生時間與 `tools.cjkuo.net` 來源註解。\n\n② 通用相容性：\n此檔案可直接用作業系統內建指令核對，例如 macOS/Linux 的 `sha256sum -c SHA256SUMS.txt` 或 `md5sum -c MD5SUMS.txt`，Windows 則可用 `Get-FileHash` 手動比對；也可以把這份檔案原封不動再拖回本工具，會自動判斷為校驗清單並解析比對。',
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
    toastNoDoneFiles: 'No completed file hashes to export yet',
    toastManifestDownloaded: 'Checksum manifest downloaded',
    downloadManifestLabel: 'Download checksum manifest:',
    downloadManifestBtn: 'Download',
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
    entryMatchedFile: (name: string) => `Matched file: ${name}`,
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
        q: 'How do I export the computed hashes into a file to share with someone else? Can the downloaded manifest be verified with built-in OS commands?',
        a: 'That\'s exactly what the "Download checksum manifest" control above the file list is for:\n\n① How to Use It:\nPick an algorithm from the dropdown (MD5 / SHA-1 / SHA-256 / SHA-512 / CRC32) and click "Download" — every file that has finished hashing gets exported into a single GNU coreutils-compatible text file (e.g. `SHA256SUMS.txt`), with a header noting the UTC generation time and a `tools.cjkuo.net` attribution comment.\n\n② Universal Compatibility:\nThe file can be verified directly with built-in OS commands, such as `sha256sum -c SHA256SUMS.txt` or `md5sum -c MD5SUMS.txt` on macOS/Linux, or `Get-FileHash` for manual comparison on Windows. You can also drop the exported file straight back into this tool — it will be auto-detected as a checksum manifest and parsed for verification.',
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
