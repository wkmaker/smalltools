/**
 * SSL 憑證格式轉換器頁面中英文案（從 SslConverterClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    title: 'SSL 憑證格式轉換器',
    subtitle: 'SSL CERTIFICATE CONVERTER',
    description:
      '專業免費的線上 SSL 憑證格式轉換工具！支援 PFX/P12, PEM, DER 雙向純前端安全轉換、憑證過期時間自動檢測與私鑰模數配對雜湊比對。',
    langToggleLabel: 'English',
    langToggleUrl: '/ssl-converter/en/',
    closeAlert: '關閉提示訊息',
    tabChainFix: '憑證剖析與自動補鏈',
    tabPfxToPem: 'PFX / P12 轉 PEM',
    tabPemToPfx: 'PEM 轉 PFX / P12',
    tabDerToPem: 'DER 轉 PEM',
    tabPemToDer: 'PEM 轉 DER',

    cerUploadLabel: '上傳 CER / CRT / PEM / DER / PFX / P12 憑證檔案',
    cerUploadPrompt: '拖曳 .cer, .crt, .pem, .der, .pfx 或 .p12 憑證至此，或點擊選擇檔案',
    cerUploadSub: '支援二進位 DER / PKCS#12 (PFX) 或 Base64 PEM 格式憑證',
    cerTextLabel: '或直接粘貼 PEM 憑證文字 (選填)',
    cerPassLabel: '憑證/私鑰解密保護密碼 (選填)',
    cerPassPlaceholder: '若憑證或加密私鑰含有密碼請輸入 (無加密請留空)',
    cerSubmitBtn: '剖析憑證並自動檢測 AIA 候補憑證鏈',

    pfxUploadLabel: '上傳 PFX / P12 檔案 (.pfx / .p12)',
    pfxUploadPrompt: '拖曳 .pfx 或 .p12 憑證至此，或點擊選擇檔案',
    pfxUploadSub: '支援二進位 PKCS#12 憑證包',
    pfxPassLabel: 'PFX 解密保護密碼',
    pfxPassPlaceholder: '若憑證設有密碼請輸入 (若無密碼請留空)',
    pfxSubmitBtn: '解密並轉換 PEM 憑證鏈與私鑰',

    pemKeyLabel: '私鑰 Private Key (.key)',
    pemCertLabel: '伺服器憑證 Certificate (.crt)',
    pemCaLabel: '中繼憑證鏈 CA Bundle (選填)',
    pemPassLabel: '設定 PFX 保護密碼',
    pemPassPlaceholder: '請輸入加密密碼',
    pemFriendlyNameLabel: '憑證別名 Friendly Name (選填)',
    pemFriendlyNamePlaceholder: '預設：ssl-converter-certificate',
    pemSubmitBtn: '驗證 Modulus 匹配並打包下載 PFX',

    derUploadLabel: '上傳二進位 DER / CER / CRT 檔案',
    derUploadPrompt: '拖曳 .der, .cer 或 .crt 檔案至此，或點擊選擇檔案',
    derUploadSub: '支援二進位 ASN.1 / DER 編碼之憑證或私鑰檔',
    derSubmitBtn: '轉換為 PEM 文字格式',

    pemDerInputLabel: '粘貼 PEM 文字憑證或私鑰 (.crt / .pem / .key)',
    pemDerSubmitBtn: '轉換並下載二進位 DER 檔案',

    clearBtn: '清空內容',
    toastCleared: '已清空輸入內容與結果！',
    removeFile: '移除檔案',
    showPass: '顯示',
    hidePass: '隱藏',
    resultTitle: '憑證剖析與成果明細',
    hideResult: '隱藏結果',
    copyText: '複製文字',
    downloadFile: '下載',
    openInChainFix: '帶入補鍊工具',
    toastSentToChainFix: '已將憑證自動帶入「憑證補鍊」頁籤！',
    aiaIncompleteWarning: '偵測到憑證鏈不完整，建議補齊中繼憑證',
    aiaNextFound: (level: number) => `成功解析第 ${level} 層中繼憑證！已偵測到下一層 CA URL`,
    aiaHelpText: '請點擊下方連結下載官方 CA 中繼憑證，並將下載的檔案拖曳至下方上傳區進行合成：',
    aiaSaveAsTip: '貼心提醒：若點擊無法開啟，請右鍵點擊連結選擇「另存連結為...」下載檔案。',
    aiaUploadPrompt: '拖曳已下載的 CA 中繼憑證檔案至此，或點擊選擇檔案',
    aiaUploadSub: '系統將自動為您驗證並合成進入現有憑證鏈中',

    faqTitle: '常問問題與專業指南 (FAQ)',
    faqSubtitle: '深入了解 SSL 憑證格式轉譯、金鑰模數比對與中繼憑證鏈補齊',
    faqItems: [
      {
        q: '在線上進行 SSL 憑證與私鑰 (Private Key) 格式轉換安全嗎？私鑰會不會外洩？',
        a: `100% 安全！SSL 私鑰相當於伺服器的數位印章與加密金鑰，一旦流出將面臨中間人攻擊 (MITM) 風險。傳統線上轉換器會將私鑰傳輸至後端伺服器運算，存在伺服器 Log 留存或網路攔截風險。

本工具採用「零伺服器 (Zero-Server Architecture)」原則，100% 於您的瀏覽器記憶體內完成處理。甚至在您開啟本網頁後切斷網路 (WiFi / 網線)，依然能 100% 離線完成所有 PFX 解密與 PEM/DER 轉譯，絕無任何傳輸疑慮。`,
      },
      {
        q: '為什麼可以在前端網頁執行 OpenSSL 級別的憑證運算，而不需後端伺服器服務？',
        a: '過往憑證轉碼仰賴伺服器端的 OpenSSL 指令。本工具運用現代瀏覽器強大的 Web Cryptography API 與高效率 JavaScript 密碼學引擎 (Node-Forge)，可在瀏覽器本地記憶體中直接剖析 ASN.1 二進位結構、解密 3DES / AES 加密的 PKCS#12 容器、並進行 RSA / ECC 密碼學 Modulus 雜湊比對。全過程零伺服器延遲、零硬碟寫入，且完全不消耗伺服器頻寬與運算資源。',
      },
      {
        q: '為什麼「自動偵測補鏈 (AIA CA Chain Auto-Fix)」對網站營運極為重要？',
        a: `當部署 SSL 憑證時，若未包含「中繼憑證 (Intermediate CA)」，會引發嚴重的相容性災難：

① 電腦版 Chrome/Edge 可能正常：因為桌面瀏覽器會自動下載 AIA 候補憑證或讀取本機快取。
② 手機版 iOS Safari、Android 或 API 客戶端直接崩潰：跳出 NET::ERR_CERT_AUTHORITY_INVALID 警告或 API 呼叫失敗 (unable to get local issuer certificate)。

本工具能自動解析憑證內的 AIA (Authority Information Access) 擴充欄位，精準抓取缺漏的官方 CA 下載網址，協助您一鍵合成分開的中繼憑證鏈！`,
      },
      {
        q: '常見的 SSL 憑證格式 (PFX/P12, PEM, CRT, DER) 有何不同？在什麼伺服器使用？',
        a: `SSL 憑證格式主要分為三大類別與對應伺服器：

① PEM / CRT / KEY (Base64 ASCII)：
純文字編碼檔（內文以 -----BEGIN CERTIFICATE----- 開頭），廣泛用於 Nginx、Apache、Cloudflare、AWS ELB 及 Node.js 伺服器。

② PFX / P12 (PKCS#12 二進位包)：
將伺服器憑證、私鑰與 CA 中繼鏈加密打包為單一檔，專用於 Windows IIS、Azure Web Apps 及 Tomcat / Java Web App。

③ DER / CER (ASN.1 二進位編碼)：
二進位原生格式，常見於 Java Web Server (Keystore)、嵌入式設備或舊版 Windows/Android 系統存取驗證。`,
      },
      {
        q: '為什麼將 PFX / P12 轉換為 PEM 時會需要輸入密碼？',
        a: '.pfx 或 .p12 是經過 3DES 或 AES 密碼學加密的 PKCS#12 二進位包裹，專門用來保護極為敏感的私鑰 (Private Key)。轉換時必須輸入當初在 IIS 或 Server 匯出時設定的保護密碼，瀏覽器本機的密碼引擎才能解開 PKCS#12 加密區塊並提煉出 PEM 憑證與私鑰。',
      },
      {
        q: '如何確認我上傳的 SSL 私鑰 (Private Key) 與憑證 (Certificate) 是否相互配對？',
        a: 'SSL 憑證與私鑰共享相同的公鑰模數 (Modulus)。本工具會自動對上傳的憑證與私鑰計算 SHA-256 雜湊值 (Hash)，若兩者的 Modulus Hash 100% 一致，即代表這組私鑰與憑證精準配對，免除部署至 Nginx/Apache 伺服器時才發現私鑰錯配導致 Web Server 啟動失敗的窘境。',
      },
      {
        q: '憑證過期後還能使用本工具進行格式轉換嗎？過期警告機制如何運作？',
        a: '可以。過期的憑證依然可以進行格式轉換（例如將過期憑證轉為 PEM 以利歸檔備份）。同時，工具會在結果面板自動解析憑證的「發行對象 (Subject)」、「頒發者 (Issuer)」與「有效期限 (Not After)」，若憑證過期或即將於 30 天內到期，會觸發醒目提示提醒您儘速續期。',
      },
    ],
  },
  en: {
    title: 'SSL Certificate Converter',
    subtitle: 'SSL CERTIFICATE CONVERTER',
    description:
      'Professional free online SSL certificate format converter. Convert PFX/P12, PEM, and DER with client-side security, certificate chain auto-fix, and expiration checks.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/ssl-converter/',
    closeAlert: 'Close alert',
    tabChainFix: 'Parse & Fix Chain',
    tabPfxToPem: 'PFX / P12 to PEM',
    tabPemToPfx: 'PEM to PFX / P12',
    tabDerToPem: 'DER to PEM',
    tabPemToDer: 'PEM to DER',

    cerUploadLabel: 'Upload CER / CRT / PEM / DER / PFX / P12 Certificate File',
    cerUploadPrompt: 'Drag & drop .cer, .crt, .pem, .der, .pfx or .p12 file here, or click to browse',
    cerUploadSub: 'Supports binary DER, PKCS#12 (PFX/P12), or Base64 PEM certificates',
    cerTextLabel: 'Or paste PEM certificate text directly (Optional)',
    cerPassLabel: 'Decryption Password for Cert/Private Key (Optional)',
    cerPassPlaceholder: 'Enter password if encrypted (Leave empty if none)',
    cerSubmitBtn: 'Parse Certificate & Auto-detect AIA CA Chain',

    pfxUploadLabel: 'Upload PFX / P12 File (.pfx / .p12)',
    pfxUploadPrompt: 'Drag & drop .pfx or .p12 file here, or click to browse',
    pfxUploadSub: 'Supports binary PKCS#12 certificate bundles',
    pfxPassLabel: 'PFX Decryption Password',
    pfxPassPlaceholder: 'Enter password if set (Leave empty if none)',
    pfxSubmitBtn: 'Decrypt & Convert to PEM Certificate Chain & Key',

    pemKeyLabel: 'Private Key (.key)',
    pemCertLabel: 'Server Certificate (.crt)',
    pemCaLabel: 'Intermediate CA Bundle (Optional)',
    pemPassLabel: 'Set PFX Protection Password',
    pemPassPlaceholder: 'Enter encryption password',
    pemFriendlyNameLabel: 'Friendly Name (Optional)',
    pemFriendlyNamePlaceholder: 'Default: ssl-converter-certificate',
    pemSubmitBtn: 'Verify Modulus Match & Package PFX Download',

    derUploadLabel: 'Upload Binary DER / CER / CRT File',
    derUploadPrompt: 'Drag & drop .der, .cer or .crt file here, or click to browse',
    derUploadSub: 'Supports binary ASN.1 / DER encoded certificates or keys',
    derSubmitBtn: 'Convert to PEM Text Format',

    pemDerInputLabel: 'Paste PEM Certificate or Private Key (.crt / .pem / .key)',
    pemDerSubmitBtn: 'Convert & Download Binary DER File',

    clearBtn: 'Clear',
    toastCleared: 'Input and results cleared!',
    removeFile: 'Remove File',
    showPass: 'Show',
    hidePass: 'Hide',
    resultTitle: 'Certificate Parsing & Output Details',
    hideResult: 'Hide Result',
    copyText: 'Copy Text',
    downloadFile: 'Download',
    openInChainFix: 'Open in Chain Fixer',
    toastSentToChainFix: 'Certificate loaded into Certificate Chain Fixer!',
    aiaIncompleteWarning: 'Incomplete certificate chain detected. Intermediate CA recommended.',
    aiaNextFound: (level: number) => `Parsed layer ${level} intermediate CA! Next CA URL detected.`,
    aiaHelpText: 'Click the link below to download the official intermediate CA, then upload it below to synthesize:',
    aiaSaveAsTip: 'Tip: If clicking fails, right-click the link and select "Save Link As..." to download.',
    aiaUploadPrompt: 'Drag & drop downloaded CA intermediate cert here, or click to browse',
    aiaUploadSub: 'The system will automatically verify and synthesize into the certificate chain',

    faqTitle: 'Frequently Asked Questions & Guide',
    faqSubtitle: 'Learn more about SSL formats, certificate chain repair, and modulus matching.',
    faqItems: [
      {
        q: 'Is it safe to convert SSL certificates and private keys online? Will my private key be leaked?',
        a: `100% safe! SSL private keys are master credentials for server identity. Traditional online converters upload your key to remote servers, risking server log exposure or network sniffing.

Our tool operates on a Zero-Server Architecture principle: 100% of processing happens inside your browser RAM. You can even disconnect your Wi-Fi or Internet after loading the page and perform all PFX decryptions and PEM/DER conversions completely offline with zero leak risks.`,
      },
      {
        q: 'How can a browser perform OpenSSL-grade certificate processing without backend servers?',
        a: 'Historically, certificate conversions required server-side OpenSSL CLI. This tool leverages modern browser Web Cryptography API and a high-performance JavaScript cryptography engine (Node-Forge) to parse ASN.1 binary structures, decrypt 3DES/AES encrypted PKCS#12 bundles, and verify RSA/ECC modulus hashes directly in client RAM. This guarantees zero server latency, zero disk writes, and zero data transmission.',
      },
      {
        q: 'Why is Certificate Chain Auto-Detection & AIA Repair crucial for website uptime?',
        a: `Deploying an SSL cert without its Intermediate CA creates severe compatibility failures:

① Desktop Chrome/Edge might work due to AIA auto-fetching or cached CAs.
② Mobile Safari (iOS), Android, and API clients will crash, displaying NET::ERR_CERT_AUTHORITY_INVALID or unable to get local issuer certificate errors.

Our tool automatically parses the AIA (Authority Information Access) extension in your cert, pinpoints missing intermediate CA URLs, and lets you synthesize complete CA bundles with one click!`,
      },
      {
        q: 'What is the difference between PFX/P12, PEM, CRT, and DER formats?',
        a: `SSL certificate formats are categorized into three main types based on server environments:

① PEM / CRT / KEY (Base64 ASCII):
Plaintext Base64 encoded files starting with -----BEGIN CERTIFICATE-----, standard for Nginx, Apache, Cloudflare, AWS ELB, and Node.js.

② PFX / P12 (PKCS#12 Binary Bundle):
Encrypted binary container bundling certificate, private key, and CA chain, required by Windows IIS, Azure, and Tomcat.

③ DER / CER (ASN.1 Binary):
Raw binary encoded certificates, common in Java platforms (Keystore) and legacy enterprise systems.`,
      },
      {
        q: 'Why is a password required when converting PFX / P12 to PEM?',
        a: 'PFX / P12 files use PKCS#12 encryption (3DES/AES) to secure sensitive private keys. The password entered during export is required to decrypt the container and extract the PEM certificate and key locally inside your browser.',
      },
      {
        q: 'How can I verify if my SSL Private Key matches my Certificate?',
        a: 'Certificates and private keys share the same public key modulus. Our tool automatically calculates SHA-256 modulus hashes for both. If the hashes match 100%, the private key belongs to that certificate, preventing web server startup failures.',
      },
      {
        q: 'Can I convert expired SSL certificates? How does expiration detection work?',
        a: 'Yes, expired certificates can still be converted for backup or archiving. The tool automatically analyzes the "Not After" date and displays warning alerts if the certificate is expired or expiring within 30 days.',
      },
    ],
  },
};
