/**
 * 密碼產生器 頁面中英文案（從 PasswordGeneratorClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    title: '線上安全密碼產生器',
    subtitle: 'CSPRNG Password Generator',
    description:
      '專業免費的線上安全密碼生成器，採用 CSPRNG 密碼學隨機數引擎，支援自訂長度、大小寫字母、數字及通用與相容性特殊符號，並可即時評估密碼強度與熵值。',
    langToggleLabel: 'English',
    langToggleUrl: '/password/en/',
    lengthLabel: '密碼長度 (Length)',
    upperLabel: '大寫字母 (A-Z)',
    lowerLabel: '小寫字母 (a-z)',
    numberLabel: '數字 (0-9)',
    commonSymbolLabel: '通用特殊符號 (!@#$%^&*_-+=)',
    otherSymbolLabel: '其他特殊符號 (()[]{}.,:;?) (需注意相容性)',
    excludeLabel: '排除相似與混淆字元 (如 1, l, I, 0, O, o 等)',
    strictLabel: '強制每種字元集至少出現一個 (分佈更均勻)',
    generateBtn: '重新生成安全密碼',
    strengthLabel: '密碼安全強度：',
    copyBtn: '複製',
    historyTitle: '歷史生成記錄 (最近 5 組)',
    placeholderSelectCharset: '請至少選擇一種字元集！',
    placeholderNoChars: '字元池過濾後無可用字元！',
    placeholderInitial: '點擊生成按鈕獲取密碼',
    strengthWeak: '弱 (Weak) - 易受爆破',
    strengthMedium: '中等 (Medium) - 尚可安全',
    strengthStrong: '強 (Strong) - 建議採用',
    strengthSecure: '安全 (Secure) - 密碼學防護',
    toastCopied: '已複製密碼到剪貼簿',
    toastCopyHistory: '已複製歷史密碼',
    toastCopyFailed: '複製失敗，請手動複製',
    toastInvalidPassword: '無效的密碼內容',
    faqTitle: '常見問題與資安指南 (FAQ)',
    faqSubtitle: '深入瞭解 CSPRNG 密碼學隨機數、資訊熵強度計算與密碼安全防禦原則',
    faqItems: [
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
    ],
  },
  en: {
    title: 'Secure Password Generator',
    subtitle: 'CSPRNG Password Generator',
    description:
      'Cryptographically secure online password generator using CSPRNG engine. Customize length, uppercase/lowercase, digits, common & compatible symbols with live password strength analysis.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/password/',
    lengthLabel: 'Password Length',
    upperLabel: 'Uppercase (A-Z)',
    lowerLabel: 'Lowercase (a-z)',
    numberLabel: 'Digits (0-9)',
    commonSymbolLabel: 'Common Symbols (!@#$%^&*_-+=)',
    otherSymbolLabel: 'Other Symbols (()[]{}.,:;?) (Compatibility)',
    excludeLabel: 'Exclude ambiguous chars (e.g. 1, l, I, 0, O, o)',
    strictLabel: 'Include at least one from each selected set',
    generateBtn: 'Generate Secure Password',
    strengthLabel: 'Password Strength:',
    copyBtn: 'Copy',
    historyTitle: 'History (Recent 5)',
    placeholderSelectCharset: 'Please select at least one character set!',
    placeholderNoChars: 'No available characters after filtering!',
    placeholderInitial: 'Click generate to get password',
    strengthWeak: 'Weak - Vulnerable',
    strengthMedium: 'Medium - Fairly Safe',
    strengthStrong: 'Strong - Recommended',
    strengthSecure: 'Secure - Cryptographic',
    toastCopied: 'Copied password to clipboard',
    toastCopyHistory: 'Copied historical password',
    toastCopyFailed: 'Copy failed, please copy manually',
    toastInvalidPassword: 'Invalid password content',
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Learn about CSPRNG cryptographic randomness, entropy math, and credential defense best practices',
    faqItems: [
      {
        q: 'What is CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)? How is it different from standard random numbers?',
        a: `CSPRNG (Cryptographically Secure Pseudo-Random Number Generator) is a randomness generator engine designed to meet strict cryptographic security standards.

Standard random functions like JavaScript's Math.random() produce deterministic pseudo-random numbers with predictable internal states, making them vulnerable to cryptographic attacks and reverse engineering.

This tool strictly uses the browser's native window.crypto.getRandomValues() API, powered by operating system entropy sources (such as hardware noise and system interrupts) to guarantee true unpredictability and uniform distribution.`,
      },
      {
        q: 'Is it safe to generate passwords on a website? Are generated passwords uploaded or sent to any server?',
        a: `100% Safe! This tool operates entirely on the client side inside your web browser memory.

All password generation, entropy calculation, and local history management are executed locally without making any HTTP network requests to any backend server.

You can verify this by turning off your internet connection or turning on Airplane mode—the password generator will continue to function seamlessly. Furthermore, passwords are never stored in localStorage or external databases; refreshing the page clears all session memory.`,
      },
      {
        q: 'How is password strength and entropy calculated? How long should a password be for optimal security?',
        a: `Password security is quantified by cryptographic Entropy (measured in bits), calculated via the formula Entropy = Length * log2(Character_Pool_Size).

Entropy represents the mathematical computational difficulty required for a brute-force attack:

① 8-digit numbers only (~26.5 bits): Cracked within milliseconds.
② 12-character mixed letters and digits (~71.4 bits): Takes years of computing power.
③ 16-character mixed with symbols (>100 bits): Requires billions of years for modern supercomputers to crack.

We recommend setting password length to at least 16 characters with a full mix of uppercase, lowercase, numbers, and symbols.`,
      },
      {
        q: 'What do the "Exclude ambiguous characters" and "Strict mode" settings do?',
        a: `These options enhance both practical usability and cryptographic security:

① Exclude ambiguous characters: Automatically filters out visually confusing character pairs (such as uppercase 'I' vs lowercase 'l', number '0' vs letter 'O', number '1' vs letter 'l'). This prevents user entry errors when passwords are read visually or typed manually on mobile devices.

② Strict mode (Include from each set): Ensures that at least one character is randomly drawn from every selected character set (uppercase, lowercase, digits, symbols), preventing statistical bias during short length sampling.`,
      },
      {
        q: 'Why do some systems reject passwords with special symbols? How can I fix this?',
        a: `Certain legacy web applications, database tools, or remote VPN services enforce restrictive input validation or escape rules for special characters.

To solve this compatibility issue, our tool categorizes symbols into two option sets:
① Common Symbols (!@#$%^&*_-+=): Widely accepted across modern identity providers and standard web forms.
② Other Symbols (()[]{}.,:;?): Contains brackets and punctuation marks which legacy systems might disallow.

If a service rejects your generated password, try unchecking "Other Symbols" while keeping "Common Symbols" enabled.`,
      },
      {
        q: 'How to create memorably secure passwords using the Passphrase principle?',
        a: `For master passwords or PINs that you need to memorize without relying on a password manager, the "Passphrase" technique is highly recommended:

Combine 4 to 5 randomly chosen unrelated words separated by hyphens or symbols (e.g., correct-horse-battery-staple-2026).

A Passphrase exceeding 20 characters offers extremely high entropy against brute-force attacks while remaining easy for human memory to retain via visual association.`,
      },
      {
        q: 'Security Best Practices & Usage Disclaimer',
        a: `[Security Best Practices & Usage Disclaimer]

① We recommend saving generated passwords using a reputable end-to-end encrypted password manager (such as Bitwarden, 1Password, or KeePass).

② Always enable Two-Factor Authentication (2FA / MFA) on critical platforms like primary emails, financial banking accounts, and social media.

③ This tool is provided free of charge for password generation and entropy estimation. Users are solely responsible for managing and safeguarding their generated credentials. The author and website accept no liability for credential loss or security incidents on third-party services.`,
      },
    ],
  },
};
