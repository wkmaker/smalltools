'use client';

import { useState, useRef, useCallback, useId, useEffect, useMemo } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './cert-generator.module.css';
import {
  parseSanInput,
  generateCaCertificate,
  generateServerCertificate,
  generateSelfSignedCertificate,
  importCaCertificate,
  buildPkcs12,
  supportsPkcs12,
  sanitizeFileSegment,
  KEY_ALGORITHMS,
  type KeyAlgorithm,
  type CertificateBundle,
} from './engine';
import { downloadBlob } from '../utils/downloadBlob';

interface Props {
  lang?: 'zh-TW' | 'en';
}

type Mode = 'self-signed' | 'ca-server';
type OutputFormat = 'pem' | 'der' | 'pkcs12';

interface IdentityOutput {
  label: string;
  certPem: string;
  certDer: ArrayBuffer;
  privateKeyPem: string;
  privateKeyDer: ArrayBuffer;
  fileBaseName: string;
}

const ALGORITHM_LABELS: Record<KeyAlgorithm, string> = {
  'RSA-2048': 'RSA 2048',
  'RSA-4096': 'RSA 4096',
  'ECDSA-P256': 'ECDSA P-256',
  'ECDSA-P384': 'ECDSA P-384',
  'Ed25519': 'Ed25519',
};

function extractCommonName(distinguishedName: string): string {
  const match = distinguishedName.match(/CN=((?:\\.|[^,])+)/);
  return match ? match[1].replace(/\\(.)/g, '$1') : distinguishedName;
}

const COUNTRY_CODE_OTHER = '__OTHER__';

interface CountryOption {
  code: string;
  zh: string;
  en: string;
}

// ISO 3166-1 alpha-2，收錄常見國家；未列出者可於下拉選單選「其他」自行輸入代碼
const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'AE', zh: '阿拉伯聯合大公國', en: 'United Arab Emirates' },
  { code: 'AR', zh: '阿根廷', en: 'Argentina' },
  { code: 'AT', zh: '奧地利', en: 'Austria' },
  { code: 'AU', zh: '澳洲', en: 'Australia' },
  { code: 'BD', zh: '孟加拉', en: 'Bangladesh' },
  { code: 'BE', zh: '比利時', en: 'Belgium' },
  { code: 'BG', zh: '保加利亞', en: 'Bulgaria' },
  { code: 'BR', zh: '巴西', en: 'Brazil' },
  { code: 'CA', zh: '加拿大', en: 'Canada' },
  { code: 'CH', zh: '瑞士', en: 'Switzerland' },
  { code: 'CL', zh: '智利', en: 'Chile' },
  { code: 'CN', zh: '中國', en: 'China' },
  { code: 'CO', zh: '哥倫比亞', en: 'Colombia' },
  { code: 'CZ', zh: '捷克', en: 'Czechia' },
  { code: 'DE', zh: '德國', en: 'Germany' },
  { code: 'DK', zh: '丹麥', en: 'Denmark' },
  { code: 'EG', zh: '埃及', en: 'Egypt' },
  { code: 'ES', zh: '西班牙', en: 'Spain' },
  { code: 'FI', zh: '芬蘭', en: 'Finland' },
  { code: 'FR', zh: '法國', en: 'France' },
  { code: 'GB', zh: '英國', en: 'United Kingdom' },
  { code: 'GR', zh: '希臘', en: 'Greece' },
  { code: 'HK', zh: '香港', en: 'Hong Kong' },
  { code: 'HU', zh: '匈牙利', en: 'Hungary' },
  { code: 'ID', zh: '印尼', en: 'Indonesia' },
  { code: 'IE', zh: '愛爾蘭', en: 'Ireland' },
  { code: 'IL', zh: '以色列', en: 'Israel' },
  { code: 'IN', zh: '印度', en: 'India' },
  { code: 'IS', zh: '冰島', en: 'Iceland' },
  { code: 'IT', zh: '義大利', en: 'Italy' },
  { code: 'JP', zh: '日本', en: 'Japan' },
  { code: 'KE', zh: '肯亞', en: 'Kenya' },
  { code: 'KH', zh: '柬埔寨', en: 'Cambodia' },
  { code: 'KP', zh: '北韓', en: 'North Korea' },
  { code: 'KR', zh: '韓國', en: 'South Korea' },
  { code: 'KW', zh: '科威特', en: 'Kuwait' },
  { code: 'LA', zh: '寮國', en: 'Laos' },
  { code: 'LK', zh: '斯里蘭卡', en: 'Sri Lanka' },
  { code: 'LU', zh: '盧森堡', en: 'Luxembourg' },
  { code: 'MM', zh: '緬甸', en: 'Myanmar' },
  { code: 'MN', zh: '蒙古', en: 'Mongolia' },
  { code: 'MO', zh: '澳門', en: 'Macau' },
  { code: 'MX', zh: '墨西哥', en: 'Mexico' },
  { code: 'MY', zh: '馬來西亞', en: 'Malaysia' },
  { code: 'NG', zh: '奈及利亞', en: 'Nigeria' },
  { code: 'NL', zh: '荷蘭', en: 'Netherlands' },
  { code: 'NO', zh: '挪威', en: 'Norway' },
  { code: 'NP', zh: '尼泊爾', en: 'Nepal' },
  { code: 'NZ', zh: '紐西蘭', en: 'New Zealand' },
  { code: 'PE', zh: '秘魯', en: 'Peru' },
  { code: 'PH', zh: '菲律賓', en: 'Philippines' },
  { code: 'PK', zh: '巴基斯坦', en: 'Pakistan' },
  { code: 'PL', zh: '波蘭', en: 'Poland' },
  { code: 'PT', zh: '葡萄牙', en: 'Portugal' },
  { code: 'QA', zh: '卡達', en: 'Qatar' },
  { code: 'RO', zh: '羅馬尼亞', en: 'Romania' },
  { code: 'RU', zh: '俄羅斯', en: 'Russia' },
  { code: 'SA', zh: '沙烏地阿拉伯', en: 'Saudi Arabia' },
  { code: 'SE', zh: '瑞典', en: 'Sweden' },
  { code: 'SG', zh: '新加坡', en: 'Singapore' },
  { code: 'SK', zh: '斯洛伐克', en: 'Slovakia' },
  { code: 'TH', zh: '泰國', en: 'Thailand' },
  { code: 'TR', zh: '土耳其', en: 'Turkey' },
  { code: 'TW', zh: '台灣', en: 'Taiwan' },
  { code: 'UA', zh: '烏克蘭', en: 'Ukraine' },
  { code: 'US', zh: '美國', en: 'United States' },
  { code: 'VN', zh: '越南', en: 'Vietnam' },
  { code: 'ZA', zh: '南非', en: 'South Africa' },
];

