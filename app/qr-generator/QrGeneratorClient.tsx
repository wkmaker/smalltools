'use client';

import { useState, useEffect, useRef, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './qr-generator.module.css';
import { downloadBlob } from '../utils/downloadBlob';
import { TRANSLATIONS } from './translations';
import {
  parseHexColor,
  toUtf8ByteString,
  buildWifiPayload,
  buildVCardPayload,
  buildEventPayload,
  buildEmailPayload,
  buildSmsPayload,
  buildTelPayload,
} from './engine';
import type {
  ContentType,
  WifiEncryption,
  GradientType,
  ErrorCorrectionLevel,
  DownloadFormat,
} from './types';
import ContentTypeTabs from './components/ContentTypeTabs';
import ContentForms from './components/ContentForms';
import StyleAndColorSettings from './components/StyleAndColorSettings';
import LogoUploader from './components/LogoUploader';
import QrPreviewCard from './components/QrPreviewCard';

interface QrGeneratorClientProps {
  lang?: 'zh-TW' | 'en';
}

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
  const [wifiEncryption, setWifiEncryption] = useState<WifiEncryption>('WPA');
  const [wifiHidden, setWifiHidden] = useState<boolean>(false);

  // vCard 數位名片設定
  const [vCardVersion, setVCardVersion] = useState<'4.0' | '3.0'>('3.0');
  const [vCardLastName, setVCardLastName] = useState<string>('');
  const [vCardFirstName, setVCardFirstName] = useState<string>('');
  const [vCardNickname, setVCardNickname] = useState<string>('');
  const [vCardOrg, setVCardOrg] = useState<string>('');
  const [vCardDept, setVCardDept] = useState<string>('');
  const [vCardTitle, setVCardTitle] = useState<string>('');
  const [vCardPhone, setVCardPhone] = useState<string>('');
  const [vCardWorkPhone, setVCardWorkPhone] = useState<string>('');
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
  const [gradientType, setGradientType] = useState<GradientType>('linear');
  const [color1, setColor1] = useState<string>('#00ff66');
  const [color2, setColor2] = useState<string>('#0077ff');
  const [gradientRotation, setGradientRotation] = useState<number>(0);
  const [singleColor, setSingleColor] = useState<string>('#000000');

  // 容錯率與置中 Logo
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('Q');
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [logoName, setLogoName] = useState<string>('');
  const [logoSize, setLogoSize] = useState<number>(20);

  // 下載設定與回饋
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('png');
  const [downloadSize, setDownloadSize] = useState<number>(600);
  const [toast, setToast] = useState<string>('');

  // --- 唯一 HTML ID 宣告 ---
  const textInputId = useId();
  const wifiSsidId = useId();
  const wifiPassId = useId();
  const wifiEncryptionId = useId();

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

  // --- Refs ---
  const qrCodeRef = useRef<any>(null);
  const qrDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getComputedData = (): string => {
    if (contentType === 'text') {
      return text.trim() || 'https://tools.cjkuo.net';
    } else if (contentType === 'wifi') {
      return buildWifiPayload({
        ssid: wifiSsid,
        pass: wifiPass,
        encryption: wifiEncryption,
        hidden: wifiHidden,
      });
    } else if (contentType === 'vcard') {
      return buildVCardPayload({
        version: vCardVersion,
        lastName: vCardLastName,
        firstName: vCardFirstName,
        nickname: vCardNickname,
        org: vCardOrg,
        dept: vCardDept,
        title: vCardTitle,
        address: vCardAddress,
        bday: vCardBday,
        phone: vCardPhone,
        workPhone: vCardWorkPhone,
        email: vCardEmail,
        url: vCardUrl,
      });
    } else if (contentType === 'event') {
      return buildEventPayload({
        summary: eventSummary,
        start: eventStart,
        end: eventEnd,
        timezone: eventTimezone,
        location: eventLocation,
        description: eventDescription,
      });
    } else if (contentType === 'email') {
      return buildEmailPayload({
        to: emailTo,
        subject: emailSubject,
        body: emailBody,
      });
    } else if (contentType === 'sms') {
      return buildSmsPayload({
        phone: smsPhone,
        body: smsBody,
      });
    } else if (contentType === 'tel') {
      return buildTelPayload({
        phone: telPhone,
      });
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
        setWifiEncryption(we);
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
      setErrorCorrection(ec);
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
      setGradientType(gt);
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
    eventTimezone,
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

  // --- 初始化或重置實例 (加入 150ms 防抖並優先呼叫 update 原地更新) ---
  useEffect(() => {
    if (!QRCodeStyling || !containerRef.current) return;

    if (qrDebounceTimer.current) clearTimeout(qrDebounceTimer.current);

    qrDebounceTimer.current = setTimeout(() => {
      if (!QRCodeStyling || !containerRef.current) return;

      const options = {
        width: 280,
        height: 280,
        type: 'svg' as const,
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
      };

      if (qrCodeRef.current) {
        qrCodeRef.current.update(options);
      } else {
        containerRef.current.innerHTML = '';
        const qr = new QRCodeStyling(options);
        qrCodeRef.current = qr;
        qr.append(containerRef.current);
      }
    }, 150);

    return () => {
      if (qrDebounceTimer.current) clearTimeout(qrDebounceTimer.current);
    };
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
    eventTimezone,
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
      showToast(t.invalidImageFile);
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
  };

  // --- 下載 QR Code ---
  const downloadQr = () => {
    if (!qrCodeRef.current) return;

    const originalWidth = qrCodeRef.current._options.width;
    const originalHeight = qrCodeRef.current._options.height;

    qrCodeRef.current.update({
      width: downloadSize,
      height: downloadSize,
    });

    setTimeout(() => {
      qrCodeRef.current.download({
        name: `qrcode_${Date.now()}`,
        extension: downloadFormat,
      });

      showToast(t.downloadToast);

      setTimeout(() => {
        qrCodeRef.current.update({
          width: originalWidth,
          height: originalHeight,
        });
      }, 500);
    }, 100);
  };

  // --- 下載原始 .vcf 檔案 ---
  const downloadVcfFile = () => {
    const rawData = getComputedData();
    const blob = new Blob([rawData], { type: 'text/vcard;charset=utf-8' });
    const nameStr = `${vCardLastName}${vCardFirstName}`.trim() || 'contact';
    downloadBlob(blob, `contact_${nameStr}.vcf`);
    showToast(t.vcfDownloadedToast);
  };

  // --- 下載原始 .ics 檔案 ---
  const downloadIcsFile = () => {
    const rawData = getComputedData();
    const blob = new Blob([rawData], { type: 'text/calendar;charset=utf-8' });
    const summaryStr = eventSummary.trim() || 'event';
    downloadBlob(blob, `event_${summaryStr}.ics`);
    showToast(t.icsDownloadedToast);
  };

  // --- 複製文字到剪貼簿 ---
  const copyRawContent = async () => {
    const rawData = getComputedData();
    try {
      await navigator.clipboard.writeText(rawData);
      showToast(t.rawCopiedToast);
    } catch {
      window.prompt(t.shareLinkPrompt, rawData);
    }
  };

  // --- 複製完整分享設計網址 ---
  const copyShareLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast(t.shareLinkCopied);
    } catch {
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
          <ContentTypeTabs
            contentType={contentType}
            setContentType={setContentType}
            labels={{
              contentType: t.contentType,
              textOrUrl: t.textOrUrl,
              vcardContact: t.vcardContact,
              calendarEvent: t.calendarEvent,
              wifiNetwork: t.wifiNetwork,
              emailMsg: t.emailMsg,
              smsMsg: t.smsMsg,
              telCall: t.telCall,
            }}
          />

          <ContentForms
            contentType={contentType}
            t={t}
            text={text}
            setText={setText}
            textInputId={textInputId}
            wifiSsid={wifiSsid}
            setWifiSsid={setWifiSsid}
            wifiPass={wifiPass}
            setWifiPass={setWifiPass}
            wifiEncryption={wifiEncryption}
            setWifiEncryption={setWifiEncryption}
            wifiHidden={wifiHidden}
            setWifiHidden={setWifiHidden}
            wifiSsidId={wifiSsidId}
            wifiPassId={wifiPassId}
            wifiEncryptionId={wifiEncryptionId}
            vCardVersion={vCardVersion}
            setVCardVersion={setVCardVersion}
            vCardLastName={vCardLastName}
            setVCardLastName={setVCardLastName}
            vCardFirstName={vCardFirstName}
            setVCardFirstName={setVCardFirstName}
            vCardNickname={vCardNickname}
            setVCardNickname={setVCardNickname}
            vCardOrg={vCardOrg}
            setVCardOrg={setVCardOrg}
            vCardDept={vCardDept}
            setVCardDept={setVCardDept}
            vCardTitle={vCardTitle}
            setVCardTitle={setVCardTitle}
            vCardPhone={vCardPhone}
            setVCardPhone={setVCardPhone}
            vCardWorkPhone={vCardWorkPhone}
            setVCardWorkPhone={setVCardWorkPhone}
            vCardEmail={vCardEmail}
            setVCardEmail={setVCardEmail}
            vCardUrl={vCardUrl}
            setVCardUrl={setVCardUrl}
            vCardAddress={vCardAddress}
            setVCardAddress={setVCardAddress}
            vCardBday={vCardBday}
            setVCardBday={setVCardBday}
            vCardLastNameId={vCardLastNameId}
            vCardFirstNameId={vCardFirstNameId}
            vCardNicknameId={vCardNicknameId}
            vCardOrgId={vCardOrgId}
            vCardDeptId={vCardDeptId}
            vCardTitleId={vCardTitleId}
            vCardPhoneId={vCardPhoneId}
            vCardWorkPhoneId={vCardWorkPhoneId}
            vCardEmailId={vCardEmailId}
            vCardUrlId={vCardUrlId}
            vCardAddressId={vCardAddressId}
            vCardBdayId={vCardBdayId}
            eventSummary={eventSummary}
            setEventSummary={setEventSummary}
            eventStart={eventStart}
            setEventStart={setEventStart}
            eventEnd={eventEnd}
            setEventEnd={setEventEnd}
            eventTimezone={eventTimezone}
            setEventTimezone={setEventTimezone}
            eventLocation={eventLocation}
            setEventLocation={setEventLocation}
            eventDescription={eventDescription}
            setEventDescription={setEventDescription}
            eventSummaryId={eventSummaryId}
            eventStartId={eventStartId}
            eventEndId={eventEndId}
            eventTimezoneId={eventTimezoneId}
            eventLocationId={eventLocationId}
            eventDescriptionId={eventDescriptionId}
            emailTo={emailTo}
            setEmailTo={setEmailTo}
            emailSubject={emailSubject}
            setEmailSubject={setEmailSubject}
            emailBody={emailBody}
            setEmailBody={setEmailBody}
            emailToId={emailToId}
            emailSubjectId={emailSubjectId}
            emailBodyId={emailBodyId}
            smsPhone={smsPhone}
            setSmsPhone={setSmsPhone}
            smsBody={smsBody}
            setSmsBody={setSmsBody}
            smsPhoneId={smsPhoneId}
            smsBodyId={smsBodyId}
            telPhone={telPhone}
            setTelPhone={setTelPhone}
            telPhoneId={telPhoneId}
          />

          <StyleAndColorSettings
            t={t}
            dotsType={dotsType}
            setDotsType={setDotsType}
            cornersSquare={cornersSquare}
            setCornersSquare={setCornersSquare}
            cornersDot={cornersDot}
            setCornersDot={setCornersDot}
            bgColor={bgColor}
            setBgColor={setBgColor}
            bgTransparent={bgTransparent}
            setBgTransparent={setBgTransparent}
            bgColorId={bgColorId}
            errorCorrection={errorCorrection}
            setErrorCorrection={setErrorCorrection}
            errorCorrectionId={errorCorrectionId}
            logoBase64={logoBase64}
            useGradient={useGradient}
            setUseGradient={setUseGradient}
            gradientType={gradientType}
            setGradientType={setGradientType}
            gradientTypeId={gradientTypeId}
            color1={color1}
            setColor1={setColor1}
            color2={color2}
            setColor2={setColor2}
            gradientRotation={gradientRotation}
            setGradientRotation={setGradientRotation}
            singleColor={singleColor}
            setSingleColor={setSingleColor}
          />

          <LogoUploader
            t={t}
            logoBase64={logoBase64}
            logoName={logoName}
            logoSize={logoSize}
            setLogoSize={setLogoSize}
            logoSizeId={logoSizeId}
            onLogoSelected={handleLogoFile}
            onRemoveLogo={removeLogo}
          />
        </div>

        {/* 右欄：雙獨立卡片佈局 */}
        <QrPreviewCard
          t={t}
          containerRef={containerRef}
          bgTransparent={bgTransparent}
          bgColor={bgColor}
          downloadFormat={downloadFormat}
          setDownloadFormat={setDownloadFormat}
          downloadSize={downloadSize}
          setDownloadSize={setDownloadSize}
          onDownloadQr={downloadQr}
          contentType={contentType}
          computedData={getComputedData()}
          onDownloadVcf={downloadVcfFile}
          onDownloadIcs={downloadIcsFile}
          onCopyRawContent={copyRawContent}
        />
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
