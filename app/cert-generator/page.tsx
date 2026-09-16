import type { Metadata } from 'next';
import CertGeneratorClient from './CertGeneratorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'CA / 伺服器憑證產生器 - 免費線上自簽 RSA/ECDSA/Ed25519 SSL 憑證產生工具',
  description:
    '純前端自簽憑證產生工具！支援「純自簽」或「CA + 伺服器憑證」兩種模式，可選 RSA 2048/4096、ECDSA P-256/P-384 或 Ed25519 金鑰演算法，並輸出 PEM、DER 或 PKCS#12 格式，適合本地開發與內部測試 HTTPS 環境。',
  keywords: 'CA憑證產生器,自簽憑證,伺服器憑證,self-signed certificate,根憑證,SAN,RSA,ECDSA,Ed25519,PKCS12,DER,localhost https,本地開發憑證',
  alternates: {
    canonical: 'https://tools.cjkuo.net/cert-generator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/cert-generator/',
      en: 'https://tools.cjkuo.net/cert-generator/en/',
      'x-default': 'https://tools.cjkuo.net/cert-generator/en/',
    },
  },
  openGraph: {
    title: 'CA / 伺服器憑證產生器 - 免費線上自簽 RSA/ECDSA/Ed25519 SSL 憑證產生工具',
    description: '純前端自簽憑證產生工具，支援純自簽或 CA + 伺服器兩種模式、多種金鑰演算法與 PEM/DER/PKCS#12 輸出格式。',
    url: 'https://tools.cjkuo.net/cert-generator/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CA / 伺服器憑證產生器 - 免費線上自簽 RSA/ECDSA/Ed25519 SSL 憑證產生工具',
    description: '純前端自簽憑證產生工具，支援純自簽或 CA + 伺服器兩種模式、多種金鑰演算法與 PEM/DER/PKCS#12 輸出格式。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'CA / 伺服器憑證產生器',
  url: 'https://tools.cjkuo.net/cert-generator/',
  description: '專業免費的純前端自簽憑證產生工具，支援純自簽或 CA + 伺服器兩種模式、RSA/ECDSA/Ed25519 金鑰演算法與 PEM/DER/PKCS#12 輸出格式。',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '「純自簽」跟「CA + 伺服器憑證」該選哪一種？',
    a: '只有一台機器、一個網域，圖個方便 → 選「純自簽」，一步產生單張憑證（subject 與 issuer 相同）。預期會有多台內部測試機或多個網域要管理 → 選「CA + 伺服器憑證」，只要把這張根 CA 匯入信任清單一次，之後由它簽發的所有伺服器憑證都會自動被信任，不用每張都重新設定。',
  },
  {
    q: '金鑰演算法該選 RSA、ECDSA 還是 Ed25519？',
    a: 'RSA 2048/4096 相容性最好，幾乎所有系統與舊版用戶端都能識別，也是唯一支援打包 PKCS#12 (.p12) 的選項。ECDSA (P-256/P-384) 金鑰更短、運算更快，現代瀏覽器與伺服器（Nginx、Caddy、現代版 OpenSSL）皆已良好支援，適合追求效能的場景。Ed25519 簽章速度最快、金鑰最短，安全性也很高，但較舊的系統或部分企業用戶端可能尚未支援，適合已知雙方環境都支援新演算法的內部場景。',
  },
  {
    q: '這個工具支援後量子密碼（PQC，例如 ML-DSA / Dilithium）演算法嗎？',
    a: '目前不支援。本工具的金鑰產生與憑證簽署完全依賴瀏覽器原生 Web Crypto API，該規格本身尚未納入 ML-DSA、SLH-DSA 等後量子簽章演算法，主流瀏覽器也尚未實作，純前端環境因此無法產生 PQC 憑證。此外，X.509 對 PQC 演算法的簽章格式（如 RFC 9881）仍在標準化與生態整合階段，各系統相容性尚未成熟。待瀏覽器與生態支援度提升後，會評估納入。',
  },
  {
    q: 'PEM、DER、PKCS#12 這三種輸出格式有什麼差異？',
    a: 'PEM 是 Base64 文字格式（`-----BEGIN CERTIFICATE-----`），最通用，Nginx、Apache、Node.js 都吃這個格式，也方便直接複製貼上。DER 是對應的二進位格式，常見於 Java Keystore 或部分嵌入式裝置。PKCS#12 (.p12/.pfx) 是把憑證與私鑰用密碼加密封裝成單一檔案，主要給 Windows IIS、Java Tomcat 或需要匯入單一憑證檔的場景使用，目前僅支援 RSA 金鑰。',
  },
  {
    q: '為什麼瀏覽器仍顯示「不安全」或「憑證不受信任」的警告？',
    a: '自簽憑證的根 CA（或純自簽憑證本身）並未被您的作業系統或瀏覽器內建的信任清單收錄，因此瀏覽器無法驗證這張憑證鏈的真實性，才會顯示警告。這是正常現象，並非工具產生錯誤。若要消除警告，需要手動將產生的憑證匯入系統或瀏覽器的信任清單（見下一題）。',
  },
  {
    q: '如何讓瀏覽器或作業系統信任這張憑證，消除警告？',
    a: '下載「CA + 伺服器憑證」模式產生的根 CA 憑證（或「純自簽」模式產生的那張憑證），依作業系統將其匯入受信任的根憑證授權單位：Windows 可用「憑證管理員 (certmgr.msc)」匯入至「受信任的根憑證授權單位」；macOS 可透過「鑰匙圈存取」匯入並設定為一律信任；Linux 則視發行版將憑證放入 /usr/local/share/ca-certificates/ 後執行 update-ca-certificates。若是「CA + 伺服器憑證」模式，匯入 CA 後，由它簽發的所有伺服器憑證都會自動被信任。',
  },
  {
    q: '自簽憑證與 Let\'s Encrypt 等公開 CA 簽發的憑證有何差異？什麼情境該用哪一種？',
    a: '公開 CA（如 Let\'s Encrypt、DigiCert）簽發的憑證會被所有主流瀏覽器與作業系統預設信任，適合正式對外服務的網域。自簽憑證（無論是純自簽或自建 CA）僅適合內部測試、本地開發（如 localhost HTTPS）、或封閉網路環境的內部服務，因為只有手動安裝了對應憑證/CA 的裝置才會信任它。正式對外服務請務必改用受信任的公開 CA。',
  },
  {
    q: '為什麼要填寫 SAN（主體別名）而不是只靠 Common Name？',
    a: '自 2017 年起，Chrome、Safari 等主流瀏覽器已不再採信憑證的 Common Name 作為網域驗證依據，僅承認 subjectAltName (SAN) 擴充欄位中列出的 DNS 名稱或 IP。若只填 Common Name 而未填 SAN，瀏覽器可能直接判定憑證與網域不符並拒絕連線，因此請務必在 SAN 欄位列出所有會用來存取此伺服器的網域與 IP。',
  },
  {
    q: '產生的私鑰安全嗎？會不會被上傳到伺服器？',
    a: '完全不會。本工具所有金鑰產生與憑證簽署運算皆使用瀏覽器原生 Web Crypto API（RSA/ECDSA/Ed25519）在本機記憶體中完成，全程不發送任何網路請求。您甚至可以切斷網路連線後繼續使用本工具產生憑證。請自行下載私鑰後妥善保管，重新整理頁面即會清空所有記憶體內容。',
  },
]);

export default function CertGeneratorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <CertGeneratorClient />
    </>
  );
}
