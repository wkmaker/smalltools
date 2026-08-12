'use client';

import { useState, useEffect, useRef, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import styles from './qr-generator.module.css';

interface QrGeneratorClientProps {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: 'QR Code 產生器',
    subtitle: 'DESIGNER QR CODE GENERATOR',
    description:
      '專業免費的線上藝術 QR Code 產生器！支援自訂點體樣式、雙色漸層、中央 Logo 拖曳內嵌、自動 30% 高容錯率及 PNG/SVG/WEBP 向量圖檔下載。',
    copyShareLink: '複製分享設計連結',
    shareLinkCopied: '✓ 已複製設計網址！',
    shareLinkPrompt: '複製以下網址以進行分享：',
    contentType: '內容類型',
    textOrUrl: '文字 / 網址',
    wifiNetwork: 'WiFi 網路',
    qrContentLabel: 'QR Code 內容',
    textPlaceholder: '請輸入網址或文字 (e.g. https://...)',
    wifiSsid: 'WiFi SSID (網路名稱)',
    wifiSsidPlaceholder: '例如：MyHomeWiFi',
    wifiPass: 'WiFi 密碼',
    wifiPassPlaceholder: '請輸入 WiFi 密碼',
    securityType: '安全性類型',
    nopass: '無密碼 (nopass)',
    hiddenSsid: '隱藏 SSID 網路',
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
    langSwitchLabel: 'English',
    langSwitchHref: '/qr-generator/en/',
  },
  en: {
    title: 'Designer QR Code Generator',
    subtitle: 'DESIGNER QR CODE GENERATOR',
    description:
      'Free professional online Designer QR Code Generator! Custom dot styles, dual gradients, center logo drag & drop, 30% error correction, and vector SVG download.',
    copyShareLink: 'Copy Shareable Design Link',
    shareLinkCopied: '✓ Design link copied!',
    shareLinkPrompt: 'Copy the following URL to share:',
    contentType: 'Content Type',
    textOrUrl: 'Text / URL',
    wifiNetwork: 'WiFi Network',
    qrContentLabel: 'QR Code Content',
    textPlaceholder: 'Enter URL or text (e.g. https://...)',
    wifiSsid: 'WiFi SSID (Network Name)',
    wifiSsidPlaceholder: 'e.g. MyHomeWiFi',
    wifiPass: 'WiFi Password',
    wifiPassPlaceholder: 'Enter WiFi password',
    securityType: 'Security Type',
    nopass: 'No Password (nopass)',
    hiddenSsid: 'Hidden Network SSID',
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
    langSwitchLabel: '繁體中文',
    langSwitchHref: '/qr-generator/',
  },
};

export default function QrGeneratorClient({ lang = 'zh-TW' }: QrGeneratorClientProps) {
  const t = TRANSLATIONS[lang];

  // --- 狀態宣告 ---
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [QRCodeStyling, setQRCodeStyling] = useState<any>(null);

  const [contentType, setContentType] = useState<'text' | 'wifi'>('text');
  const [text, setText] = useState<string>('https://tools.cjkuo.net');

  // WiFi 連線設定
  const [wifiSsid, setWifiSsid] = useState<string>('');
  const [wifiPass, setWifiPass] = useState<string>('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [wifiHidden, setWifiHidden] = useState<boolean>(false);

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

  const getComputedData = (): string => {
    if (contentType === 'text') {
      return text.trim() || 'https://tools.cjkuo.net';
    } else {
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
    }
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

    const ct = params.get('ct');
    if (ct === 'wifi') {
      setContentType('wifi');
      const ws = params.get('ws');
      if (ws) setWifiSsid(ws);
      const wp = params.get('wp');
      if (wp) setWifiPass(wp);
      const we = params.get('we');
      if (we === 'WPA' || we === 'WEP' || we === 'nopass') {
        setWifiEncryption(we as any);
      }
      const wh = params.get('wh');
      if (wh) setWifiHidden(wh === '1');
    } else {
      setContentType('text');
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
      } else {
        if (wifiSsid) params.set('ws', wifiSsid);
        if (wifiPass) params.set('wp', wifiPass);
        if (wifiEncryption !== 'WPA') params.set('we', wifiEncryption);
        if (wifiHidden) params.set('wh', '1');
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
      data: getComputedData(),
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

      <div className="grid grid-cols-[1.2fr_0.8fr] gap-8 items-start text-left max-[1024px]:grid-cols-1 w-full px-4 max-sm:px-0">
        {/* 左欄：設定面板 */}
        <div className={styles.panelCard}>
          {/* 內容類型切換 */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-text-sub">{t.contentType}</span>
            <div className={styles.segmentedContainer}>
              <button
                type="button"
                onClick={() => setContentType('text')}
                className={contentType === 'text' ? styles.tabBtnActive : styles.tabBtnInactive}
              >
                {t.textOrUrl}
              </button>
              <button
                type="button"
                onClick={() => setContentType('wifi')}
                className={contentType === 'wifi' ? styles.tabBtnActive : styles.tabBtnInactive}
              >
                {t.wifiNetwork}
              </button>
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
                    className="w-full bg-select-bg text-text-main border border-border-glass rounded-xl px-4 py-3 outline-none focus:border-[#00ff66]/40 text-base font-medium cursor-pointer"
                  >
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">{t.nopass}</option>
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

        {/* 右欄：預覽與下載 */}
        <div className={`${styles.panelCard} sticky top-6 items-center`}>
          <div
            className={`${styles.qrPreview} ${bgTransparent ? styles.checkerboardBg : ''}`}
            style={{ backgroundColor: bgTransparent ? undefined : bgColor }}
          >
            {/* 動態渲染掛載容器 */}
            <div ref={containerRef} className="w-[280px] h-[280px] flex items-center justify-center" />
          </div>

          {/* 下載設定 */}
          <div className="flex flex-col gap-4 w-full max-w-[280px]">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-2">
                <label htmlFor={downloadFormatId} className="text-sm font-medium text-text-sub">
                  {t.downloadFormat}
                </label>
                <select
                  id={downloadFormatId}
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value as any)}
                  className="w-full bg-select-bg text-text-main border border-border-glass rounded-xl px-3 py-2.5 outline-none focus:border-[#00ff66]/40 text-sm font-medium cursor-pointer"
                >
                  <option value="png">PNG</option>
                  <option value="svg">SVG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="webp">WEBP</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={downloadSizeId} className="text-sm font-medium text-text-sub">
                  {t.downloadSize}
                </label>
                <select
                  id={downloadSizeId}
                  value={downloadSize}
                  onChange={(e) => setDownloadSize(parseInt(e.target.value))}
                  className="w-full bg-select-bg text-text-main border border-border-glass rounded-xl px-3 py-2.5 outline-none focus:border-[#00ff66]/40 text-sm font-medium cursor-pointer"
                >
                  <option value="300">300 x 300</option>
                  <option value="600">600 x 600</option>
                  <option value="1200">{t.printSize}</option>
                  <option value="2000">{t.hdSize}</option>
                </select>
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
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </ToolLayout>
  );
}
