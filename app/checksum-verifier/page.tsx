import type { Metadata } from 'next';
import ChecksumVerifierClient from './ChecksumVerifierClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '檔案雜湊計算與校驗工具 - 免費線上 MD5 / SHA-256 / SHA-512 / CRC32 驗證器',
  description:
    '免費純前端檔案雜湊計算工具！拖曳檔案即可算出 MD5、SHA-1、SHA-256、SHA-512、CRC32，並可直接丟入官方校驗清單檔案（sha256sum、CHECKSUMS、.sfv）自動比對是否相符，100% 本機運算不上傳。',
  keywords:
    '檔案雜湊計算 md5 sha256 sha512 crc32 checksum verifier 校驗碼 完整性驗證 sha256sum md5sum sfv 線上工具',
  alternates: {
    canonical: 'https://tools.cjkuo.net/checksum-verifier/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/checksum-verifier/',
      en: 'https://tools.cjkuo.net/checksum-verifier/en/',
      'x-default': 'https://tools.cjkuo.net/checksum-verifier/en/',
    },
  },
  openGraph: {
    title: '檔案雜湊計算與校驗工具 - 免費線上 MD5 / SHA-256 / SHA-512 / CRC32 驗證器',
    description: '拖曳檔案計算 MD5/SHA-1/SHA-256/SHA-512/CRC32，並可丟入校驗清單自動比對，100% 純前端運算。',
    url: 'https://tools.cjkuo.net/checksum-verifier/',
  },
  twitter: {
    card: 'summary_large_image',
    title: '檔案雜湊計算與校驗工具 - 免費線上 MD5 / SHA-256 / SHA-512 / CRC32 驗證器',
    description: '拖曳檔案計算 MD5/SHA-1/SHA-256/SHA-512/CRC32，並可丟入校驗清單自動比對，100% 純前端運算。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '檔案雜湊計算與校驗工具',
  url: 'https://tools.cjkuo.net/checksum-verifier/',
  description: '純前端檔案雜湊計算與校驗清單比對工具，支援 MD5、SHA-1、SHA-256、SHA-512、CRC32。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
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
]);

export default function ChecksumVerifierPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <ChecksumVerifierClient />
    </>
  );
}