function toIdentity(label: string, bundle: CertificateBundle, nameForFile: string): IdentityOutput {
  return {
    label,
    certPem: bundle.certPem,
    certDer: bundle.certDer,
    privateKeyPem: bundle.privateKeyPem,
    privateKeyDer: bundle.privateKeyDer,
    fileBaseName: sanitizeFileSegment(nameForFile),
  };
}

const TRANSLATIONS = {
  'zh-TW': {
    title: 'CA / 伺服器憑證產生器',
    subtitle: 'SELF-SIGNED CA & SERVER CERT GENERATOR',
    description:
      '純前端自簽憑證產生工具，支援「純自簽」或「CA + 伺服器憑證」兩種模式，可選 RSA / ECDSA / Ed25519 金鑰演算法與 PEM / DER / PKCS#12 輸出格式。適合本地開發與內部測試 HTTPS 環境，所有金鑰運算皆於瀏覽器記憶體完成，私鑰絕不上傳。',
    langToggleLabel: 'English',
    langToggleUrl: '/cert-generator/en/',

    modeLabel: '產生模式',
    modeCaServer: 'CA + 伺服器憑證',
    modeSelfSigned: '純自簽（不經過 CA）',

    caGroupTitle: '根 CA 設定',
    caReuseCheckboxLabel: '沿用目前這組 CA 簽發（不會產生新 CA，不需重新安裝信任）',
    caReuseHint: (label: string, notAfter: string) =>
      `目前沿用 CA：${label}（有效至 ${notAfter}）。取消勾選才會依下方設定產生新的 CA。`,
    caImportToggleLabel: '匯入既有 CA（貼上先前產生並下載的憑證與私鑰）',
    caImportCancelLabel: '取消匯入',
    caImportCertLabel: 'CA 憑證 PEM',
    caImportCertPlaceholder: '貼上 -----BEGIN CERTIFICATE----- 內容',
    caImportKeyLabel: 'CA 私鑰 PEM',
    caImportKeyPlaceholder: '貼上 -----BEGIN PRIVATE KEY----- 內容',
    caImportSubmitBtn: '匯入並沿用此 CA',
    caImportingBtn: '匯入中…',
    importCaSuccessToast: '已匯入 CA，後續將沿用此 CA 簽發',
    errorImportCaRequired: '請貼上 CA 憑證與私鑰的完整 PEM 內容',
    identityGroupTitle: '憑證主體設定',
    caCommonNameLabel: 'CA 名稱（根憑證 Common Name）',
    identityCommonNameLabel: 'Common Name',
    caCommonNamePlaceholder: '例如：My Local Dev CA',
    organizationLabel: '組織名稱（選填）',
    organizationPlaceholder: '例如：My Company Dev',
    countryCodeLabel: '國別代碼（選填，2 碼）',
    countryCodePlaceholder: '例如：TW',
    countryCodeSelectPlaceholder: '未填（選填）',
    countryCodeOtherOption: '其他（自行輸入代碼）',
    countryCodeBackToSelect: '改回下拉選單',

    serverGroupTitle: '伺服器憑證設定',
    serverCommonNameLabel: '伺服器 Common Name',
    identityCommonNamePlaceholder: '例如：localhost 或 example.local',
    sanLabel: '主體別名 SAN（可多筆，逗號或換行分隔）',
    sanPlaceholder: 'example.local, *.example.local, 127.0.0.1, 192.168.1.10',
    sanInvalidHint: (items: string[]) => `以下項目格式無法辨識為 DNS 名稱或 IP，已略過：${items.join('、')}`,

    algorithmLabel: '金鑰演算法',
    validityLabel: '有效天數',
    formatLabel: '輸出格式',
    formatPem: 'PEM',
    formatDer: 'DER',
    formatPkcs12: 'PKCS#12 (.p12)',
    formatPkcs12UnsupportedHint: 'PKCS#12 打包目前僅支援 RSA 金鑰，已切換演算法時會自動改回 PEM',
    pkcs12PasswordLabel: 'PKCS#12 保護密碼',
    pkcs12PasswordPlaceholder: '請輸入 .p12 檔案的保護密碼',
    errorPkcs12PasswordRequired: '請先輸入 PKCS#12 保護密碼',

    generateBtn: '產生憑證',
    generatingBtn: '產生中…',
    errorCommonNameRequired: '請輸入 Common Name',

    warningTitle: '請注意：',
    warningBodyCommon:
      '這是「自簽憑證」，瀏覽器與作業系統預設不會信任，僅適合本地開發或內部測試環境使用。',
    warningBodyCa: 'CA 私鑰是整條信任鏈的根源，請勿用於正式對外服務，也不要外流或提交進版本控制。',

    caIdentityLabel: '根 CA',
    serverIdentityLabel: '伺服器憑證',
    selfSignedIdentityLabel: '自簽憑證',
    certLabel: '憑證',
    keyLabel: '私鑰',
    pkcs12Label: 'PKCS#12 封裝檔',
    copyBtn: '複製',
    downloadBtn: '下載',

    toastCopied: '已複製到剪貼簿',
    toastCopyFailed: '複製失敗，請手動選取複製',

    faqTitle: '常見問題與使用指南 (FAQ)',
    faqSubtitle: '深入了解自簽憑證的適用情境、演算法選擇與安全注意事項',
    faqItems: [
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
    ],
  },
  en: {
    title: 'CA & Server Certificate Generator',
    subtitle: 'SELF-SIGNED CA & SERVER CERT GENERATOR',
    description:
      'Pure client-side self-signed certificate generator supporting both a direct self-signed mode and a CA + server certificate mode, with RSA / ECDSA / Ed25519 key algorithms and PEM / DER / PKCS#12 output formats. Ideal for local development and internal test HTTPS environments — all key generation happens in your browser memory, private keys are never uploaded.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/cert-generator/',

    modeLabel: 'Generation Mode',
    modeCaServer: 'CA + Server Certificate',
    modeSelfSigned: 'Self-Signed Only (no CA)',

    caGroupTitle: 'Root CA Settings',
    caReuseCheckboxLabel: 'Reuse this CA for signing (no new CA is created, no need to re-trust it)',
    caReuseHint: (label: string, notAfter: string) =>
      `Currently reusing CA: ${label} (valid until ${notAfter}). Uncheck to generate a new CA from the settings below.`,
    caImportToggleLabel: 'Import an existing CA (paste a previously generated certificate and key)',
    caImportCancelLabel: 'Cancel import',
    caImportCertLabel: 'CA Certificate PEM',
    caImportCertPlaceholder: 'Paste the -----BEGIN CERTIFICATE----- content',
    caImportKeyLabel: 'CA Private Key PEM',
    caImportKeyPlaceholder: 'Paste the -----BEGIN PRIVATE KEY----- content',
    caImportSubmitBtn: 'Import and reuse this CA',
    caImportingBtn: 'Importing…',
    importCaSuccessToast: 'CA imported — it will be reused for signing from now on',
    errorImportCaRequired: 'Please paste the full PEM content for both the CA certificate and private key',
    identityGroupTitle: 'Certificate Subject Settings',
    caCommonNameLabel: 'CA Name (Root Certificate Common Name)',
    identityCommonNameLabel: 'Common Name',
    caCommonNamePlaceholder: 'e.g. My Local Dev CA',
    organizationLabel: 'Organization (optional)',
    organizationPlaceholder: 'e.g. My Company Dev',
    countryCodeLabel: 'Country Code (optional, 2 letters)',
    countryCodePlaceholder: 'e.g. US',
    countryCodeSelectPlaceholder: 'Not set (optional)',
    countryCodeOtherOption: 'Other (enter code manually)',
    countryCodeBackToSelect: 'Back to dropdown',

    serverGroupTitle: 'Server Certificate Settings',
    serverCommonNameLabel: 'Server Common Name',
    identityCommonNamePlaceholder: 'e.g. localhost or example.local',
    sanLabel: 'Subject Alternative Names (comma or newline separated)',
    sanPlaceholder: 'example.local, *.example.local, 127.0.0.1, 192.168.1.10',
    sanInvalidHint: (items: string[]) =>
      `The following entries could not be recognized as a DNS name or IP and were skipped: ${items.join(', ')}`,

    algorithmLabel: 'Key Algorithm',
    validityLabel: 'Validity (Days)',
    formatLabel: 'Output Format',
    formatPem: 'PEM',
    formatDer: 'DER',
    formatPkcs12: 'PKCS#12 (.p12)',
    formatPkcs12UnsupportedHint: 'PKCS#12 packaging currently supports RSA keys only — switching algorithm reverts this to PEM',
    pkcs12PasswordLabel: 'PKCS#12 Protection Password',
    pkcs12PasswordPlaceholder: 'Enter a password to protect the .p12 file',
    errorPkcs12PasswordRequired: 'Please enter a PKCS#12 protection password first',

    generateBtn: 'Generate Certificate',
    generatingBtn: 'Generating…',
    errorCommonNameRequired: 'Please enter a Common Name',

    warningTitle: 'Note:',
    warningBodyCommon:
      'This is a self-signed certificate, which browsers and operating systems do not trust by default — use it only for local development or internal testing.',
    warningBodyCa: 'The CA private key is the root of this trust chain: never use it for a production-facing service, and never leak it or commit it to version control.',

    caIdentityLabel: 'Root CA',
    serverIdentityLabel: 'Server Certificate',
    selfSignedIdentityLabel: 'Self-Signed Certificate',
    certLabel: 'Certificate',
    keyLabel: 'Private Key',
    pkcs12Label: 'PKCS#12 Bundle',
    copyBtn: 'Copy',
    downloadBtn: 'Download',

    toastCopied: 'Copied to clipboard',
    toastCopyFailed: 'Copy failed, please select and copy manually',

    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Learn when to self-sign directly, how to pick an algorithm, and key security practices',
    faqItems: [
      {
        q: 'Should I use "Self-Signed Only" or "CA + Server Certificate"?',
        a: 'Just one machine, one domain, want the quickest path? Choose "Self-Signed Only" — it issues a single certificate in one step (subject equals issuer). Expect to manage several internal test hosts or domains? Choose "CA + Server Certificate" — import the root CA into your trust store once, and every server certificate it issues afterward is automatically trusted, with no need to re-trust each one.',
      },
      {
        q: 'Should I pick RSA, ECDSA, or Ed25519?',
        a: 'RSA 2048/4096 has the widest compatibility — virtually every system and legacy client recognizes it, and it is the only option that supports PKCS#12 (.p12) packaging here. ECDSA (P-256/P-384) has shorter keys and faster operations, and is well supported by modern browsers and servers (Nginx, Caddy, recent OpenSSL) — a good fit when performance matters. Ed25519 has the fastest signing and shortest keys with strong security, but some older systems or enterprise clients may not support it yet — best when you control both ends of the connection.',
      },
      {
        q: 'Does this tool support post-quantum cryptography (PQC) algorithms such as ML-DSA / Dilithium?',
        a: 'Not yet. Key generation and certificate signing here rely entirely on the browser\'s native Web Crypto API, and that spec does not yet include post-quantum signature algorithms like ML-DSA or SLH-DSA — no mainstream browser implements them either, so a purely client-side tool cannot produce PQC certificates today. X.509 support for PQC algorithms (e.g. RFC 9881) is also still being standardized and isn\'t broadly interoperable yet. We will consider adding it once browser and ecosystem support matures.',
      },
      {
        q: 'What is the difference between PEM, DER, and PKCS#12 output?',
        a: 'PEM is a Base64 text format (`-----BEGIN CERTIFICATE-----`) — the most universal, accepted by Nginx, Apache, and Node.js, and easy to copy-paste. DER is the equivalent binary encoding, common with Java Keystores or certain embedded devices. PKCS#12 (.p12/.pfx) bundles a certificate and private key into one password-protected file, mainly used by Windows IIS, Java Tomcat, or anywhere a single importable file is required — currently RSA keys only.',
      },
      {
        q: 'Why does my browser still show an "insecure" or "not trusted" warning?',
        a: "A self-signed root CA (or a directly self-signed certificate) is not part of your OS or browser's built-in trust store, so the browser cannot verify the authenticity of the chain — this warning is expected, not a bug. To remove it, manually import the generated certificate into your system or browser trust store (see the next question).",
      },
      {
        q: 'How do I make my browser or OS trust this certificate and clear the warning?',
        a: 'Download the root CA certificate (from "CA + Server Certificate" mode) or the certificate itself (from "Self-Signed Only" mode) and import it into your trust store: on Windows, use Certificate Manager (certmgr.msc) under "Trusted Root Certification Authorities"; on macOS, import it via Keychain Access and set it to "Always Trust"; on Linux, place it under /usr/local/share/ca-certificates/ and run update-ca-certificates (path varies by distro). In "CA + Server Certificate" mode, once the CA is imported, every certificate it issues is trusted automatically.',
      },
      {
        q: "How does a self-signed certificate differ from one issued by a public CA like Let's Encrypt? Which should I use?",
        a: "Certificates from public CAs (Let's Encrypt, DigiCert, etc.) are trusted by default across all major browsers and operating systems, and are the right choice for any production-facing domain. Self-signed certificates (whether direct or via your own CA) are only suitable for local development, internal testing, or closed-network services, since only devices that manually install the matching certificate/CA will trust them. Never use one for a production service.",
      },
      {
        q: 'Why do I need to fill in SAN (Subject Alternative Names) instead of relying on Common Name alone?',
        a: "Since 2017, major browsers such as Chrome and Safari no longer accept a certificate's Common Name for domain validation — only the DNS names or IPs listed in the subjectAltName (SAN) extension are honored. If you only set a Common Name without SAN entries, the browser may reject the connection as a domain mismatch. Always list every domain and IP you will use to access this server under SAN.",
      },
      {
        q: 'Is the generated private key safe? Is it ever uploaded to a server?',
        a: 'Never. All key generation and certificate signing here run locally in your browser using the native Web Crypto API (RSA/ECDSA/Ed25519), with no network requests involved at any point. You can even disconnect from the internet and continue generating certificates. Download your private keys and store them safely — refreshing the page clears everything from memory.',
      },
    ],
  },
};

