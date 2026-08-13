'use client';

import { useState, useEffect, useRef, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './qr-generator.module.css';

interface QrGeneratorClientProps {
  lang?: 'zh-TW' | 'en';
}

type ContentType = 'text' | 'wifi' | 'vcard' | 'event' | 'email' | 'sms' | 'tel';

const TRANSLATIONS = {
  'zh-TW': {
    title: 'QR Code 產生器',
    subtitle: 'DESIGNER QR CODE GENERATOR',
    description:
      '專業免費的線上藝術 QR Code 產生器！支援數位名片 (vCard)、行事曆 (iCal)、快捷訊息與自訂點體樣式、雙色漸層、中央 Logo 拖曳內嵌及向量下載。',
    copyShareLink: '複製分享設計連結',
    shareLinkCopied: '✓ 已複製設計網址！',
    shareLinkPrompt: '複製以下網址以進行分享：',
    contentType: '內容類型',
    textOrUrl: '文字 / 網址',
    wifiNetwork: 'WiFi 網路',
    vcardContact: 'vCard 數位名片',
    calendarEvent: '行事曆行程',
    emailMsg: 'E-mail 郵件',
    smsMsg: 'SMS 簡訊',
    telCall: '電話撥號',
    qrContentLabel: 'QR Code 內容',
    textPlaceholder: '請輸入網址或文字 (e.g. https://...)',
    wifiSsid: 'WiFi SSID (網路名稱)',
    wifiSsidPlaceholder: '例如：MyHomeWiFi',
    wifiPass: 'WiFi 密碼',
    wifiPassPlaceholder: '請輸入 WiFi 密碼',
    securityType: '安全性類型',
    wpaOption: 'WPA / WPA2 Personal',
    wpa3Option: 'WPA3 Personal',
    wpaEapOption: 'WPA / WPA2 Enterprise (EAP)',
    wepOption: 'WEP (舊式加密)',
    nopassOption: '無密碼 (nopass)',
    nopass: '無密碼 (nopass)',
    hiddenSsid: '隱藏 SSID 網路',

    // vCard
    vCardVersion: 'vCard 版本規格',
    vCardVer3: 'vCard 3.0 (iOS / Android 原生相機相容推薦)',
    vCardVer4: 'vCard 4.0 (現代 RFC 6350 規格)',
    vCardLastName: '姓氏',
    vCardLastNamePlaceholder: '例如：王',
    vCardFirstName: '名字',
    vCardFirstNamePlaceholder: '例如：小明',
    vCardNickname: '暱稱',
    vCardNicknamePlaceholder: '例如：阿傑 / Alex',
    vCardOrg: '公司名稱',
    vCardOrgPlaceholder: '例如：科技股份有限公司',
    vCardDept: '部門名稱',
    vCardDeptPlaceholder: '例如：研發部 / 行銷處',
    vCardTitle: '職稱',
    vCardTitlePlaceholder: '例如：資深軟體工程師',
    vCardPhone: '手機號碼',
    vCardPhonePlaceholder: '例如：0912345678',
    vCardWorkPhone: '公司電話 / 座機 (可填分機)',
    vCardWorkPhonePlaceholder: '例如：02-12345678,123 (若要填入分機請用 ",")',
    vCardEmail: 'E-mail 信箱',
    vCardEmailPlaceholder: '例如：service@example.com',
    vCardUrl: '個人 / 公司網站',
    vCardUrlPlaceholder: '例如：https://example.com',
    vCardAddress: '通訊地址',
    vCardAddressPlaceholder: '例如：台北市信義區信義路五段7號',
    vCardBday: '生日 (Birthday)',
    vCardBdayPlaceholder: '例如：1989-06-14',

    // iCalendar Event
    eventSummary: '行程標題',
    eventSummaryPlaceholder: '例如：2026 產品發布會',
    eventStart: '開始時間',
    eventEnd: '結束時間',
    eventTimezone: '活動時區 (Time Zone)',
    timezoneLocal: '設備預設時區 (Local Time)',
    eventLocation: '活動地點',
    eventLocationPlaceholder: '例如：台北國際會議中心',
    eventDescription: '行程描述 / 備註',
    eventDescriptionPlaceholder: '例如：請準時入場，憑 QR Code 兌換贈品',

    // Email / SMS / Tel
    emailTo: '收件者 E-mail',
    emailToPlaceholder: '例如：service@example.com',
    emailSubject: '信件主旨',
    emailSubjectPlaceholder: '例如：客服諮詢',
    emailBody: '預設內文',
    emailBodyPlaceholder: '例如：我想詢問...',
    smsPhone: '簡訊收件號碼',
    smsPhonePlaceholder: '例如：+886912345678',
    smsBody: '簡訊預設內文',
    smsBodyPlaceholder: '例如：註冊會員',
    telPhone: '撥打電話號碼',
    telPhonePlaceholder: '例如：+886212345678',

    dotsStyle: '碼體樣式',
    square: '方形',
    dots: '圓點',
    rounded: '圓角',
    classy: '葉狀',
    classyRounded: '斜葉',
    extraRounded: '極圓',
    cornersSquareStyle: '定位點外框形狀',
    shieldRounded: '盾牌圓角',
    ring: '圓環',
    cornersDotStyle: '定位點內核形狀',
    bgSettings: '背景設定',
    transparentBg: '背景透明',
    errorCorrection: '容錯等級 (Error Correction)',
    errorCorrectionL: 'L (7% 容錯)',
    errorCorrectionM: 'M (15% 容錯)',
    errorCorrectionQ: 'Q (25% 容錯)',
    errorCorrectionH: 'H (30% 容錯 - 置中Logo推薦)',
    enableGradient: '啟用雙色漸層碼體',
    gradientType: '漸層類型',
    linearGradient: '線性漸層 (Linear)',
    radialGradient: '放射漸層 (Radial)',
    colorPair: '配色設定 (Color 1 / Color 2)',
    gradientAngle: '漸層旋轉角度',
    singleColor: '碼體單色設定',
    centerLogo: '置中 Logo / 頭像',
    dropzoneText: '將圖片拖曳至此處，或點選此處上傳',
    removeLogo: '移除 Logo',
    logoSize: 'Logo 尺寸大小',
    autoSafetyTitle: '自動安全防禦啟動：',
    autoSafetyDesc: '已偵測到中央 Logo，程式已自動將 QR Code 容錯率調升至最高等級 H (30%)，並暫時停用手動設定以防止因遮擋失效。',
    downloadFormat: '下載格式',
    downloadSize: '下載尺寸',
    printSize: '1200 (印刷)',
    hdSize: '2000 (高清)',
    downloadBtn: '下載設計好的 QR Code',
    downloadToast: '已觸發 QR Code 下載',
    downloadVcfBtn: '下載 .vcf 數位名片檔',
    copyVcfBtn: '複製 vCard 原始碼',
    vcfPreviewTitle: 'vCard 數位名片預覽與下載',
    downloadIcsBtn: '下載 .ics 行事曆檔案',
    copyIcsBtn: '複製 iCalendar 原始碼',
    icsPreviewTitle: 'iCalendar 行事曆行程預覽與下載',
    vcfDownloadedToast: '已觸發 .vcf 數位名片檔下載',
    icsDownloadedToast: '已觸發 .ics 行事曆檔下載',
    rawCopiedToast: '已將原始文字內容複製至剪貼簿',
    langSwitchLabel: 'English',
    langSwitchHref: '/qr-generator/en/',

    faqTitle: '常問問題與專業指南 (FAQ)',
    faqSubtitle: '了解藝術 QR Code 製作細節、容錯機制與圖檔格式建議',
    faqItems: [
      {
        q: '本工具產生的 QR Code 有安全與隱私洩漏的疑慮嗎？資料會不會被儲存在伺服器？',
        a: '完全不會！本工具採用 100% 純前端技術 (Client-Side Browser-Based) 運作，所有的圖片生成、資料編碼與名片運算都在您自己的瀏覽器內部完成。您的輸入內容、聯絡資訊或 Logo 完全不會上傳至任何後端伺服器，絕無隱私洩漏或第三方追蹤疑慮。',
      },
      {
        q: '藝術 QR Code 插入中央 Logo 後，手機掃描會不會失敗？',
        a: '不會。QR Code 具備「容錯機制 (Error Correction Level)」。當您拖曳上傳 Logo 時，本工具會自動將容錯等級調高至 H 級 (Highest, 30%)，即使中央高達 30% 面積被 Logo 遮擋，周圍的關鍵數據與校正點仍能被手機相機 100% 精準解碼。',
      },
      {
        q: '為什麼建議選用向量 SVG 格式輸出？與 PNG / WEBP 有何差別？',
        a: 'SVG 是無損向量圖檔（Vector Graphic），無論放大至大樓看板或印刷名片皆不會失真點陣化，設計師亦可在 Illustrator / Figma 中繼續微調，且能作為 Inline SVG 直接嵌入網頁，無須額外 HTTP 請求，極有利於 Core Web Vitals 與 SEO 效能。PNG 與 WEBP 則是點陣圖檔，WEBP 具備高壓縮率與高清品質，是網頁圖片展示 (Web Image SEO) 的最佳選擇；PNG 則適合用於社群分享與簡訊傳送。',
      },
      {
        q: '產生的 QR Code 有使用期限或掃描次數限制嗎？收費方式如何？',
        a: '完全免費且永久有效！本工具產生的內容為「靜態原生碼 (Static QR Code)」，資料直接寫入二維碼矩陣中，不經過任何中繼轉址伺服器。沒有掃描次數上限、沒有使用期限，更無廣告干擾，只要您的原始連結沒有失效，二維碼就永久有效。',
      },
      {
        q: '如何產生掃描後能直接加入手機通訊錄的 vCard 名片 QR Code？',
        a: '只要切換頂部標籤至「聯絡名片 (vCard)」，輸入姓名、電話、Email 與公司職稱即可生成。手機掃描後會跳出「新增至聯絡人」提示。因部分 iOS / Android 系統基於安全與隱私防護，原生相機直接掃描時可能僅讀取姓名與電話，若需確保地址、備註或公司分機 100% 完整填入，建議使用本工具提供的「下載 .vcf 數位名片檔」功能，傳送 .vcf 檔開啟即可無痛儲存至通訊錄！',
      },
      {
        q: '這個 Designer QR Code 產生器適合哪些情境與使用者？',
        a: '非常適合四大情境：① 行銷與設計師：製作活動海報、展場 DM、帶有品牌漸層色的專屬二維碼並導出向量 SVG；② 商家與餐廳老闆：引導 Google 評論、FB 粉專按讚、菜單連結或 WiFi 快速連線；③ 活動主辦與 HR：報到連結、講義下載、行事曆行程 (.ics) 與展場離線應用；④ 一般使用者：交換 vCard 數位名片與分享家用 WiFi。',
      },
    ],
  },
  en: {
    title: 'Designer QR Code Generator',
    subtitle: 'DESIGNER QR CODE GENERATOR',
    description:
      'Free professional online Designer QR Code Generator! Supports vCard, iCalendar events, quick triggers, dot styles, dual gradients, logo overlay, and vector SVG download.',
    copyShareLink: 'Copy Shareable Design Link',
    shareLinkCopied: '✓ Design link copied!',
    shareLinkPrompt: 'Copy the following URL to share:',
    contentType: 'Content Type',
    textOrUrl: 'Text / URL',
    wifiNetwork: 'WiFi Network',
    vcardContact: 'vCard Contact',
    calendarEvent: 'Calendar Event',
    emailMsg: 'E-mail',
    smsMsg: 'SMS Message',
    telCall: 'Phone Call',
    qrContentLabel: 'QR Code Content',
    textPlaceholder: 'Enter URL or text (e.g. https://...)',
    wifiSsid: 'WiFi SSID (Network Name)',
    wifiSsidPlaceholder: 'e.g. MyHomeWiFi',
    wifiPass: 'WiFi Password',
    wifiPassPlaceholder: 'Enter WiFi password',
    securityType: 'Security Type',
    wpaOption: 'WPA / WPA2 Personal',
    wpa3Option: 'WPA3 Personal',
    wpaEapOption: 'WPA / WPA2 Enterprise (EAP)',
    wepOption: 'WEP',
    nopassOption: 'No Password (nopass)',
    nopass: 'No Password (nopass)',
    hiddenSsid: 'Hidden Network SSID',

    // vCard
    vCardVersion: 'vCard Spec Version',
    vCardVer3: 'vCard 3.0 (Recommended for Camera Compatibility)',
    vCardVer4: 'vCard 4.0 (Modern RFC 6350 Spec)',
    vCardLastName: 'Last Name',
    vCardLastNamePlaceholder: 'e.g. Smith',
    vCardFirstName: 'First Name',
    vCardFirstNamePlaceholder: 'e.g. John',
    vCardNickname: 'Nickname',
    vCardNicknamePlaceholder: 'e.g. Alex',
    vCardOrg: 'Company Name',
    vCardOrgPlaceholder: 'e.g. Tech Corp',
    vCardDept: 'Department',
    vCardDeptPlaceholder: 'e.g. R&D Dept',
    vCardTitle: 'Job Title',
    vCardTitlePlaceholder: 'e.g. Senior Developer',
    vCardPhone: 'Mobile Phone',
    vCardPhonePlaceholder: 'e.g. +886912345678',
    vCardWorkPhone: 'Work Phone (Ext. Supported)',
    vCardWorkPhonePlaceholder: 'e.g. +886212345678,123 (Use "," for extension)',
    vCardEmail: 'Email Address',
    vCardEmailPlaceholder: 'e.g. service@example.com',
    vCardUrl: 'Website URL',
    vCardUrlPlaceholder: 'e.g. https://example.com',
    vCardAddress: 'Address',
    vCardAddressPlaceholder: 'e.g. 123 Main St, City',
    vCardBday: 'Birthday',
    vCardBdayPlaceholder: 'e.g. 1989-06-14',

    // iCalendar Event
    eventSummary: 'Event Title',
    eventSummaryPlaceholder: 'e.g. Annual Conference 2026',
    eventStart: 'Start Time',
    eventEnd: 'End Time',
    eventTimezone: 'Time Zone',
    timezoneLocal: 'Local Device Time',
    eventLocation: 'Location',
    eventLocationPlaceholder: 'e.g. Convention Center',
    eventDescription: 'Description / Notes',
    eventDescriptionPlaceholder: 'e.g. Bring your ticket',

    // Email / SMS / Tel
    emailTo: 'Recipient Email',
    emailToPlaceholder: 'e.g. service@example.com',
    emailSubject: 'Subject',
    emailSubjectPlaceholder: 'e.g. Customer Inquiry',
    emailBody: 'Body Content',
    emailBodyPlaceholder: 'e.g. I would like to ask...',
    smsPhone: 'Recipient Phone',
    smsPhonePlaceholder: 'e.g. +886912345678',
    smsBody: 'Message Body',
    smsBodyPlaceholder: 'e.g. SUBSCRIBE',
    telPhone: 'Phone Number to Call',
    telPhonePlaceholder: 'e.g. +886212345678',

    dotsStyle: 'Dot Style',
    square: 'Square',
    dots: 'Dots',
    rounded: 'Rounded',
    classy: 'Classy',
    classyRounded: 'Classy Rounded',
    extraRounded: 'Extra Rounded',
    cornersSquareStyle: 'Corner Frame Shape',
    shieldRounded: 'Shield Rounded',
    ring: 'Ring',
    cornersDotStyle: 'Corner Dot Shape',
    bgSettings: 'Background Settings',
    transparentBg: 'Transparent Background',
    errorCorrection: 'Error Correction Level',
    errorCorrectionL: 'L (7% Error Correction)',
    errorCorrectionM: 'M (15% Error Correction)',
    errorCorrectionQ: 'Q (25% Error Correction)',
    errorCorrectionH: 'H (30% High Error Correction)',
    enableGradient: 'Enable Dual Color Gradient',
    gradientType: 'Gradient Type',
    linearGradient: 'Linear Gradient',
    radialGradient: 'Radial Gradient',
    colorPair: 'Color Scheme (Color 1 / Color 2)',
    gradientAngle: 'Gradient Angle',
    singleColor: 'Single Color Settings',
    centerLogo: 'Center Logo / Avatar',
    dropzoneText: 'Drag & drop logo image here, or click to upload',
    removeLogo: 'Remove Logo',
    logoSize: 'Logo Size Ratio',
    autoSafetyTitle: 'Auto Safety Defense Active:',
    autoSafetyDesc:
      'Center logo detected. Error correction level is automatically set to High H (30%) to prevent scanning failure due to logo overlay.',
    downloadFormat: 'Format',
    downloadSize: 'Size',
    printSize: '1200 (Print)',
    hdSize: '2000 (HD)',
    downloadBtn: 'Download Designed QR Code',
    downloadToast: 'Triggered QR Code download',
    downloadVcfBtn: 'Download .vcf Contact File',
    copyVcfBtn: 'Copy Raw vCard Code',
    vcfPreviewTitle: 'vCard Contact Preview & Download',
    downloadIcsBtn: 'Download .ics Calendar File',
    copyIcsBtn: 'Copy Raw iCalendar Code',
    icsPreviewTitle: 'iCalendar Event Preview & Download',
    vcfDownloadedToast: 'Triggered .vcf Contact download',
    icsDownloadedToast: 'Triggered .ics Calendar download',
    rawCopiedToast: 'Raw content copied to clipboard',
    langSwitchLabel: '繁體中文',
    langSwitchHref: '/qr-generator/',

    faqTitle: 'Frequently Asked Questions & Guide',
    faqSubtitle: 'Learn more about error correction levels, logo safety, and vector export formats.',
    faqItems: [
      {
        q: 'Is my data safe with this QR Code generator? Are my inputs saved on any server?',
        a: 'Completely safe! This tool runs 100% on the client-side (Browser-Based). All encoding, image generation, and card processing occur entirely within your browser. Your input text, contact details, and uploaded logos are never sent or stored on any server, ensuring total privacy and zero tracking.',
      },
      {
        q: 'Will embedding a center Logo cause QR Code scanning to fail?',
        a: 'No. QR Codes feature built-in Error Correction. When you upload a Logo, this tool automatically boosts error correction to Level H (30%), allowing smartphones to scan and decode the QR code reliably even with up to 30% center coverage.',
      },
      {
        q: 'Why is vector SVG format recommended over PNG or WEBP?',
        a: 'SVG is a resolution-independent vector format that scales endlessly without pixelation, ideal for large print, billboards, and design software (Illustrator/Figma). Inline SVG also reduces HTTP requests, boosting website Core Web Vitals and SEO performance. PNG and WEBP are raster formats; WEBP offers superior compression for web image SEO, while PNG provides lossless transparency for social sharing.',
      },
      {
        q: 'Do generated QR Codes expire or have scan limits? Is it really free?',
        a: '100% free and permanent! All QR Codes generated are static codes where data is encoded directly into the matrix without redirect servers. There are no scan limits, no expiration dates, and zero ads. As long as your destination link remains valid, the QR code will work forever.',
      },
      {
        q: 'How do I create a vCard QR Code that saves contact info automatically?',
        a: 'Select the "Contact vCard" tab and enter your details to generate a standard vCard QR Code. Smartphone cameras will prompt "Add to Contacts" when scanned. Note: Due to OS security policies on iOS/Android, camera scanning alone may omit extended fields like addresses or notes. We recommend using our "Download .vcf Contact File" button to send a .vcf file directly for 100% full-field contact import.',
      },
      {
        q: 'Who is this Designer QR Code generator best suited for?',
        a: 'It is ideal for: ① Marketers & Designers: Creating posters, branded gradient QR codes, and exporting vector SVGs; ② Business & Restaurant Owners: Guiding Google reviews, social pages, digital menus, or instant WiFi connection; ③ Event Organizers & HR: Registration links, PDF downloads, calendar events (.ics), and offline PWA usage; ④ General Users: Sharing vCard contact cards or home WiFi passwords effortlessly.',
      },
    ],
  },
};

export default function QrGeneratorClient({ lang = 'zh-TW' }: QrGeneratorClientProps) {
  const t = TRANSLATIONS[lang];

  // --- 狀態宣告 ---
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [QRCodeStyling, setQRCodeStyling] = useState<any>(null);

  const [contentType, setContentType] = useState<ContentType>('text');
  const [text, setText] = useState<string>('https://tools.cjkuo.net');

  // WiFi 連線設定
  const [wifiSsid, setWifiSsid] = useState<string>('');
  const [wifiPass, setWifiPass] = useState<string>('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WPA3' | 'WPA-EAP' | 'WEP' | 'nopass'>('WPA');
  const [wifiHidden, setWifiHidden] = useState<boolean>(false);

  // vCard 數位名片設定
  const [vCardVersion, setVCardVersion] = useState<'4.0' | '3.0'>('3.0');
  const [vCardLastName, setVCardLastName] = useState<string>('');
  const [vCardFirstName, setVCardFirstName] = useState<string>('');
  const [vCardNickname, setVCardNickname] = useState<string>('');
  const [vCardOrg, setVCardOrg] = useState<string>('');
  const [vCardDept, setVCardDept] = useState<string>('');
  const [vCardTitle, setVCardTitle] = useState<string>('');
  const [vCardPhone, setVCardPhone] = useState<string>(''); // 手機號碼 (CELL)
  const [vCardWorkPhone, setVCardWorkPhone] = useState<string>(''); // 公司電話 (WORK)
  const [vCardEmail, setVCardEmail] = useState<string>('');
  const [vCardUrl, setVCardUrl] = useState<string>('');
  const [vCardAddress, setVCardAddress] = useState<string>('');
  const [vCardBday, setVCardBday] = useState<string>('');

  // iCalendar 行事曆設定
  const [eventSummary, setEventSummary] = useState<string>('');
  const [eventStart, setEventStart] = useState<string>('');
  const [eventEnd, setEventEnd] = useState<string>('');
  const [eventTimezone, setEventTimezone] = useState<string>('Asia/Taipei');
  const [eventLocation, setEventLocation] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');

  // Email 郵件
  const [emailTo, setEmailTo] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');

  // SMS 簡訊
  const [smsPhone, setSmsPhone] = useState<string>('');
  const [smsBody, setSmsBody] = useState<string>('');

  // 電話撥號
  const [telPhone, setTelPhone] = useState<string>('');

  // 碼體樣式
  const [dotsType, setDotsType] = useState<string>('square');
  const [cornersSquare, setCornersSquare] = useState<string>('extra-rounded');
  const [cornersDot, setCornersDot] = useState<string>('dot');

  // 顏色設定
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [bgTransparent, setBgTransparent] = useState<boolean>(false);
  const [useGradient, setUseGradient] = useState<boolean>(true);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [color1, setColor1] = useState<string>('#00ff66');
  const [color2, setColor2] = useState<string>('#0077ff');
  const [gradientRotation, setGradientRotation] = useState<number>(0);
  const [singleColor, setSingleColor] = useState<string>('#000000');

  // 容錯率與置中 Logo
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('Q');
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [logoName, setLogoName] = useState<string>('');
  const [logoSize, setLogoSize] = useState<number>(20);

  // 下載設定與回饋
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'svg' | 'jpeg' | 'webp'>('png');
  const [downloadSize, setDownloadSize] = useState<number>(600);
  const [toast, setToast] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // --- 唯一 HTML ID 宣告 ---
  const textInputId = useId();
  const wifiSsidId = useId();
  const wifiPassId = useId();
  const wifiEncryptionId = useId();

  const vCardVersionId = useId();
  const vCardLastNameId = useId();
  const vCardFirstNameId = useId();
  const vCardNicknameId = useId();
  const vCardOrgId = useId();
  const vCardDeptId = useId();
  const vCardTitleId = useId();
  const vCardPhoneId = useId();
  const vCardWorkPhoneId = useId();
  const vCardEmailId = useId();
  const vCardUrlId = useId();
  const vCardAddressId = useId();
  const vCardBdayId = useId();

  const eventSummaryId = useId();
  const eventStartId = useId();
  const eventEndId = useId();
  const eventTimezoneId = useId();
  const eventLocationId = useId();
  const eventDescriptionId = useId();

  const emailToId = useId();
  const emailSubjectId = useId();
  const emailBodyId = useId();

  const smsPhoneId = useId();
  const smsBodyId = useId();

  const telPhoneId = useId();

  const bgColorId = useId();
  const errorCorrectionId = useId();
  const gradientTypeId = useId();
  const logoSizeId = useId();
  const downloadFormatId = useId();
  const downloadSizeId = useId();

  // --- Refs ---
  const qrCodeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 輔助函數 ---
  const parseHexColor = (val: string, fallback: string): string => {
    const clean = val.replace('#', '');
    if (/^[0-9A-Fa-f]{3,6}$/.test(clean)) {
      return '#' + clean;
    }
    return fallback;
  };

  const escapeWifiString = (val: string): string => {
    if (!val) return '';
    return val
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/:/g, '\\:')
      .replace(/,/g, '\\,');
  };

  const toUtf8ByteString = (str: string): string => {
    try {
      return unescape(encodeURIComponent(str));
    } catch (e) {
      return str;
    }
  };

  const formatICalDate = (dtStr: string, tz: string): string => {
    if (!dtStr) return '';
    const clean = dtStr.replace(/[-:]/g, '');
    if (clean.includes('T')) {
      const [d, t] = clean.split('T');
      const timePadded = (t + '0000').slice(0, 6);
      const formatted = `${d}T${timePadded}`;
      if (tz === 'UTC') {
        return `${formatted}Z`;
      }
      return formatted;
    }
    return clean;
  };

  const encodeQuotedPrintable = (str: string): string => {
    if (!str) return '';
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    let encoded = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (
        (b >= 48 && b <= 57) ||
        (b >= 65 && b <= 90) ||
        (b >= 97 && b <= 122) ||
        b === 32 ||
        b === 45 ||
        b === 95
      ) {
        encoded += String.fromCharCode(b);
      } else {
        const hex = b.toString(16).toUpperCase();
        encoded += '=' + (hex.length === 1 ? '0' + hex : hex);
      }
    }
    return encoded;
  };

  const getComputedData = (): string => {
    if (contentType === 'text') {
      return text.trim() || 'https://tools.cjkuo.net';
    } else if (contentType === 'wifi') {
      const ssid = escapeWifiString(wifiSsid.trim());
      const pass = escapeWifiString(wifiPass.trim());
      const enc = wifiEncryption;
      const isHidden = wifiHidden;

      if (!ssid) {
        return 'WIFI:S:WiFi_SSID;;';
      } else {
        let dataVal = `WIFI:S:${ssid};`;
        if (enc !== 'nopass') {
          dataVal += `T:${enc};P:${pass};`;
        } else {
          dataVal += `T:nopass;;`;
        }
        if (isHidden) {
          dataVal += `H:true;`;
        }
        dataVal += ';';
        return dataVal;
      }
    } else if (contentType === 'vcard') {
      const ln = vCardLastName.trim();
      const fn = vCardFirstName.trim();
      const nick = vCardNickname.trim();
      const org = vCardOrg.trim();
      const dept = vCardDept.trim();
      const title = vCardTitle.trim();
      const address = vCardAddress.trim();
      const bday = vCardBday.trim();
      const cellPhone = vCardPhone.trim();
      const workPhone = vCardWorkPhone.trim();
      const email = vCardEmail.trim();
      const url = vCardUrl.trim();

      const hasChinese = /[\u4e00-\u9fa5]/.test(ln + fn + nick + org + dept + title + address);

      const fullName = hasChinese
        ? `${ln}${fn}`.trim() || fn || ln || 'Contact'
        : `${fn} ${ln}`.trim() || fn || ln || 'Contact';

      const ver = vCardVersion;

      const lines: string[] = [
        'BEGIN:VCARD',
        `VERSION:${ver}`,
        `FN:${fullName}`,
        `N:${ln};${fn};;;`,
        `SORT-STRING:${fullName}`,
      ];

      if (hasChinese) {
        if (ln) lines.push(`X-PHONETIC-LAST-NAME:${ln}`);
        if (fn) lines.push(`X-PHONETIC-FIRST-NAME:${fn}`);
      }

      if (nick) {
        lines.push(`NICKNAME:${nick}`);
      }

      if (org && dept) {
        lines.push(`ORG:${org} / ${dept}`);
      } else if (org) {
        lines.push(`ORG:${org}`);
      } else if (dept) {
        lines.push(`ORG:${dept}`);
      }

      if (title) {
        lines.push(`TITLE:${title}`);
      }

      if (cellPhone) {
        lines.push(ver === '4.0' ? `TEL;TYPE=cell:${cellPhone}` : `TEL;TYPE=CELL:${cellPhone}`);
      }
      if (workPhone) {
        lines.push(ver === '4.0' ? `TEL;TYPE="work,voice":${workPhone}` : `TEL;TYPE=WORK,VOICE:${workPhone}`);
      }

      if (email) {
        lines.push(ver === '4.0' ? `EMAIL;TYPE=work:${email}` : `EMAIL;TYPE=INTERNET,WORK:${email}`);
      }
      if (url) lines.push(`URL:${url}`);
      if (address) {
        lines.push(ver === '4.0' ? `ADR;TYPE=work:;;${address};;;;` : `ADR;TYPE=WORK:;;${address};;;;`);
      }
      if (bday) {
        lines.push(`BDAY:${bday}`);
      }

      lines.push('END:VCARD');

      return lines.join('\r\n');
    } else if (contentType === 'event') {
      const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0'];
      if (eventTimezone && eventTimezone !== 'LOCAL' && eventTimezone !== 'UTC') {
        lines.push(`X-WR-TIMEZONE:${eventTimezone}`);
      }
      lines.push('BEGIN:VEVENT');
      lines.push(`SUMMARY:${eventSummary.trim() || 'Event'}`);

      if (eventStart) {
        if (eventTimezone && eventTimezone !== 'LOCAL' && eventTimezone !== 'UTC') {
          lines.push(`DTSTART;TZID=${eventTimezone}:${formatICalDate(eventStart, eventTimezone)}`);
        } else {
          lines.push(`DTSTART:${formatICalDate(eventStart, eventTimezone)}`);
        }
      }

      if (eventEnd) {
        if (eventTimezone && eventTimezone !== 'LOCAL' && eventTimezone !== 'UTC') {
          lines.push(`DTEND;TZID=${eventTimezone}:${formatICalDate(eventEnd, eventTimezone)}`);
        } else {
          lines.push(`DTEND:${formatICalDate(eventEnd, eventTimezone)}`);
        }
      }

      if (eventLocation.trim()) lines.push(`LOCATION:${eventLocation.trim()}`);
      if (eventDescription.trim()) lines.push(`DESCRIPTION:${eventDescription.trim()}`);

      lines.push('END:VEVENT');
      lines.push('END:VCALENDAR');

      return lines.join('\r\n');
    } else if (contentType === 'email') {
      const to = emailTo.trim();
      const sub = emailSubject.trim();
      const body = emailBody.trim();
      let mailto = `mailto:${to}`;
      const params: string[] = [];
      if (sub) params.push(`subject=${encodeURIComponent(sub)}`);
      if (body) params.push(`body=${encodeURIComponent(body)}`);
      if (params.length > 0) {
        mailto += `?${params.join('&')}`;
      }
      return mailto || 'mailto:service@example.com';
    } else if (contentType === 'sms') {
      const phone = smsPhone.trim();
      const body = smsBody.trim();
      let smsStr = `sms:${phone}`;
      if (body) {
        smsStr += `?body=${encodeURIComponent(body)}`;
      }
      return smsStr || 'sms:+886912345678';
    } else if (contentType === 'tel') {
      const phone = telPhone.trim();
      return `tel:${phone}` || 'tel:+886212345678';
    }
    return 'https://tools.cjkuo.net';
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // --- 載入核心主題顏色 ---
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00ff66');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 255, 102, 0.6)');

    import('qr-code-styling').then((module) => {
      setQRCodeStyling(() => module.default);
    });
  }, []);

  // --- 反向解析 URL 參數 ---
  useEffect(() => {
    if (!QRCodeStyling) return;

    setIsMounted(true);

    const params = new URLSearchParams(window.location.search);

    const ct = params.get('ct') as ContentType | null;
    if (ct && ['text', 'wifi', 'vcard', 'event', 'email', 'sms', 'tel'].includes(ct)) {
      setContentType(ct);
    }

    if (ct === 'wifi') {
      const ws = params.get('ws');
      if (ws) setWifiSsid(ws);
      const wp = params.get('wp');
      if (wp) setWifiPass(wp);
      const we = params.get('we');
      if (we === 'WPA' || we === 'WPA3' || we === 'WPA-EAP' || we === 'WEP' || we === 'nopass') {
        setWifiEncryption(we as any);
      }
      const wh = params.get('wh');
      if (wh) setWifiHidden(wh === '1');
    } else if (ct === 'vcard') {
      const vc_ver = params.get('vc_ver');
      if (vc_ver === '4.0' || vc_ver === '3.0') setVCardVersion(vc_ver);
      const vc_ln = params.get('vc_ln'); if (vc_ln) setVCardLastName(vc_ln);
      const vc_fn = params.get('vc_fn'); if (vc_fn) setVCardFirstName(vc_fn);
      const vc_nk = params.get('vc_nk'); if (vc_nk) setVCardNickname(vc_nk);
      const vc_org = params.get('vc_org'); if (vc_org) setVCardOrg(vc_org);
      const vc_dp = params.get('vc_dp'); if (vc_dp) setVCardDept(vc_dp);
      const vc_title = params.get('vc_title'); if (vc_title) setVCardTitle(vc_title);
      const vc_tel = params.get('vc_tel'); if (vc_tel) setVCardPhone(vc_tel);
      const vc_wp = params.get('vc_wp'); if (vc_wp) setVCardWorkPhone(vc_wp);
      const vc_em = params.get('vc_em'); if (vc_em) setVCardEmail(vc_em);
      const vc_url = params.get('vc_url'); if (vc_url) setVCardUrl(vc_url);
      const vc_adr = params.get('vc_adr'); if (vc_adr) setVCardAddress(vc_adr);
      const vc_bd = params.get('vc_bd'); if (vc_bd) setVCardBday(vc_bd);
    } else if (ct === 'event') {
      const ev_sum = params.get('ev_sum'); if (ev_sum) setEventSummary(ev_sum);
      const ev_st = params.get('ev_st'); if (ev_st) setEventStart(ev_st);
      const ev_en = params.get('ev_en'); if (ev_en) setEventEnd(ev_en);
      const ev_tz = params.get('ev_tz'); if (ev_tz) setEventTimezone(ev_tz);
      const ev_loc = params.get('ev_loc'); if (ev_loc) setEventLocation(ev_loc);
      const ev_desc = params.get('ev_desc'); if (ev_desc) setEventDescription(ev_desc);
    } else if (ct === 'email') {
      const em_to = params.get('em_to'); if (em_to) setEmailTo(em_to);
      const em_sub = params.get('em_sub'); if (em_sub) setEmailSubject(em_sub);
      const em_body = params.get('em_body'); if (em_body) setEmailBody(em_body);
    } else if (ct === 'sms') {
      const sm_to = params.get('sm_to'); if (sm_to) setSmsPhone(sm_to);
      const sm_body = params.get('sm_body'); if (sm_body) setSmsBody(sm_body);
    } else if (ct === 'tel') {
      const tl_to = params.get('tl_to'); if (tl_to) setTelPhone(tl_to);
    } else {
      const tParam = params.get('t');
      if (tParam) setText(tParam);
    }

    const dt = params.get('dt');
    if (dt) setDotsType(dt);

    const cs = params.get('cs');
    if (cs) setCornersSquare(cs);

    const cd = params.get('cd');
    if (cd) setCornersDot(cd);

    const ec = params.get('ec');
    if (ec === 'L' || ec === 'M' || ec === 'Q' || ec === 'H') {
      setErrorCorrection(ec as any);
    }

    const bc = params.get('bc');
    if (bc) setBgColor(parseHexColor(bc, '#ffffff'));

    const bt = params.get('bt');
    if (bt) setBgTransparent(bt === '1');

    const g = params.get('g');
    if (g !== null) setUseGradient(g === '1');

    const c1 = params.get('c1');
    if (c1) setColor1(parseHexColor(c1, '#00ff66'));

    const c2 = params.get('c2');
    if (c2) setColor2(parseHexColor(c2, '#0077ff'));

    const gt = params.get('gt');
    if (gt === 'linear' || gt === 'radial') {
      setGradientType(gt as any);
    }

    const rot = params.get('rot');
    if (rot) setGradientRotation(parseInt(rot) || 0);

    const sc = params.get('sc');
    if (sc) setSingleColor(parseHexColor(sc, '#000000'));
  }, [QRCodeStyling]);

  // --- 正向更新 URL 參數 (300ms 防抖) ---
  useEffect(() => {
    if (!isMounted) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('ct', contentType);

      if (contentType === 'text') {
        if (text) params.set('t', text);
      } else if (contentType === 'wifi') {
        if (wifiSsid) params.set('ws', wifiSsid);
        if (wifiPass) params.set('wp', wifiPass);
        if (wifiEncryption !== 'WPA') params.set('we', wifiEncryption);
        if (wifiHidden) params.set('wh', '1');
      } else if (contentType === 'vcard') {
        if (vCardVersion !== '4.0') params.set('vc_ver', vCardVersion);
        if (vCardLastName) params.set('vc_ln', vCardLastName);
        if (vCardFirstName) params.set('vc_fn', vCardFirstName);
        if (vCardNickname) params.set('vc_nk', vCardNickname);
        if (vCardOrg) params.set('vc_org', vCardOrg);
        if (vCardDept) params.set('vc_dp', vCardDept);
        if (vCardTitle) params.set('vc_title', vCardTitle);
        if (vCardPhone) params.set('vc_tel', vCardPhone);
        if (vCardWorkPhone) params.set('vc_wp', vCardWorkPhone);
        if (vCardEmail) params.set('vc_em', vCardEmail);
        if (vCardUrl) params.set('vc_url', vCardUrl);
        if (vCardAddress) params.set('vc_adr', vCardAddress);
        if (vCardBday) params.set('vc_bd', vCardBday);
      } else if (contentType === 'event') {
        if (eventSummary) params.set('ev_sum', eventSummary);
        if (eventStart) params.set('ev_st', eventStart);
        if (eventEnd) params.set('ev_en', eventEnd);
        if (eventTimezone !== 'Asia/Taipei') params.set('ev_tz', eventTimezone);
        if (eventLocation) params.set('ev_loc', eventLocation);
        if (eventDescription) params.set('ev_desc', eventDescription);
      } else if (contentType === 'email') {
        if (emailTo) params.set('em_to', emailTo);
        if (emailSubject) params.set('em_sub', emailSubject);
        if (emailBody) params.set('em_body', emailBody);
      } else if (contentType === 'sms') {
        if (smsPhone) params.set('sm_to', smsPhone);
        if (smsBody) params.set('sm_body', smsBody);
      } else if (contentType === 'tel') {
        if (telPhone) params.set('tl_to', telPhone);
      }

      params.set('dt', dotsType);
      params.set('cs', cornersSquare);
      params.set('cd', cornersDot);
      params.set('ec', errorCorrection);
      params.set('bc', bgColor.replace('#', ''));
      params.set('bt', bgTransparent ? '1' : '0');
      params.set('g', useGradient ? '1' : '0');

      if (useGradient) {
        params.set('c1', color1.replace('#', ''));
        params.set('c2', color2.replace('#', ''));
        params.set('gt', gradientType);
        params.set('rot', gradientRotation.toString());
      } else {
        params.set('sc', singleColor.replace('#', ''));
      }

      const newUrl = params.toString() ? '?' + params.toString() : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    }, 300);

    return () => clearTimeout(handler);
  }, [
    contentType,
    text,
    wifiSsid,
    wifiPass,
    wifiEncryption,
    wifiHidden,
    vCardVersion,
    vCardLastName,
    vCardFirstName,
    vCardNickname,
    vCardOrg,
    vCardDept,
    vCardTitle,
    vCardPhone,
    vCardWorkPhone,
    vCardEmail,
    vCardUrl,
    vCardAddress,
    vCardBday,
    eventSummary,
    eventStart,
    eventEnd,
    eventLocation,
    eventDescription,
    emailTo,
    emailSubject,
    emailBody,
    smsPhone,
    smsBody,
    telPhone,
    dotsType,
    cornersSquare,
    cornersDot,
    errorCorrection,
    bgColor,
    bgTransparent,
    useGradient,
    color1,
    color2,
    gradientType,
    gradientRotation,
    singleColor,
    isMounted,
  ]);

  // --- 初始化或重置實例 ---
  useEffect(() => {
    if (!QRCodeStyling || !containerRef.current) return;

    containerRef.current.innerHTML = '';

    const qr = new QRCodeStyling({
      width: 280,
      height: 280,
      type: 'svg',
      data: toUtf8ByteString(getComputedData()),
      image: logoBase64 || '',
      backgroundOptions: {
        color: bgTransparent ? 'transparent' : bgColor,
      },
      dotsOptions: {
        type: dotsType as any,
        color: useGradient ? undefined : singleColor,
        gradient: useGradient
          ? {
              type: gradientType,
              rotation: gradientType === 'linear' ? (gradientRotation * Math.PI) / 180 : undefined,
              colorStops: [
                { offset: 0, color: color1 },
                { offset: 1, color: color2 },
              ],
            }
          : undefined,
      },
      cornersSquareOptions: {
        type: cornersSquare as any,
        color: useGradient ? color1 : singleColor,
      },
      cornersDotOptions: {
        type: cornersDot as any,
        color: useGradient ? color2 : singleColor,
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 4,
        imageSize: logoSize / 100,
      },
      qrOptions: {
        errorCorrectionLevel: logoBase64 ? 'H' : errorCorrection,
      },
    });

    qrCodeRef.current = qr;
    qr.append(containerRef.current);
  }, [
    QRCodeStyling,
    contentType,
    text,
    wifiSsid,
    wifiPass,
    wifiEncryption,
    wifiHidden,
    vCardVersion,
    vCardLastName,
    vCardFirstName,
    vCardNickname,
    vCardOrg,
    vCardDept,
    vCardTitle,
    vCardPhone,
    vCardWorkPhone,
    vCardEmail,
    vCardUrl,
    vCardAddress,
    vCardBday,
    eventSummary,
    eventStart,
    eventEnd,
    eventLocation,
    eventDescription,
    emailTo,
    emailSubject,
    emailBody,
    smsPhone,
    smsBody,
    telPhone,
    dotsType,
    cornersSquare,
    cornersDot,
    bgColor,
    bgTransparent,
    useGradient,
    gradientType,
    color1,
    color2,
    gradientRotation,
    singleColor,
    logoBase64,
    logoSize,
    errorCorrection,
  ]);

  // --- 處理 Logo 上傳 ---
  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('請上傳有效的圖片檔案 (PNG, JPG, SVG, etc.)');
      return;
    }

    setLogoName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setLogoBase64(e.target.result as string);
        setErrorCorrection('H');
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoBase64('');
    setLogoName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- 下載處理 ---
  const downloadQr = async () => {
    if (!QRCodeStyling || !qrCodeRef.current) return;

    const timestamp = (() => {
      const now = new Date();
      return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate()
      ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(
        now.getMinutes()
      ).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    })();
    const filename = `designer-qrcode_${timestamp}`;

    const downloadInstance = new QRCodeStyling({
      ...qrCodeRef.current._options,
      width: downloadSize,
      height: downloadSize,
    });

    await downloadInstance.download({
      name: filename,
      extension: downloadFormat,
    });

    showToast(t.downloadToast);
  };

  // --- 下載 .vcf 名片檔 ---
  const downloadVcfFile = () => {
    const data = getComputedData();
    const blob = new Blob([data], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const nameStr = `${vCardLastName}${vCardFirstName}`.trim() || 'contact';
    a.download = `contact_${nameStr}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(t.vcfDownloadedToast);
  };

  // --- 下載 .ics 行事曆檔 ---
  const downloadIcsFile = () => {
    const data = getComputedData();
    const blob = new Blob([data], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const summaryStr = eventSummary.trim() || 'event';
    a.download = `event_${summaryStr}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(t.icsDownloadedToast);
  };

  // --- 複製 Raw 文字 ---
  const copyRawContent = async () => {
    const data = getComputedData();
    try {
      await navigator.clipboard.writeText(data);
      showToast(t.rawCopiedToast);
    } catch (err) {
      window.prompt(t.shareLinkPrompt, data);
    }
  };

  // --- 複製分享連結 ---
  const copyShareLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast(t.shareLinkCopied);
    } catch (err) {
      window.prompt(t.shareLinkPrompt, url);
    }
  };

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#00ff66"
      accentGlow="rgba(0, 255, 102, 0.6)"
      extraHeaderControls={
        <Link
          href={t.langSwitchHref}
          className="relative inline-flex items-center justify-center gap-1.5 h-[42px] px-3.5 text-xs font-semibold rounded-xl bg-white/[.06] border border-white/10 text-text-sub hover:text-text-main backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:border-[var(--theme-color,#00ff66)] hover:shadow-[0_0_12px_var(--theme-glow,rgba(0,255,102,0.4))] select-none"
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>{t.langSwitchLabel}</span>
        </Link>
      }
    >
      {/* 頂部功能條：包含複製設計網址 */}
      <div className="flex justify-end items-center mb-6 w-full px-4 max-sm:px-0">
        <button type="button" onClick={copyShareLink} className={styles.shareBtn}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
          </svg>
          {t.copyShareLink}
        </button>
      </div>

      <div className="grid grid-cols-[1.2fr_0.8fr] gap-8 items-start text-left max-[1024px]:grid-cols-1 w-full max-w-full overflow-hidden box-border px-4 max-sm:px-0">
        {/* 左欄：設定面板 */}
        <div className={styles.panelCard}>
          {/* 內容類型切換 */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-text-sub">{t.contentType}</span>
            <div className={styles.contentTypeTrack}>
              {[
                {
                  id: 'text',
                  label: t.textOrUrl,
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  ),
                },
                {
                  id: 'vcard',
                  label: t.vcardContact,
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 012-2h2a2 2 0 012 2v2m-4 0h4m-6 7a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 3h2" />
                    </svg>
                  ),
                },
                {
                  id: 'event',
                  label: t.calendarEvent,
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  ),
                },
                {
                  id: 'wifi',
                  label: t.wifiNetwork,
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                  ),
                },
                {
                  id: 'email',
                  label: t.emailMsg,
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                },
                {
                  id: 'sms',
                  label: t.smsMsg,
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  ),
                },
                {
                  id: 'tel',
                  label: t.telCall,
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  ),
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setContentType(tab.id as ContentType)}
                  className={contentType === tab.id ? styles.tabBtnActive : styles.tabBtnInactive}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 內容輸入：文字/網址 */}
          {contentType === 'text' && (
            <div className="flex flex-col gap-3">
              <label htmlFor={textInputId} className="text-sm font-medium text-text-sub">
                {t.qrContentLabel}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={textInputId}
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.textPlaceholder}
                  autoComplete="off"
                  className={styles.inputField}
                />
              </div>
            </div>
          )}

          {/* 內容輸入：vCard 數位名片 */}
          {contentType === 'vcard' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-sub">{t.vCardVersion}</span>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-select-bg border border-border-glass rounded-xl">
                  <button
                    type="button"
                    onClick={() => setVCardVersion('3.0')}
                    className={`${styles.segmentedBtn} ${vCardVersion === '3.0' ? styles.segmentedBtnActive : ''}`}
                  >
                    {t.vCardVer3}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVCardVersion('4.0')}
                    className={`${styles.segmentedBtn} ${vCardVersion === '4.0' ? styles.segmentedBtnActive : ''}`}
                  >
                    {t.vCardVer4}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor={vCardLastNameId} className="text-sm font-medium text-text-sub">
                    {t.vCardLastName}
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      id={vCardLastNameId}
                      type="text"
                      value={vCardLastName}
                      onChange={(e) => setVCardLastName(e.target.value)}
                      placeholder={t.vCardLastNamePlaceholder}
                      autoComplete="off"
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={vCardFirstNameId} className="text-sm font-medium text-text-sub">
                    {t.vCardFirstName}
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      id={vCardFirstNameId}
                      type="text"
                      value={vCardFirstName}
                      onChange={(e) => setVCardFirstName(e.target.value)}
                      placeholder={t.vCardFirstNamePlaceholder}
                      autoComplete="off"
                      className={styles.inputField}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor={vCardNicknameId} className="text-sm font-medium text-text-sub">
                    {t.vCardNickname}
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      id={vCardNicknameId}
                      type="text"
                      value={vCardNickname}
                      onChange={(e) => setVCardNickname(e.target.value)}
                      placeholder={t.vCardNicknamePlaceholder}
                      autoComplete="off"
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={vCardBdayId} className="text-sm font-medium text-text-sub">
                    {t.vCardBday}
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      id={vCardBdayId}
                      type="date"
                      value={vCardBday}
                      onChange={(e) => setVCardBday(e.target.value)}
                      placeholder={t.vCardBdayPlaceholder}
                      className={styles.inputField}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor={vCardOrgId} className="text-sm font-medium text-text-sub">
                    {t.vCardOrg}
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      id={vCardOrgId}
                      type="text"
                      value={vCardOrg}
                      onChange={(e) => setVCardOrg(e.target.value)}
                      placeholder={t.vCardOrgPlaceholder}
                      autoComplete="off"
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={vCardDeptId} className="text-sm font-medium text-text-sub">
                    {t.vCardDept}
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      id={vCardDeptId}
                      type="text"
                      value={vCardDept}
                      onChange={(e) => setVCardDept(e.target.value)}
                      placeholder={t.vCardDeptPlaceholder}
                      autoComplete="off"
                      className={styles.inputField}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={vCardTitleId} className="text-sm font-medium text-text-sub">
                  {t.vCardTitle}
                </label>
                <div className={styles.inputContainer}>
                  <input
                    id={vCardTitleId}
                    type="text"
                    value={vCardTitle}
                    onChange={(e) => setVCardTitle(e.target.value)}
                    placeholder={t.vCardTitlePlaceholder}
                    autoComplete="off"
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor={vCardPhoneId} className="text-sm font-medium text-text-sub">
                    {t.vCardPhone}
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      id={vCardPhoneId}
                      type="tel"
                      value={vCardPhone}
                      onChange={(e) => setVCardPhone(e.target.value)}
                      placeholder={t.vCardPhonePlaceholder}
                      autoComplete="off"
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={vCardWorkPhoneId} className="text-sm font-medium text-text-sub">
                    {t.vCardWorkPhone}
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      id={vCardWorkPhoneId}
                      type="tel"
                      value={vCardWorkPhone}
                      onChange={(e) => setVCardWorkPhone(e.target.value)}
                      placeholder={t.vCardWorkPhonePlaceholder}
                      autoComplete="off"
                      className={styles.inputField}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor={vCardEmailId} className="text-sm font-medium text-text-sub">
                    {t.vCardEmail}
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      id={vCardEmailId}
                      type="email"
                      value={vCardEmail}
                      onChange={(e) => setVCardEmail(e.target.value)}
                      placeholder={t.vCardEmailPlaceholder}
                      autoComplete="off"
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={vCardUrlId} className="text-sm font-medium text-text-sub">
                    {t.vCardUrl}
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      id={vCardUrlId}
                      type="url"
                      value={vCardUrl}
                      onChange={(e) => setVCardUrl(e.target.value)}
                      placeholder={t.vCardUrlPlaceholder}
                      autoComplete="off"
                      className={styles.inputField}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={vCardAddressId} className="text-sm font-medium text-text-sub">
                  {t.vCardAddress}
                </label>
                <div className={styles.inputContainer}>
                  <input
                    id={vCardAddressId}
                    type="text"
                    value={vCardAddress}
                    onChange={(e) => setVCardAddress(e.target.value)}
                    placeholder={t.vCardAddressPlaceholder}
                    autoComplete="off"
                    className={styles.inputField}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 內容輸入：iCalendar 行事曆行程 */}
          {contentType === 'event' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={eventSummaryId} className="text-sm font-medium text-text-sub">
                  {t.eventSummary}
                </label>
                <div className={styles.inputContainer}>
                  <input
                    id={eventSummaryId}
                    type="text"
                    value={eventSummary}
                    onChange={(e) => setEventSummary(e.target.value)}
                    placeholder={t.eventSummaryPlaceholder}
                    autoComplete="off"
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor={eventStartId} className="text-sm font-medium text-text-sub">
                    {t.eventStart}
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      id={eventStartId}
                      type="datetime-local"
                      value={eventStart}
                      onChange={(e) => setEventStart(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-text-main font-medium cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={eventEndId} className="text-sm font-medium text-text-sub">
                    {t.eventEnd}
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      id={eventEndId}
                      type="datetime-local"
                      value={eventEnd}
                      onChange={(e) => setEventEnd(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-text-main font-medium cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={eventTimezoneId} className="text-sm font-medium text-text-sub">
                    {t.eventTimezone}
                  </label>
                  <select
                    id={eventTimezoneId}
                    value={eventTimezone}
                    onChange={(e) => setEventTimezone(e.target.value)}
                    className="w-full bg-select-bg text-text-main border border-border-glass rounded-xl px-3 py-3 outline-none focus:border-[#00ff66]/40 text-sm font-medium cursor-pointer"
                  >
                    <option value="Asia/Taipei">Asia/Taipei (UTC+8)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                    <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                    <option value="Asia/Hong_Kong">Asia/Hong_Kong (UTC+8)</option>
                    <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                    <option value="Europe/London">Europe/London (UTC+0)</option>
                    <option value="America/New_York">America/New_York (UTC-5)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                    <option value="UTC">UTC (Universal Time)</option>
                    <option value="LOCAL">{t.timezoneLocal}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={eventLocationId} className="text-sm font-medium text-text-sub">
                  {t.eventLocation}
                </label>
                <div className={styles.inputContainer}>
                  <input
                    id={eventLocationId}
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder={t.eventLocationPlaceholder}
                    autoComplete="off"
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={eventDescriptionId} className="text-sm font-medium text-text-sub">
                  {t.eventDescription}
                </label>
                <div className={styles.inputContainer}>
                  <input
                    id={eventDescriptionId}
                    type="text"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder={t.eventDescriptionPlaceholder}
                    autoComplete="off"
                    className={styles.inputField}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 內容輸入：WiFi 網路 */}
          {contentType === 'wifi' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-3">
                  <label htmlFor={wifiSsidId} className="text-sm font-medium text-text-sub">
                    {t.wifiSsid}
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      id={wifiSsidId}
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder={t.wifiSsidPlaceholder}
                      autoComplete="off"
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label htmlFor={wifiPassId} className="text-sm font-medium text-text-sub">
                    {t.wifiPass}
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      id={wifiPassId}
                      type="text"
                      value={wifiPass}
                      onChange={(e) => setWifiPass(e.target.value)}
                      placeholder={t.wifiPassPlaceholder}
                      autoComplete="off"
                      className={styles.inputField}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-3">
                  <label htmlFor={wifiEncryptionId} className="text-sm font-medium text-text-sub">
                    {t.securityType}
                  </label>
                  <select
                    id={wifiEncryptionId}
                    value={wifiEncryption}
                    onChange={(e) => setWifiEncryption(e.target.value as any)}
                    className="w-full bg-select-bg text-text-main border border-border-glass rounded-xl px-4 py-3 outline-none focus:border-[#00ff66]/40 text-sm font-medium cursor-pointer"
                  >
                    <option value="WPA">{t.wpaOption}</option>
                    <option value="WPA3">{t.wpa3Option}</option>
                    <option value="WPA-EAP">{t.wpaEapOption}</option>
                    <option value="WEP">{t.wepOption}</option>
                    <option value="nopass">{t.nopassOption}</option>
                  </select>
                </div>

                <div className="flex items-center h-full pt-6 max-sm:pt-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none text-text-sub text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={wifiHidden}
                      onChange={(e) => setWifiHidden(e.target.checked)}
                      className="accent-[#00ff66] w-4.5 h-4.5 rounded"
                    />
                    {t.hiddenSsid}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 內容輸入：E-mail 郵件 */}
          {contentType === 'email' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={emailToId} className="text-sm font-medium text-text-sub">
                  {t.emailTo}
                </label>
                <div className={styles.inputContainer}>
                  <input
                    id={emailToId}
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder={t.emailToPlaceholder}
                    autoComplete="off"
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={emailSubjectId} className="text-sm font-medium text-text-sub">
                  {t.emailSubject}
                </label>
                <div className={styles.inputContainer}>
                  <input
                    id={emailSubjectId}
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder={t.emailSubjectPlaceholder}
                    autoComplete="off"
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={emailBodyId} className="text-sm font-medium text-text-sub">
                  {t.emailBody}
                </label>
                <div className={styles.inputContainer}>
                  <input
                    id={emailBodyId}
                    type="text"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder={t.emailBodyPlaceholder}
                    autoComplete="off"
                    className={styles.inputField}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 內容輸入：SMS 簡訊 */}
          {contentType === 'sms' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={smsPhoneId} className="text-sm font-medium text-text-sub">
                  {t.smsPhone}
                </label>
                <div className={styles.inputContainer}>
                  <input
                    id={smsPhoneId}
                    type="tel"
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    placeholder={t.smsPhonePlaceholder}
                    autoComplete="off"
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={smsBodyId} className="text-sm font-medium text-text-sub">
                  {t.smsBody}
                </label>
                <div className={styles.inputContainer}>
                  <input
                    id={smsBodyId}
                    type="text"
                    value={smsBody}
                    onChange={(e) => setSmsBody(e.target.value)}
                    placeholder={t.smsBodyPlaceholder}
                    autoComplete="off"
                    className={styles.inputField}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 內容輸入：電話撥號 */}
          {contentType === 'tel' && (
            <div className="flex flex-col gap-3">
              <label htmlFor={telPhoneId} className="text-sm font-medium text-text-sub">
                {t.telPhone}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={telPhoneId}
                  type="tel"
                  value={telPhone}
                  onChange={(e) => setTelPhone(e.target.value)}
                  placeholder={t.telPhonePlaceholder}
                  autoComplete="off"
                  className={styles.inputField}
                />
              </div>
            </div>
          )}

          {/* 碼體樣式 (網格) */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-text-sub">{t.dotsStyle}</span>
            <div className="grid grid-cols-6 gap-2.5 max-md:grid-cols-3 max-sm:grid-cols-2">
              {[
                {
                  id: 'square',
                  name: t.square,
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <rect x="4" y="4" width="16" height="16" fill="currentColor" />
                    </svg>
                  ),
                },
                {
                  id: 'dots',
                  name: t.dots,
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <circle cx="12" cy="12" r="8" fill="currentColor" />
                    </svg>
                  ),
                },
                {
                  id: 'rounded',
                  name: t.rounded,
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <rect x="4" y="4" width="16" height="16" rx="5" fill="currentColor" />
                    </svg>
                  ),
                },
                {
                  id: 'classy',
                  name: t.classy,
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path d="M4 12C4 7.58 7.58 4 12 4H20V12C20 16.42 16.42 20 12 20H4V12Z" fill="currentColor" />
                    </svg>
                  ),
                },
                {
                  id: 'classy-rounded',
                  name: t.classyRounded,
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path d="M4 12C4 7.58 7.58 4 12 4H20L20 12C20 16.42 16.42 20 12 20L4 12Z" fill="currentColor" />
                    </svg>
                  ),
                },
                {
                  id: 'extra-rounded',
                  name: t.extraRounded,
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <rect x="4" y="4" width="16" height="16" rx="8" fill="currentColor" />
                    </svg>
                  ),
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDotsType(opt.id)}
                  className={`${styles.styleOptionBtn} ${dotsType === opt.id ? styles.styleOptionBtnActive : ''}`}
                >
                  {opt.icon}
                  <span className="text-xs font-medium">{opt.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
            {/* 定位點外框 */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-text-sub">{t.cornersSquareStyle}</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: 'extra-rounded',
                    name: t.shieldRounded,
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
                      </svg>
                    ),
                  },
                  {
                    id: 'square',
                    name: t.square,
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" />
                      </svg>
                    ),
                  },
                  {
                    id: 'dot',
                    name: t.ring,
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" />
                      </svg>
                    ),
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCornersSquare(opt.id)}
                    className={`${styles.styleOptionBtn} ${
                      cornersSquare === opt.id ? styles.styleOptionBtnActive : ''
                    }`}
                  >
                    {opt.icon}
                    <span className="text-xs font-medium">{opt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 定位點內核 */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-text-sub">{t.cornersDotStyle}</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: 'dot',
                    name: t.dots,
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <circle cx="12" cy="12" r="6" fill="currentColor" />
                      </svg>
                    ),
                  },
                  {
                    id: 'square',
                    name: t.square,
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                      </svg>
                    ),
                  },
                  {
                    id: 'rounded',
                    name: t.rounded,
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor" />
                      </svg>
                    ),
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCornersDot(opt.id)}
                    className={`${styles.styleOptionBtn} ${cornersDot === opt.id ? styles.styleOptionBtnActive : ''}`}
                  >
                    {opt.icon}
                    <span className="text-xs font-medium">{opt.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
            {/* 背景色與透明設定 */}
            <div className="flex flex-col gap-3">
              <label htmlFor={bgColorId} className="text-sm font-medium text-text-sub">
                {t.bgSettings}
              </label>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2.5 bg-select-bg border border-border-glass px-3 py-2 rounded-xl">
                  <input
                    id={bgColorId}
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    disabled={bgTransparent}
                    className="w-8 h-8 bg-transparent border-none outline-none cursor-pointer disabled:opacity-30"
                  />
                  <span className="font-mono text-sm text-text-main font-medium">
                    {bgTransparent ? 'TRANSPARENT' : bgColor.toUpperCase()}
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none text-text-sub text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={bgTransparent}
                    onChange={(e) => setBgTransparent(e.target.checked)}
                    className="accent-[#00ff66] w-4.5 h-4.5 rounded"
                  />
                  {t.transparentBg}
                </label>
              </div>
            </div>

            {/* 容錯率設定 */}
            <div className="flex flex-col gap-3">
              <label htmlFor={errorCorrectionId} className="text-sm font-medium text-text-sub">
                {t.errorCorrection}
              </label>
              <select
                id={errorCorrectionId}
                value={logoBase64 ? 'H' : errorCorrection}
                onChange={(e) => setErrorCorrection(e.target.value as any)}
                disabled={!!logoBase64}
                className="w-full bg-select-bg text-text-main border border-border-glass rounded-xl px-4 py-3 outline-none focus:border-[#00ff66]/40 text-base font-medium cursor-pointer disabled:opacity-50"
              >
                <option value="L">{t.errorCorrectionL}</option>
                <option value="M">{t.errorCorrectionM}</option>
                <option value="Q">{t.errorCorrectionQ}</option>
                <option value="H">{t.errorCorrectionH}</option>
              </select>
            </div>
          </div>

          {/* 啟用漸層與配色 */}
          <div className="flex flex-col gap-4 border-t border-border-glass pt-6">
            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer select-none text-text-sub text-base font-medium">
                <input
                  type="checkbox"
                  checked={useGradient}
                  onChange={(e) => setUseGradient(e.target.checked)}
                  className="accent-[#00ff66] w-5 h-5 rounded"
                />
                {t.enableGradient}
              </label>
            </div>

            {useGradient ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <div className="flex flex-col gap-3">
                    <label htmlFor={gradientTypeId} className="text-sm font-medium text-text-sub">
                      {t.gradientType}
                    </label>
                    <select
                      id={gradientTypeId}
                      value={gradientType}
                      onChange={(e) => setGradientType(e.target.value as any)}
                      className="w-full bg-select-bg text-text-main border border-border-glass rounded-xl px-4 py-3 outline-none focus:border-[#00ff66]/40 text-base font-medium cursor-pointer"
                    >
                      <option value="linear">{t.linearGradient}</option>
                      <option value="radial">{t.radialGradient}</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-medium text-text-sub">{t.colorPair}</span>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-2 bg-select-bg border border-border-glass px-3 py-2 rounded-xl flex-1">
                        <input
                          type="color"
                          value={color1}
                          onChange={(e) => setColor1(e.target.value)}
                          className="w-8 h-8 bg-transparent border-none outline-none cursor-pointer"
                        />
                        <span className="font-mono text-xs text-text-main font-medium">{color1.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-select-bg border border-border-glass px-3 py-2 rounded-xl flex-1">
                        <input
                          type="color"
                          value={color2}
                          onChange={(e) => setColor2(e.target.value)}
                          className="w-8 h-8 bg-transparent border-none outline-none cursor-pointer"
                        />
                        <span className="font-mono text-xs text-text-main font-medium">{color2.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {gradientType === 'linear' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between text-sm text-text-sub font-medium">
                      <span>{t.gradientAngle}</span>
                      <span className={styles.greenText}>{gradientRotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={gradientRotation}
                      onChange={(e) => setGradientRotation(parseInt(e.target.value))}
                      className="w-full accent-[#00ff66] h-1.5 rounded-lg bg-white/10 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-text-sub">{t.singleColor}</span>
                <div className="flex items-center gap-2.5 bg-select-bg border border-border-glass px-3 py-2 rounded-xl w-fit">
                  <input
                    type="color"
                    value={singleColor}
                    onChange={(e) => setSingleColor(e.target.value)}
                    className="w-8 h-8 bg-transparent border-none outline-none cursor-pointer"
                  />
                  <span className="font-mono text-sm text-text-main font-medium">{singleColor.toUpperCase()}</span>
                </div>
              </div>
            )}
          </div>

          {/* 置中 Logo */}
          <div className="flex flex-col gap-3 border-t border-border-glass pt-6">
            <span className="text-sm font-medium text-text-sub">{t.centerLogo}</span>

            {!logoBase64 ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files.length > 0) {
                    handleLogoFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`${styles.dropzoneContainer} ${isDragOver ? styles.dropzoneContainerDragover : ''}`}
              >
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-text-sub transition-colors">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                </svg>
                <div className="text-xs text-text-sub font-medium leading-normal">{t.dropzoneText}</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleLogoFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-select-bg border border-border-glass rounded-xl px-4 py-3 w-full">
                  <div className="flex items-center gap-3">
                    <img
                      src={logoBase64}
                      alt="Logo Preview"
                      className="w-8 h-8 object-contain bg-white rounded border border-black/10"
                    />
                    <span className="text-sm font-medium text-text-main max-w-[200px] truncate">{logoName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    title={t.removeLogo}
                    className="bg-transparent border-none text-text-sub hover:text-red-500 hover:scale-115 transition-all cursor-pointer p-1"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>

                {/* 調整 Logo 大小 */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-sm text-text-sub font-medium">
                    <span>{t.logoSize}</span>
                    <span className={styles.greenText}>{logoSize}%</span>
                  </div>
                  <input
                    id={logoSizeId}
                    type="range"
                    min="10"
                    max="35"
                    value={logoSize}
                    onChange={(e) => setLogoSize(parseInt(e.target.value))}
                    className="w-full accent-[#00ff66] h-1.5 rounded-lg bg-white/10 cursor-pointer"
                  />
                </div>

                {/* 安全防禦提示 */}
                <div className={styles.alertBox}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0 mt-0.5">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                  </svg>
                  <div>
                    <strong>{t.autoSafetyTitle}</strong>
                    {t.autoSafetyDesc}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右欄：雙獨立卡片佈局 (QR Code 卡片 + 資訊與檔案下載卡片) */}
        <div className="flex flex-col gap-6 max-[1024px]:static max-[1024px]:top-auto sticky top-6 w-full max-w-full">
          {/* 上卡片：QR Code 畫布與圖片下載 */}
          <div className={`${styles.panelCard} items-center`}>
            <div
              className={`${styles.qrPreview} ${bgTransparent ? styles.checkerboardBg : ''}`}
              style={{ backgroundColor: bgTransparent ? undefined : bgColor }}
            >
              {/* 動態渲染掛載容器 */}
              <div ref={containerRef} className="w-[280px] h-[280px] max-w-full max-h-full flex items-center justify-center" />
            </div>

            {/* 下載設定 */}
            <div className="flex flex-col gap-4 w-full max-w-full">
              {/* 下載格式膠囊按鈕 */}
              <div className="flex flex-col gap-2 w-full">
                <span className="text-sm font-medium text-text-sub">{t.downloadFormat}</span>
                <div className="grid grid-cols-4 gap-1 p-1 bg-select-bg border border-border-glass rounded-xl">
                  {(['png', 'svg', 'jpeg', 'webp'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setDownloadFormat(fmt)}
                      className={`${styles.segmentedBtn} ${downloadFormat === fmt ? styles.segmentedBtnActive : ''} uppercase`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 下載尺寸膠囊按鈕 */}
              <div className="flex flex-col gap-2 w-full">
                <span className="text-sm font-medium text-text-sub">{t.downloadSize}</span>
                <div className="grid grid-cols-4 gap-1 p-1 bg-select-bg border border-border-glass rounded-xl">
                  {[
                    { val: 300, label: '300' },
                    { val: 600, label: '600' },
                    { val: 1200, label: '1200' },
                    { val: 2000, label: '2000' },
                  ].map((sz) => (
                    <button
                      key={sz.val}
                      type="button"
                      onClick={() => setDownloadSize(sz.val)}
                      className={`${styles.segmentedBtn} ${downloadSize === sz.val ? styles.segmentedBtnActive : ''}`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={downloadQr} className={styles.downloadBtn}>
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
                </svg>
                {t.downloadBtn}
              </button>
            </div>
          </div>

          {/* 下卡片：特殊格式 (.vcf / .ics) 獨立資訊與檔案卡片 */}
          {contentType === 'vcard' && (
            <div className={styles.panelCard}>
              <div className="flex flex-col gap-3.5 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-sub uppercase tracking-wider">
                    {t.vcfPreviewTitle}
                  </span>
                </div>

                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={downloadVcfFile}
                    className={styles.vcfDownloadBtn}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                    <span>{t.downloadVcfBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={copyRawContent}
                    title={t.copyVcfBtn}
                    className={styles.vcfCopyBtn}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                    </svg>
                  </button>
                </div>

                {/* 即時 .vcf 文字預覽 */}
                <div className={styles.vcfCodeBox}>
                  {getComputedData()}
                </div>
              </div>
            </div>
          )}

          {contentType === 'event' && (
            <div className={styles.panelCard}>
              <div className="flex flex-col gap-3.5 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-sub uppercase tracking-wider">
                    {t.icsPreviewTitle}
                  </span>
                </div>

                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={downloadIcsFile}
                    className={styles.vcfDownloadBtn}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                    <span>{t.downloadIcsBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={copyRawContent}
                    title={t.copyIcsBtn}
                    className={styles.vcfCopyBtn}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                    </svg>
                  </button>
                </div>

                {/* 即時 .ics 文字預覽 */}
                <div className={styles.vcfCodeBox}>
                  {getComputedData()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 通用 FAQ 常見問題區塊 */}
      <FaqSection
        items={t.faqItems}
        title={t.faqTitle}
        subtitle={t.faqSubtitle}
        accentColor="#00ff66"
      />

      {toast && <div className={styles.toast}>{toast}</div>}
    </ToolLayout>
  );
}
