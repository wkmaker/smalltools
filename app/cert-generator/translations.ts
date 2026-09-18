/**
 * CA / 伺服器憑證產生器頁面中英文案（從 CertGeneratorClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
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
    clearBtn: '清除欄位',
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
    clearBtn: 'Clear Fields',
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
