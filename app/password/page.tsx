import type { Metadata } from 'next';
import PasswordGeneratorClient from './PasswordGeneratorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '高強度亂數密碼產生器 - 免費線上 CSPRNG 安全密碼與 Passphrase 生成工具',
  description:
    '專業免費的線上高強度密碼產生器！支援自訂長度、大小寫英文字母、數字與特殊符號組合，即時計算密碼強度熵值 (Entropy)。',
  keywords: '密碼產生器,亂數密碼產生器,高強度密碼,密碼生成器,隨機密碼,線上密碼產生器,防破解密碼,密碼強度測試,CSPRNG,Passphrase產生器,WiFi密碼產生器',
  alternates: {
    canonical: 'https://tools.cjkuo.net/password/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/password/',
      en: 'https://tools.cjkuo.net/password/en/',
      'x-default': 'https://tools.cjkuo.net/password/en/',
    },
  },
  openGraph: {
    title: '高強度亂數密碼產生器 - 免費線上 CSPRNG 安全密碼與 Passphrase 生成工具',
    description: '安全純前端亂數密碼產生器，支援強度熵值評估與自訂字元組合。',
    url: 'https://tools.cjkuo.net/password/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '高強度亂數密碼產生器 - 免費線上 CSPRNG 安全密碼與 Passphrase 生成工具',
    description: '安全純前端亂數密碼產生器，支援強度熵值評估與自訂字元組合。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '高強度亂數密碼產生器',
  url: 'https://tools.cjkuo.net/password/',
  description: '專業免費的線上客製化亂數密碼產生器，支援密碼強度熵值評估。',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是 CSPRNG (密碼學安全偽亂數生成器)？與一般隨機數有何不同？',
    a: `CSPRNG (Cryptographically Secure Pseudo-Random Number Generator) 是一種經過密碼學嚴格檢驗的隨機數生成引擎。

傳統程式語言的 Math.random() 屬於普通偽亂數，其產生的亂數序列具有可預測的週期性，容易被駭客透過演算法推算與破解。

本工具採用現代瀏覽器原生 window.crypto.getRandomValues() CSPRNG 引擎，利用作業系統底層的物理熵源（如系統中斷、硬體雜訊）產生真正具備不可預測性與均勻分佈的高強度亂數。`,
  },
  {
    q: '在線上網頁生成密碼安全嗎？生成的密碼會被上傳或傳輸到伺服器嗎？',
    a: `絕對安全！本工具採用 100% 純前端客戶端 (Client-Side) 運算架構。

所有的密碼生成、隨機抽樣、強度熵值計算與歷史記錄皆在您的本機瀏覽器記憶體中完成，全程完全不透過網路發送任何 HTTP 請求，絕不經過任何伺服器中轉。

您可以隨時中斷網路連線（開啟飛行模式或關閉 Wi-Fi）繼續使用本工具生成密碼。此外，網頁亦不會將密碼寫入 localStorage 或是任何持久化儲存空間，刷新頁面即自動清空記憶體。`,
  },
  {
    q: '密碼強度與資訊熵 (Entropy) 是如何計算的？幾位數以上的密碼才算安全？',
    a: `密碼強度主要取決於資訊熵 (Entropy)，單位為位元 (Bits)，計算公式為 Entropy = Password_Length * log2(Charset_Size)。

資訊熵代表駭客使用暴力破解 (Brute-force Attack) 需要嘗試的所有可能性組合總數：

① 8 位數純數字：約 26.5 Bits 熵值，幾毫秒內即可被破解。
② 12 位數大小寫字母與數字：約 71.4 Bits 熵值，需耗費數年破解。
③ 16 位數包含特殊符號：超過 100 Bits 熵值，以目前的超級電腦運算力需耗費數百億年亦無法暴力破解。

建議一般帳號密碼長度至少設定為 16 位數以上，並包含大小寫字母、數字與特殊符號組合。`,
  },
  {
    q: '什麼是「排除易混淆字元」與「強制包含每種字元」設定？',
    a: `這兩項高級設定專為提昇密碼可用性與安全性而設計：

① 排除易混淆字元：自動剔除視覺上極為相似的字元組合（例如大寫 I 與小寫 l、數字 0 與大寫 O、數字 1 與小寫 l 等）。當您需要手動印出、抄寫或在行動裝置上人工輸入密碼時，能徹底防範輸入錯誤。

② 強制包含每種字元：啟用後可防範純隨機抽樣可能發生的統計偏差，確保生成的密碼在選定的每一個字元集中（大寫、小寫、數字、符號）至少各出現一次，使密碼的字元分佈更加均勻。`,
  },
  {
    q: '為什麼部分網站會拒絕包含特殊符號的隨機密碼？該如何解決？',
    a: `部分舊型系統、資料庫或特定的網路設備（如某些 SQL 資料庫、VPN 客戶端或傳統 API 端點）對特殊符號設有嚴格的轉義 (Escape) 或驗證規則。

本工具將特殊符號拆分為兩組：
① 通用特殊符號 (!@#$%^&*_-+=)：相容性高，絕大多數現代網站與系統皆支援。
② 其他相容性符號 (()[]{}.,:;?)：包含括號與標點符號，部分舊系統可能會引發解析錯誤。

若您設定的網站提示密碼格式不合法，可嘗試關閉「其他特殊符號」，僅保留「通用特殊符號」重新生成。`,
  },
  {
    q: '如何建立既好記又安全的高強度密碼？(Passphrase 密語原則)',
    a: `對於無法使用密碼管理員（Password Manager）儲存、需要人工記憶的主密碼（Master Password）或提款卡密碼，建議採用「密語 (Passphrase)」原則：

選取 4 至 5 個彼此不相干的隨機單字或詞彙組成長字串（如 correct-horse-battery-staple），中間加上數字與特殊符號。

長度達 20 位數以上的 Passphrase 具備極高的資訊熵（難以被電腦爆破），同時又比傳統無意義的亂數字串更容易在人類腦海中形成視覺與語意聯想記憶。`,
  },
  {
    q: '使用線上密碼產生工具的安全建議與免責聲明',
    a: `【安全最佳實踐與免責聲明】

① 建議搭配知名且開放原始碼的密碼管理工具（如 Bitwarden、1Password、KeePass 等）進行集中保管與端到端加密儲存。

② 即使密碼長度與強度極高，亦建議在關鍵重要帳號（如 Email、金融銀行、社群媒體）強制啟用雙重身分驗證 (2FA / MFA)。

③ 本工具僅提供免費線上密碼生成與安全評估輔助服務。使用者於本工具生成的密碼需自行保管，作者與本站不承擔因密碼保管不當、第三方服務洩漏或帳號遭存取所衍生之任何直接或間接損失。`,
  },
]);

export default function PasswordPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <PasswordGeneratorClient />
    </>
  );
}

