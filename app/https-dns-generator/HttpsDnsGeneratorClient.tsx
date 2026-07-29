'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import styles from './https-dns-generator.module.css';

interface Props {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: 'DNS HTTPS 紀錄 (Type 65) 設定產生器',
    subtitle: 'RFC 9460 TYPE 65 GENERATOR',
    description:
      '免費線上 DNS HTTPS (Type 65) 紀錄產生器與設定教學。支援 RFC 9460 規範之服務模式 (Service Mode) 與別名模式 (Alias Mode)，透過視覺化勾選與填空即時生成 ALPN、ipv4hint、ipv6hint、port 等參數，並提供 Cloudflare、AWS Route53 等代管商對照填寫指南。',
    configTitle: '設定參數 (勾選與填空)',
    presetTitle: '常用預設情境 (點擊快速帶入)：',
    presetStandard: 'HTTP/2 + HTTP/3 (推薦)',
    presetAlias: 'Apex 域名別名 (Priority 0)',
    presetPort: '自訂 Port (8443) + IP Hint',
    presetReset: '重置預設',
    modeLabel: '運作模式 (Mode)',
    serviceMode: 'Service Mode (優先權 > 0)',
    aliasMode: 'Alias Mode (優先權 = 0)',
    hostLabel: '名稱 (Host / Subdomain)',
    ttlLabel: 'TTL 時間 (秒)',
    priorityLabel: '優先權 (Priority)',
    targetLabel: '目標主機 (TargetName)',
    paramsSection: 'SvcParams 服務參數配置',
    alpnLabel: 'ALPN 支援應用協定 (可多選)：',
    portLabel: '埠號 (Port)',
    echLabel: 'Encrypted Client Hello (ech) Base64',
    copyShareBtn: '複製帶參數之分享連結',
    fullRecordTitle: '完整 BIND / RFC 9460 格式紀錄',
    copyRecordBtn: '一鍵複製',
    coreFieldsTitle: 'DNS 管理介面【4大核心欄位】對照表',
    nameField: '1. 名稱 (Name / Host)',
    nameDesc: '子網域或 `@` (根網域)。',
    prioField: '2. 優先權 (Priority)',
    prioDesc: '`0` 代表別名模式；`1` 以上代表服務模式。',
    targetField: '3. 目標 (TargetName)',
    targetDesc: '填寫 `.` 代表本網域本身。',
    valueField: '4. 內容 / 值 (Value / SvcParams)',
    valueDesc: '包含 alpn, port, ip 等服務參數。',
    guideTitle: '各大 DNS 代管商填寫指南',
    copyBtn: '複製',
    presetLoadedStandard: '已載入標準 HTTP/2 + HTTP/3 預設情境',
    presetLoadedAlias: '已載入 Apex 域名別名 (Priority 0) 預設情境',
    presetLoadedPort: '已載入自訂 Port (8443) + IP Hint 預設情境',
    presetCleared: '已重置設定欄位',
    copiedText: '已複製',
    copiedShare: '已複製帶參數之分享連結！',
    emptyVal: '(空)',
    cfTitle: 'Cloudflare DNS 設定說明：',
    select: '選擇',
    enter: '輸入',
    leaveEmpty: '(留空)',
    r53Title: 'AWS Route53 設定說明：',
    enterFullLine: '輸入完整單行',
    gcdnsTitle: 'Google Cloud DNS 設定說明：',
    subdomainOrEmpty: '輸入子網域或留空',
    pasteFullValue: '貼上完整紀錄值',
    bindTitle: 'BIND 9 Zone File 設定說明：',
    bindDesc: '將以下這行直接加入 Zone 檔中：',
  },
  en: {
    title: 'DNS HTTPS Record (Type 65) Generator',
    subtitle: 'RFC 9460 TYPE 65 GENERATOR',
    description:
      'Free online DNS HTTPS (Type 65) record generator based on RFC 9460. Visually generate Service Mode and Alias Mode records with ALPN, IP hints, port, and step-by-step DNS provider tutorials.',
    configTitle: 'Configuration & Presets',
    presetTitle: 'Quick Presets (Click to load):',
    presetStandard: 'HTTP/2 + HTTP/3 (Recommended)',
    presetAlias: 'Apex Domain Alias (Priority 0)',
    presetPort: 'Custom Port (8443) + IP Hint',
    presetReset: 'Reset',
    modeLabel: 'Mode',
    serviceMode: 'Service Mode (Priority > 0)',
    aliasMode: 'Alias Mode (Priority = 0)',
    hostLabel: 'Host / Name',
    ttlLabel: 'TTL (Sec)',
    priorityLabel: 'Priority',
    targetLabel: 'TargetName',
    paramsSection: 'SvcParams Parameters',
    alpnLabel: 'ALPN Protocols:',
    portLabel: 'Port',
    echLabel: 'Encrypted Client Hello (ech)',
    copyShareBtn: 'Copy Shareable Link with Parameters',
    fullRecordTitle: 'Full BIND / RFC 9460 Record',
    copyRecordBtn: 'Copy Full Record',
    coreFieldsTitle: 'DNS Admin Panel [4 Core Fields] Breakdown',
    nameField: '1. Name / Host',
    nameDesc: 'Subdomain or `@` (root domain).',
    prioField: '2. Priority (SvcPriority)',
    prioDesc: '0 = Alias Mode; >=1 = Service Mode.',
    targetField: '3. Target (TargetName)',
    targetDesc: '`.` means self domain.',
    valueField: '4. Value / Content (SvcParams)',
    valueDesc: 'SvcParams options (alpn, port, ip).',
    guideTitle: 'DNS Provider Tutorials & Guides',
    copyBtn: 'Copy',
    presetLoadedStandard: 'Loaded standard HTTP/2 + HTTP/3 preset',
    presetLoadedAlias: 'Loaded Apex Domain Alias preset',
    presetLoadedPort: 'Loaded Custom Port (8443) preset',
    presetCleared: 'Reset all fields',
    copiedText: 'Copied',
    copiedShare: 'Copied share URL!',
    emptyVal: '(empty)',
    cfTitle: 'Cloudflare DNS Instructions:',
    select: 'Select',
    enter: 'Enter',
    leaveEmpty: '(leave empty)',
    r53Title: 'AWS Route53 Instructions:',
    enterFullLine: 'Enter full single line',
    gcdnsTitle: 'Google Cloud DNS Instructions:',
    subdomainOrEmpty: 'Enter subdomain or leave empty',
    pasteFullValue: 'Paste full record value',
    bindTitle: 'BIND 9 Zone File Instructions:',
    bindDesc: 'Add the following line directly into your Zone file:',
  },
};

export default function HttpsDnsGeneratorClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  const [mode, setMode] = useState<'service' | 'alias'>('service');
  const [host, setHost] = useState<string>('@');
  const [ttl, setTtl] = useState<number>(300);
  const [priority, setPriority] = useState<number>(1);
  const [target, setTarget] = useState<string>('.');
  const [alpnH3, setAlpnH3] = useState<boolean>(true);
  const [alpnH2, setAlpnH2] = useState<boolean>(true);
  const [alpnH1, setAlpnH1] = useState<boolean>(false);
  const [ipv4hint, setIpv4hint] = useState<string>('');
  const [ipv6hint, setIpv6hint] = useState<string>('');
  const [port, setPort] = useState<string>('');
  const [noDefaultAlpn, setNoDefaultAlpn] = useState<boolean>(false);
  const [ech, setEch] = useState<string>('');
  const [activeProvider, setActiveProvider] = useState<'cf' | 'r53' | 'gcdns' | 'bind'>('cf');

  const [toast, setToast] = useState<string>('');

  const hostInputId = useId();
  const ttlInputId = useId();
  const priorityInputId = useId();
  const targetInputId = useId();
  const ipv4InputId = useId();
  const ipv6InputId = useId();
  const portInputId = useId();
  const echInputId = useId();

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f0ff');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 240, 255, 0.6)');
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const applyPreset = (type: 'standard' | 'alias' | 'custom-port' | 'clear') => {
    if (type === 'standard') {
      setMode('service');
      setHost('@');
      setPriority(1);
      setTarget('.');
      setAlpnH3(true);
      setAlpnH2(true);
      setAlpnH1(false);
      setIpv4hint('');
      setIpv6hint('');
      setPort('');
      setNoDefaultAlpn(false);
      setEch('');
      showToast(t.presetLoadedStandard);
    } else if (type === 'alias') {
      setMode('alias');
      setHost('@');
      setPriority(0);
      setTarget('target.example.com');
      showToast(t.presetLoadedAlias);
    } else if (type === 'custom-port') {
      setMode('service');
      setHost('app');
      setPriority(1);
      setTarget('.');
      setAlpnH3(true);
      setAlpnH2(true);
      setIpv4hint('198.51.100.1');
      setPort('8443');
      showToast(t.presetLoadedPort);
    } else if (type === 'clear') {
      setMode('service');
      setHost('@');
      setTtl(300);
      setPriority(1);
      setTarget('.');
      setAlpnH3(false);
      setAlpnH2(false);
      setAlpnH1(false);
      setIpv4hint('');
      setIpv6hint('');
      setPort('');
      setNoDefaultAlpn(false);
      setEch('');
      showToast(t.presetCleared);
    }
  };

  const generateParams = useCallback(() => {
    if (mode === 'alias') return '';

    const params: string[] = [];
    const alpnList: string[] = [];

    if (alpnH3) alpnList.push('h3');
    if (alpnH2) alpnList.push('h2');
    if (alpnH1) alpnList.push('http/1.1');
    if (alpnList.length > 0) {
      params.push(`alpn="${alpnList.join(',')}"`);
    }

    if (noDefaultAlpn) {
      params.push('no-default-alpn');
    }

    if (port && !isNaN(parseInt(port))) {
      params.push(`port=${port}`);
    }

    if (ipv4hint.trim()) {
      params.push(`ipv4hint="${ipv4hint.trim()}"`);
    }

    if (ipv6hint.trim()) {
      params.push(`ipv6hint="${ipv6hint.trim()}"`);
    }

    if (ech.trim()) {
      params.push(`ech="${ech.trim()}"`);
    }

    return params.join(' ');
  }, [mode, alpnH3, alpnH2, alpnH1, noDefaultAlpn, port, ipv4hint, ipv6hint, ech]);

  const svcParamsValue = generateParams();

  const fullBindRecord = `${host || '@'}. ${ttl || 300} IN HTTPS ${mode === 'alias' ? 0 : priority} ${
    target.trim() || '.'
  } ${svcParamsValue}`.trim();

  const copyText = (textVal: string, label: string) => {
    navigator.clipboard.writeText(textVal).then(() => showToast(`${t.copiedText} ${label}`));
  };

  const copyShareUrl = () => {
    const params = new URLSearchParams();
    params.set('mode', mode);
    params.set('host', host);
    params.set('priority', priority.toString());
    params.set('target', target);
    if (alpnH3) params.set('h3', '1');
    if (alpnH2) params.set('h2', '1');
    if (ipv4hint) params.set('v4', ipv4hint);
    if (ipv6hint) params.set('v6', ipv6hint);
    if (port) params.set('port', port);
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl).then(() => showToast(t.copiedShare));
  };

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#00f0ff"
      accentGlow="rgba(0, 240, 255, 0.6)"
    >
      {/* 雙語切換按鈕 */}
      <div className="flex justify-end mb-6">
        <Link
          href={lang === 'en' ? '/https-dns-generator/' : '/https-dns-generator/en/'}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-all flex items-center gap-1.5"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          {lang === 'en' ? '繁體中文' : 'English'}
        </Link>
      </div>

      <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
        {/* 左欄：設定參數 (勾選與填空) */}
        <div className={styles.cardPanel}>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00f0ff] dark:text-[#00f0ff] uppercase tracking-[1px]">
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M7 2v11h3v9l7-12h-4l4-8z" />
            </svg>
            <span className={styles.accentText}>{t.configTitle}</span>
          </div>

          {/* 常用預設情境 Chips */}
          <div className={styles.innerPanel}>
            <span className="text-xs text-text-sub font-semibold">{t.presetTitle}</span>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => applyPreset('standard')} className={styles.presetBtn}>
                {t.presetStandard}
              </button>
              <button type="button" onClick={() => applyPreset('alias')} className={styles.presetBtn}>
                {t.presetAlias}
              </button>
              <button type="button" onClick={() => applyPreset('custom-port')} className={styles.presetBtn}>
                {t.presetPort}
              </button>
              <button type="button" onClick={() => applyPreset('clear')} className={styles.presetBtn}>
                {t.presetReset}
              </button>
            </div>
          </div>

          {/* 模式切換 */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text-sub uppercase tracking-[1px]">{t.modeLabel}</span>
            <div className="grid grid-cols-2 gap-2 bg-select-bg p-1.5 rounded-xl border border-border-glass">
              <button
                type="button"
                onClick={() => setMode('service')}
                className={`py-2 px-3 text-sm rounded-lg cursor-pointer transition-all ${
                  mode === 'service' ? styles.toggleBtnActive : styles.toggleBtnInactive
                }`}
              >
                {t.serviceMode}
              </button>
              <button
                type="button"
                onClick={() => setMode('alias')}
                className={`py-2 px-3 text-sm rounded-lg cursor-pointer transition-all ${
                  mode === 'alias' ? styles.toggleBtnActive : styles.toggleBtnInactive
                }`}
              >
                {t.aliasMode}
              </button>
            </div>
          </div>

          {/* 基礎欄位：Host, TTL */}
          <div className="grid grid-cols-2 gap-4 border-t border-border-glass pt-4">
            <div className="flex flex-col gap-2">
              <label htmlFor={hostInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                {t.hostLabel}
              </label>
              <input
                id={hostInputId}
                type="text"
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="@"
                className={styles.inputBox}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={ttlInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                {t.ttlLabel}
              </label>
              <input
                id={ttlInputId}
                type="number"
                value={ttl}
                onChange={e => setTtl(parseInt(e.target.value) || 300)}
                className={styles.inputBox}
              />
            </div>
          </div>

          {/* 基礎欄位：Priority, TargetName */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor={priorityInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                {t.priorityLabel}
              </label>
              <input
                id={priorityInputId}
                type="number"
                disabled={mode === 'alias'}
                value={mode === 'alias' ? 0 : priority}
                onChange={e => setPriority(parseInt(e.target.value) || 1)}
                className={`${styles.inputBox} disabled:opacity-50`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={targetInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                {t.targetLabel}
              </label>
              <input
                id={targetInputId}
                type="text"
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="."
                className={styles.inputBox}
              />
            </div>
          </div>

          {/* SvcParams (Service Mode 專屬參數) */}
          {mode === 'service' && (
            <div className="flex flex-col gap-5 border-t border-border-glass pt-4">
              <span className={`text-sm font-semibold ${styles.accentText}`}>{t.paramsSection}</span>

              {/* ALPN 協定 */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-sub">{t.alpnLabel}</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-text-main cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alpnH3}
                      onChange={e => setAlpnH3(e.target.checked)}
                      className="accent-[#00f0ff]"
                    />
                    HTTP/3 (h3)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-text-main cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alpnH2}
                      onChange={e => setAlpnH2(e.target.checked)}
                      className="accent-[#00f0ff]"
                    />
                    HTTP/2 (h2)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-text-main cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alpnH1}
                      onChange={e => setAlpnH1(e.target.checked)}
                      className="accent-[#00f0ff]"
                    />
                    HTTP/1.1 (http/1.1)
                  </label>
                </div>
              </div>

              {/* IP Hints */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor={ipv4InputId} className="text-sm font-medium text-text-sub">
                    ipv4hint
                  </label>
                  <input
                    id={ipv4InputId}
                    type="text"
                    value={ipv4hint}
                    onChange={e => setIpv4hint(e.target.value)}
                    placeholder="198.51.100.1, 198.51.100.2"
                    className={styles.inputBox}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor={ipv6InputId} className="text-sm font-medium text-text-sub">
                    ipv6hint
                  </label>
                  <input
                    id={ipv6InputId}
                    type="text"
                    value={ipv6hint}
                    onChange={e => setIpv6hint(e.target.value)}
                    placeholder="2001:db8::1"
                    className={styles.inputBox}
                  />
                </div>
              </div>

              {/* Port & No default ALPN */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor={portInputId} className="text-sm font-medium text-text-sub">
                    {t.portLabel}
                  </label>
                  <input
                    id={portInputId}
                    type="number"
                    value={port}
                    onChange={e => setPort(e.target.value)}
                    placeholder="443"
                    className={styles.inputBox}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs text-text-sub cursor-pointer py-2 font-medium">
                    <input
                      type="checkbox"
                      checked={noDefaultAlpn}
                      onChange={e => setNoDefaultAlpn(e.target.checked)}
                      className="accent-[#00f0ff]"
                    />
                    no-default-alpn
                  </label>
                </div>
              </div>

              {/* Encrypted Client Hello (ech) */}
              <div className="flex flex-col gap-2">
                <label htmlFor={echInputId} className="text-sm font-medium text-text-sub">
                  {t.echLabel}
                </label>
                <input
                  id={echInputId}
                  type="text"
                  value={ech}
                  onChange={e => setEch(e.target.value)}
                  placeholder="e.g. AEn+CiB..."
                  className={styles.inputBox}
                />
              </div>
            </div>
          )}

          {/* 分享連結按鈕 */}
          <button
            type="button"
            onClick={copyShareUrl}
            className="w-full py-2.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] font-semibold text-sm rounded-xl cursor-pointer hover:bg-[#00f0ff] hover:text-[#030305] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
            </svg>
            <span>{t.copyShareBtn}</span>
          </button>
        </div>

        {/* 右欄：產出紀錄與 DNS 代管商填寫對照表 */}
        <div className="flex flex-col gap-6">
          {/* 完整 BIND / RFC 9460 紀錄 */}
          <div className={styles.cardPanel}>
            <div className="flex justify-between items-center border-b border-border-glass pb-3">
              <span className={`text-sm ${styles.accentText} font-semibold uppercase tracking-[1px]`}>
                {t.fullRecordTitle}
              </span>
              <button
                type="button"
                onClick={() => copyText(fullBindRecord, t.fullRecordTitle)}
                className="px-3 py-1 text-sm bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] font-semibold rounded-lg hover:bg-[#00f0ff] hover:text-[#030305] transition-all cursor-pointer"
              >
                {t.copyRecordBtn}
              </button>
            </div>
            <div className={styles.outputCode}>{fullBindRecord}</div>
          </div>

          {/* 4 大核心欄位對照表 */}
          <div className={styles.cardPanel}>
            <h3 className={`text-sm ${styles.accentText} font-semibold uppercase tracking-[1px] border-b border-border-glass pb-3`}>
              {t.coreFieldsTitle}
            </h3>

            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              {/* 1. 名稱 */}
              <div className={styles.coreCard}>
                <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                  <span>{t.nameField}</span>
                  <button
                    type="button"
                    onClick={() => copyText(host || '@', t.nameField)}
                    className={`text-xs ${styles.accentText} hover:underline cursor-pointer flex items-center gap-1`}
                  >
                    <span>{t.copyBtn}</span>
                  </button>
                </div>
                <div className="text-sm font-bold text-text-main font-mono">{host || '@'}</div>
                <span className="text-xs text-text-sub">{t.nameDesc}</span>
              </div>

              {/* 2. 優先權 */}
              <div className={styles.coreCard}>
                <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                  <span>{t.prioField}</span>
                  <button
                    type="button"
                    onClick={() => copyText((mode === 'alias' ? 0 : priority).toString(), t.prioField)}
                    className={`text-xs ${styles.accentText} hover:underline cursor-pointer flex items-center gap-1`}
                  >
                    <span>{t.copyBtn}</span>
                  </button>
                </div>
                <div className={`text-sm font-bold ${styles.accentText} font-mono`}>{mode === 'alias' ? 0 : priority}</div>
                <span className="text-xs text-text-sub">{t.prioDesc}</span>
              </div>

              {/* 3. 目標 */}
              <div className={styles.coreCard}>
                <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                  <span>{t.targetField}</span>
                  <button
                    type="button"
                    onClick={() => copyText(target.trim() || '.', t.targetField)}
                    className={`text-xs ${styles.accentText} hover:underline cursor-pointer flex items-center gap-1`}
                  >
                    <span>{t.copyBtn}</span>
                  </button>
                </div>
                <div className="text-sm font-bold text-text-main font-mono">{target.trim() || '.'}</div>
                <span className="text-xs text-text-sub">{t.targetDesc}</span>
              </div>

              {/* 4. 內容/值 */}
              <div className={styles.coreCard}>
                <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                  <span>{t.valueField}</span>
                  <button
                    type="button"
                    onClick={() => copyText(svcParamsValue || t.emptyVal, t.valueField)}
                    className={`text-xs ${styles.accentText} hover:underline cursor-pointer flex items-center gap-1`}
                  >
                    <span>{t.copyBtn}</span>
                  </button>
                </div>
                <div className={`text-xs font-bold ${styles.accentText} font-mono break-all`}>
                  {svcParamsValue || t.emptyVal}
                </div>
                <span className="text-xs text-text-sub">{t.valueDesc}</span>
              </div>
            </div>
          </div>

          {/* 各大 DNS 代管商填寫指南 Tabs */}
          <div className={styles.cardPanel}>
            <h3 className={`text-sm ${styles.accentText} font-semibold uppercase tracking-[1px]`}>{t.guideTitle}</h3>

            {/* Provider Tabs */}
            <div className="grid grid-cols-4 gap-2 bg-select-bg p-1.5 rounded-xl border border-border-glass text-sm">
              {(
                [
                  { id: 'cf', name: 'Cloudflare' },
                  { id: 'r53', name: 'AWS Route53' },
                  { id: 'gcdns', name: 'Google Cloud' },
                  { id: 'bind', name: 'BIND 9' },
                ] as const
              ).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveProvider(p.id)}
                  className={`py-1.5 rounded-lg cursor-pointer transition-all ${
                    activeProvider === p.id ? styles.toggleBtnActive : styles.toggleBtnInactive
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Guide Content Panel */}
            <div className={styles.innerPanel}>
              {activeProvider === 'cf' && (
                <>
                  <strong className="text-text-main font-semibold">{t.cfTitle}</strong>
                  <ul className="list-disc pl-5 flex flex-col gap-1 text-xs">
                    <li>
                      <strong>Type</strong>：{t.select} <code className={styles.accentText}>HTTPS</code>
                    </li>
                    <li>
                      <strong>Name</strong>：{t.enter} <code className={styles.accentText}>{host || '@'}</code>
                    </li>
                    <li>
                      <strong>Priority</strong>：{t.enter}{' '}
                      <code className={styles.accentText}>{mode === 'alias' ? 0 : priority}</code>
                    </li>
                    <li>
                      <strong>Target</strong>：{t.enter} <code className={styles.accentText}>{target.trim() || '.'}</code>
                    </li>
                    <li>
                      <strong>Value</strong>：{t.enter} <code className={styles.accentText}>{svcParamsValue || t.leaveEmpty}</code>
                    </li>
                  </ul>
                </>
              )}

              {activeProvider === 'r53' && (
                <>
                  <strong className="text-text-main font-semibold">{t.r53Title}</strong>
                  <ul className="list-disc pl-5 flex flex-col gap-1 text-xs">
                    <li>
                      <strong>Record type</strong>：{t.select} <code className={styles.accentText}>HTTPS - Type 65</code>
                    </li>
                    <li>
                      <strong>Record name</strong>：{t.enter} <code className={styles.accentText}>{host === '@' ? '' : host}</code>
                    </li>
                    <li>
                      <strong>Value</strong>：{t.enterFullLine} <code className={styles.accentText}>{fullBindRecord}</code>
                    </li>
                  </ul>
                </>
              )}

              {activeProvider === 'gcdns' && (
                <>
                  <strong className="text-text-main font-semibold">{t.gcdnsTitle}</strong>
                  <ul className="list-disc pl-5 flex flex-col gap-1 text-xs">
                    <li>
                      <strong>Resource Record Type</strong>：{t.select} <code className={styles.accentText}>HTTPS</code>
                    </li>
                    <li>
                      <strong>DNS Name</strong>：{t.subdomainOrEmpty}
                    </li>
                    <li>
                      <strong>Canonical Data</strong>：{t.pasteFullValue} <code className={styles.accentText}>{fullBindRecord}</code>
                    </li>
                  </ul>
                </>
              )}

              {activeProvider === 'bind' && (
                <>
                  <strong className="text-text-main font-semibold">{t.bindTitle}</strong>
                  <ul className="list-disc pl-5 flex flex-col gap-1 text-xs">
                    <li>{t.bindDesc}</li>
                    <code className={`${styles.outputCode} block mt-1 font-mono`}>{fullBindRecord}</code>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] backdrop-blur-md shadow-lg z-[100]">
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}