export default function CertGeneratorClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  const caCommonNameId = useId();
  const organizationId = useId();
  const countryCodeId = useId();
  const identityCommonNameId = useId();
  const sanId = useId();
  const validityId = useId();
  const pkcs12PasswordId = useId();
  const importCertPemId = useId();
  const importKeyPemId = useId();

  const [mode, setMode] = useState<Mode>('ca-server');
  const [algorithm, setAlgorithm] = useState<KeyAlgorithm>('RSA-2048');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('pem');
  const [pkcs12Password, setPkcs12Password] = useState('');

  const [caCommonName, setCaCommonName] = useState('');
  const [organization, setOrganization] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [countryCustomMode, setCountryCustomMode] = useState(false);
  const [identityCommonName, setIdentityCommonName] = useState('');
  const [sanInput, setSanInput] = useState('');
  const [validityDays, setValidityDays] = useState(825);

  const countryOptionsSorted = useMemo(
    () =>
      [...COUNTRY_OPTIONS].sort((a, b) =>
        (lang === 'en' ? a.en : a.zh).localeCompare(lang === 'en' ? b.en : b.zh, lang === 'en' ? 'en' : 'zh-Hant')
      ),
    [lang]
  );

  const [savedCa, setSavedCa] = useState<CertificateBundle | null>(null);
  const [savedCaLabel, setSavedCaLabel] = useState('');
  const [reuseCa, setReuseCa] = useState(false);

  const [showCaImport, setShowCaImport] = useState(false);
  const [importCertPemInput, setImportCertPemInput] = useState('');
  const [importKeyPemInput, setImportKeyPemInput] = useState('');
  const [importCaError, setImportCaError] = useState<string | null>(null);
  const [isImportingCa, setIsImportingCa] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [invalidSanHint, setInvalidSanHint] = useState<string | null>(null);
  const [identities, setIdentities] = useState<IdentityOutput[] | null>(null);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#38bdf8');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(56, 189, 248, 0.6)');
  }, []);

  useEffect(() => {
    if (outputFormat === 'pkcs12' && !supportsPkcs12(algorithm)) {
      setOutputFormat('pem');
    }
  }, [algorithm, outputFormat]);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 2500);
  }, []);

  const handleImportCa = useCallback(async () => {
    if (!importCertPemInput.trim() || !importKeyPemInput.trim()) {
      setImportCaError(t.errorImportCaRequired);
      return;
    }
    setImportCaError(null);
    setIsImportingCa(true);
    try {
      const bundle = await importCaCertificate(importCertPemInput, importKeyPemInput);
      setSavedCa(bundle);
      setSavedCaLabel(extractCommonName(bundle.cert.subject));
      setReuseCa(true);
      setShowCaImport(false);
      setImportCertPemInput('');
      setImportKeyPemInput('');
      showToast(t.importCaSuccessToast);
    } catch (e) {
      setImportCaError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsImportingCa(false);
    }
  }, [importCertPemInput, importKeyPemInput, t, showToast]);

  const handleGenerate = useCallback(async () => {
    const trimmedCn = identityCommonName.trim();
    if (!trimmedCn) {
      setErrorMsg(t.errorCommonNameRequired);
      return;
    }
    setErrorMsg(null);
    setIsGenerating(true);
    setIdentities(null);
    setInvalidSanHint(null);

    try {
      const sanEntries = parseSanInput(sanInput);
      if (sanEntries.invalid.length > 0) {
        setInvalidSanHint(t.sanInvalidHint(sanEntries.invalid));
      }

      if (mode === 'self-signed') {
        const bundle = await generateSelfSignedCertificate({
          commonName: trimmedCn,
          organization: organization.trim() || undefined,
          countryCode: countryCode.trim() || undefined,
          sanEntries,
          validityDays,
          algorithm,
        });
        setIdentities([toIdentity(t.selfSignedIdentityLabel, bundle, trimmedCn)]);
      } else {
        let ca: CertificateBundle;
        let caLabel: string;
        if (reuseCa && savedCa) {
          ca = savedCa;
          caLabel = savedCaLabel;
        } else {
          caLabel = caCommonName.trim() || 'Local Dev Root CA';
          ca = await generateCaCertificate({
            commonName: caLabel,
            organization: organization.trim() || undefined,
            countryCode: countryCode.trim() || undefined,
            validityDays,
            algorithm,
          });
          setSavedCa(ca);
          setSavedCaLabel(caLabel);
          setReuseCa(true);
        }
        const server = await generateServerCertificate({
          commonName: trimmedCn,
          sanEntries,
          validityDays,
          algorithm,
          caCert: ca.cert,
          caPrivateKey: ca.privateKey,
          caPublicKey: ca.cert.publicKey,
        });
        setIdentities([
          toIdentity(t.caIdentityLabel, ca, caLabel),
          toIdentity(t.serverIdentityLabel, server, trimmedCn),
        ]);
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setIsGenerating(false);
    }
  }, [
    mode,
    identityCommonName,
    caCommonName,
    organization,
    countryCode,
    sanInput,
    validityDays,
    algorithm,
    reuseCa,
    savedCa,
    savedCaLabel,
    t,
  ]);

  const copyText = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast(t.toastCopied))
      .catch(() => showToast(t.toastCopyFailed));
  };

  const downloadCert = (identity: IdentityOutput) => {
    if (outputFormat === 'der') {
      downloadBlob(new Blob([identity.certDer], { type: 'application/pkix-cert' }), `${identity.fileBaseName}.der`);
    } else {
      downloadBlob(new Blob([identity.certPem], { type: 'application/x-pem-file' }), `${identity.fileBaseName}.pem`);
    }
  };

  const downloadKey = (identity: IdentityOutput) => {
    if (outputFormat === 'der') {
      downloadBlob(new Blob([identity.privateKeyDer], { type: 'application/pkcs8' }), `${identity.fileBaseName}.key.der`);
    } else {
      downloadBlob(new Blob([identity.privateKeyPem], { type: 'application/x-pem-file' }), `${identity.fileBaseName}.key`);
    }
  };

  const downloadPkcs12 = (identity: IdentityOutput) => {
    if (!pkcs12Password) {
      setErrorMsg(t.errorPkcs12PasswordRequired);
      return;
    }
    try {
      const bytes = buildPkcs12(identity.certPem, identity.privateKeyPem, pkcs12Password);
      downloadBlob(new Blob([bytes as BlobPart], { type: 'application/x-pkcs12' }), `${identity.fileBaseName}.p12`);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  };

  const renderPemCard = (title: string, content: string, onDownload: () => void, showDownload: boolean) => (
    <div className={styles.outputCard}>
      <div className={styles.outputHeader}>
        <span className={styles.outputTitle}>{title}</span>
        <div className={styles.outputActions}>
          <button type="button" className={styles.btnCopyPrimary} onClick={() => copyText(content)}>
            {t.copyBtn}
          </button>
          {showDownload && (
            <button type="button" className={styles.btnDownload} onClick={onDownload}>
              {t.downloadBtn}
            </button>
          )}
        </div>
      </div>
      <pre className={styles.pemPreview}>{content}</pre>
    </div>
  );

  const pkcs12Supported = supportsPkcs12(algorithm);

  const renderCountryCodeField = (disabled: boolean) => (
    <div className={styles.fieldGroup}>
      <label htmlFor={countryCodeId} className={styles.fieldLabel}>
        {t.countryCodeLabel}
      </label>
      {countryCustomMode ? (
        <>
          <input
            id={countryCodeId}
            type="text"
            maxLength={2}
            className={styles.textInput}
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
            placeholder={t.countryCodePlaceholder}
            disabled={disabled}
            autoFocus
          />
          <button
            type="button"
            className={styles.inlineLinkBtn}
            disabled={disabled}
            onClick={() => {
              setCountryCustomMode(false);
              setCountryCode('');
            }}
          >
            {t.countryCodeBackToSelect}
          </button>
        </>
      ) : (
        <select
          id={countryCodeId}
          className={styles.textInput}
          value={countryCode}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.value === COUNTRY_CODE_OTHER) {
              setCountryCustomMode(true);
              setCountryCode('');
            } else {
              setCountryCode(e.target.value);
            }
          }}
        >
          <option value="">{t.countryCodeSelectPlaceholder}</option>
          {countryOptionsSorted.map((c) => (
            <option key={c.code} value={c.code}>
              {lang === 'en' ? c.en : c.zh}（{c.code}）
            </option>
          ))}
          <option value={COUNTRY_CODE_OTHER}>{t.countryCodeOtherOption}</option>
        </select>
      )}
    </div>
  );

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#38bdf8"
        accentGlow="rgba(56,189,248,0.6)"
      >
        <div className={styles.mainLayout}>
          <div className={styles.fieldGroup} style={{ marginBottom: '1.5rem' }}>
            <span className={styles.fieldLabel}>{t.modeLabel}</span>
            <div className={styles.pillGroup}>
              <label className={styles.pillOption}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'ca-server'}
                  onChange={() => setMode('ca-server')}
                />
                <span>{t.modeCaServer}</span>
              </label>
              <label className={styles.pillOption}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'self-signed'}
                  onChange={() => setMode('self-signed')}
                />
                <span>{t.modeSelfSigned}</span>
              </label>
            </div>
          </div>

          <div
            className={styles.gridContainer}
            style={mode === 'self-signed' ? { gridTemplateColumns: '1fr' } : undefined}
          >
            {mode === 'ca-server' && (
              <div className={styles.panelCard}>
                <div className="text-sm font-bold text-text-main uppercase tracking-[1px]">{t.caGroupTitle}</div>
                {savedCa && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.pillOption}>
                      <input
                        type="checkbox"
                        checked={reuseCa}
                        onChange={(e) => setReuseCa(e.target.checked)}
                      />
                      <span>{t.caReuseCheckboxLabel}</span>
                    </label>
                    <p className={styles.invalidHint} style={{ color: 'var(--text-secondary, #94a3b8)' }}>
                      {t.caReuseHint(savedCaLabel, savedCa.cert.notAfter.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-TW'))}
                    </p>
                  </div>
                )}

                <div className={styles.fieldGroup}>
                  <button
                    type="button"
                    className={styles.inlineLinkBtn}
                    onClick={() => {
                      setShowCaImport((prev) => !prev);
                      setImportCaError(null);
                    }}
                  >
                    {showCaImport ? t.caImportCancelLabel : t.caImportToggleLabel}
                  </button>
                  {showCaImport && (
                    <>
                      <label htmlFor={importCertPemId} className={styles.fieldLabel}>
                        {t.caImportCertLabel}
                      </label>
                      <textarea
                        id={importCertPemId}
                        className={styles.textArea}
                        value={importCertPemInput}
                        onChange={(e) => setImportCertPemInput(e.target.value)}
                        placeholder={t.caImportCertPlaceholder}
                      />
                      <label htmlFor={importKeyPemId} className={styles.fieldLabel}>
                        {t.caImportKeyLabel}
                      </label>
                      <textarea
                        id={importKeyPemId}
                        className={styles.textArea}
                        value={importKeyPemInput}
                        onChange={(e) => setImportKeyPemInput(e.target.value)}
                        placeholder={t.caImportKeyPlaceholder}
                      />
                      {importCaError && <p className={styles.invalidHint}>{importCaError}</p>}
                      <button
                        type="button"
                        className={styles.btnDownload}
                        onClick={handleImportCa}
                        disabled={isImportingCa}
                      >
                        {isImportingCa ? t.caImportingBtn : t.caImportSubmitBtn}
                      </button>
                    </>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor={caCommonNameId} className={styles.fieldLabel}>
                    {t.caCommonNameLabel}
                  </label>
                  <input
                    id={caCommonNameId}
                    type="text"
                    className={styles.textInput}
                    value={caCommonName}
                    onChange={(e) => setCaCommonName(e.target.value)}
                    placeholder={t.caCommonNamePlaceholder}
                    disabled={reuseCa}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor={organizationId} className={styles.fieldLabel}>
                    {t.organizationLabel}
                  </label>
                  <input
                    id={organizationId}
                    type="text"
                    className={styles.textInput}
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder={t.organizationPlaceholder}
                    disabled={reuseCa}
                  />
                </div>
                {renderCountryCodeField(reuseCa)}
              </div>
            )}

            <div className={styles.panelCard}>
              <div className="text-sm font-bold text-text-main uppercase tracking-[1px]">
                {mode === 'ca-server' ? t.serverGroupTitle : t.identityGroupTitle}
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor={identityCommonNameId} className={styles.fieldLabel}>
                  {mode === 'ca-server' ? t.serverCommonNameLabel : t.identityCommonNameLabel}
                </label>
                <input
                  id={identityCommonNameId}
                  type="text"
                  className={styles.textInput}
                  value={identityCommonName}
                  onChange={(e) => setIdentityCommonName(e.target.value)}
                  placeholder={t.identityCommonNamePlaceholder}
                />
              </div>

              {mode === 'self-signed' && (
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <div className={styles.fieldGroup}>
                    <label htmlFor={organizationId} className={styles.fieldLabel}>
                      {t.organizationLabel}
                    </label>
                    <input
                      id={organizationId}
                      type="text"
                      className={styles.textInput}
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder={t.organizationPlaceholder}
                    />
                  </div>
                  {renderCountryCodeField(false)}
                </div>
              )}

              <div className={styles.fieldGroup}>
                <label htmlFor={sanId} className={styles.fieldLabel}>
                  {t.sanLabel}
                </label>
                <textarea
                  id={sanId}
                  className={styles.textArea}
                  value={sanInput}
                  onChange={(e) => setSanInput(e.target.value)}
                  placeholder={t.sanPlaceholder}
                />
                {invalidSanHint && <p className={styles.invalidHint}>{invalidSanHint}</p>}
              </div>

              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>{t.algorithmLabel}</span>
                <div className={styles.pillGroup}>
                  {KEY_ALGORITHMS.map((algo) => (
                    <label key={algo} className={styles.pillOption}>
                      <input
                        type="radio"
                        name="algorithm"
                        checked={algorithm === algo}
                        onChange={() => setAlgorithm(algo)}
                      />
                      <span>{ALGORITHM_LABELS[algo]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>{t.formatLabel}</span>
                <div className={styles.pillGroup}>
                  <label className={styles.pillOption}>
                    <input
                      type="radio"
                      name="format"
                      checked={outputFormat === 'pem'}
                      onChange={() => setOutputFormat('pem')}
                    />
                    <span>{t.formatPem}</span>
                  </label>
                  <label className={styles.pillOption}>
                    <input
                      type="radio"
                      name="format"
                      checked={outputFormat === 'der'}
                      onChange={() => setOutputFormat('der')}
                    />
                    <span>{t.formatDer}</span>
                  </label>
                  <label
                    className={`${styles.pillOption} ${!pkcs12Supported ? styles.pillDisabled : ''}`}
                    title={!pkcs12Supported ? t.formatPkcs12UnsupportedHint : undefined}
                  >
                    <input
                      type="radio"
                      name="format"
                      disabled={!pkcs12Supported}
                      checked={outputFormat === 'pkcs12'}
                      onChange={() => pkcs12Supported && setOutputFormat('pkcs12')}
                    />
                    <span>{t.formatPkcs12}</span>
                  </label>
                </div>
                {!pkcs12Supported && <p className={styles.invalidHint}>{t.formatPkcs12UnsupportedHint}</p>}
              </div>

              {outputFormat === 'pkcs12' && (
                <div className={styles.fieldGroup}>
                  <label htmlFor={pkcs12PasswordId} className={styles.fieldLabel}>
                    {t.pkcs12PasswordLabel}
                  </label>
                  <input
                    id={pkcs12PasswordId}
                    type="password"
                    className={styles.textInput}
                    value={pkcs12Password}
                    onChange={(e) => setPkcs12Password(e.target.value)}
                    placeholder={t.pkcs12PasswordPlaceholder}
                  />
                </div>
              )}

              <div className={styles.fieldGroup}>
                <div className="flex justify-between items-center">
                  <label htmlFor={validityId} className={styles.fieldLabel}>
                    {t.validityLabel}
                  </label>
                  <span className="font-mono text-lg font-bold" style={{ color: '#38bdf8' }}>
                    {validityDays}
                  </span>
                </div>
                <input
                  id={validityId}
                  type="range"
                  min={1}
                  max={3650}
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value, 10))}
                  className={styles.customSlider}
                />
              </div>

              {errorMsg && <p className={styles.invalidHint}>{errorMsg}</p>}

              <button
                type="button"
                className={styles.btnGenerate}
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? t.generatingBtn : t.generateBtn}
              </button>

              <div className={styles.warningBanner}>
                <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="shrink-0 mt-0.5">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
                <span>
                  <strong>{t.warningTitle}</strong> {t.warningBodyCommon}
                  {mode === 'ca-server' && ` ${t.warningBodyCa}`}
                </span>
              </div>
            </div>
          </div>

          {identities && (
            <div className="flex flex-col gap-6 mt-8">
              {identities.map((identity) => (
                <div key={identity.label} className="flex flex-col gap-3">
                  <div className="text-sm font-bold text-text-main uppercase tracking-[1px]">{identity.label}</div>
                  {renderPemCard(t.certLabel, identity.certPem, () => downloadCert(identity), outputFormat !== 'pkcs12')}
                  {renderPemCard(t.keyLabel, identity.privateKeyPem, () => downloadKey(identity), outputFormat !== 'pkcs12')}
                  {outputFormat === 'pkcs12' && (
                    <div className={styles.outputCard}>
                      <div className={styles.outputHeader}>
                        <span className={styles.outputTitle}>{t.pkcs12Label}</span>
                        <div className={styles.outputActions}>
                          <button
                            type="button"
                            className={styles.btnDownload}
                            onClick={() => downloadPkcs12(identity)}
                          >
                            {t.downloadBtn}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <FaqSection
          items={t.faqItems}
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          accentColor="#38bdf8"
          className="mt-8"
        />
      </ToolLayout>

      <div
        className={`fixed bottom-8 right-8 flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl z-[100] pointer-events-none
          bg-surface-glass border border-border-glass backdrop-blur-[16px] text-text-main shadow-lg
          transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="#38bdf8">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}
