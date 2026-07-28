'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import styles from './https-dns-generator.module.css';

interface Props {
  lang?: 'zh-TW' | 'en';
}

export default function HttpsDnsGeneratorClient({ lang = 'zh-TW' }: Props) {
  const [currentLang, setCurrentLang] = useState<'zh-TW' | 'en'>(lang);
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

  const isEn = currentLang === 'en';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // 預設情境按鈕帶入
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
      showToast(isEn ? 'Loaded standard HTTP/2 + HTTP/3 preset' : '已載入標準 HTTP/2 + HTTP/3 預設情境');
    } else if (type === 'alias') {
      setMode('alias');
      setHost('@');
      setPriority(0);
      setTarget('target.example.com');
      showToast(isEn ? 'Loaded Apex Domain Alias preset' : '已載入 Apex 域名別名 (Priority 0) 預設情境');
    } else if (type === 'custom-port') {
      setMode('service');
      setHost('app');
      setPriority(1);
      setTarget('.');
      setAlpnH3(true);
      setAlpnH2(true);
      setIpv4hint('198.51.100.1');
      setPort('8443');
      showToast(isEn ? 'Loaded Custom Port (8443) preset' : '已載入自訂 Port (8443) + IP Hint 預設情境');
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
      showToast(isEn ? 'Reset all fields' : '已重置設定欄位');
    }
  };

  // 生成完整 SvcParams 及 BIND 紀錄
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
    navigator.clipboard.writeText(textVal).then(() =>
      showToast(isEn ? `Copied ${label}` : `已複製 ${label}`)
    );
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
    navigator.clipboard.writeText(shareUrl).then(() =>
      showToast(isEn ? 'Copied share URL!' : '已複製帶參數之分享連結！')
    );
  };

  return (
    <ToolLayout
      title={isEn ? 'DNS HTTPS Record (Type 65) Generator' : 'DNS HTTPS 紀錄 (Type 65) 設定產生器'}
      subtitle="RFC 9460 TYPE 65 GENERATOR"
      description={
        isEn
          ? 'Free online DNS HTTPS (Type 65) record generator based on RFC 9460. Visually generate Service Mode and Alias Mode records with ALPN, IP hints, port, and step-by-step DNS provider tutorials.'
          : '免費線上 DNS HTTPS (Type 65) 紀錄產生器與設定教學。支援 RFC 9460 規範之服務模式 (Service Mode) 與別名模式 (Alias Mode)，透過視覺化勾選與填空即時生成 ALPN、ipv4hint、ipv6hint、port 等參數，並提供 Cloudflare、AWS Route53 等代管商對照填寫指南。'
      }
      accentColor="#00f0ff"
      accentGlow="rgba(0, 240, 255, 0.6)"
    >
      <div className="flex justify-end mb-6">
        <div className="flex bg-black/40 border border-white/[.08] p-1 rounded-xl gap-1">
          <Link
            href="/https-dns-generator/"
            onClick={() => setCurrentLang('zh-TW')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-all ${
              !isEn ? 'bg-[#00f0ff]/20 text-[#00f0ff] font-semibold' : 'text-text-sub hover:text-white'
            }`}
          >
            繁體中文
          </Link>
          <Link
            href="/https-dns-generator/en/"
            onClick={() => setCurrentLang('en')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-all ${
              isEn ? 'bg-[#00f0ff]/20 text-[#00f0ff] font-semibold' : 'text-text-sub hover:text-white'
            }`}
          >
            English
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
        {/* 左欄：設定參數 (勾選與填空) */}
        <div className="bg-black/20 border border-white/[.08] rounded-2xl p-8 flex flex-col gap-6 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00f0ff] uppercase tracking-[1px]">
            ⚡ {isEn ? 'Configuration & Presets' : '設定參數 (勾選與填空)'}
          </div>

          {/* 常用預設情境 Chips */}
          <div className="flex flex-col gap-2 bg-black/40 p-4 rounded-xl border border-white/[.06]">
            <span className="text-xs text-text-sub font-semibold">
              {isEn ? 'Quick Presets (Click to load):' : '常用預設情境 (點擊快速帶入)：'}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset('standard')}
                className="px-3 py-1 text-sm bg-white/[.04] border border-white/[.08] text-text-sub rounded-lg hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all cursor-pointer font-medium"
              >
                ⚡ {isEn ? 'HTTP/2 + HTTP/3 (Recommended)' : 'HTTP/2 + HTTP/3 (推薦)'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('alias')}
                className="px-3 py-1 text-sm bg-white/[.04] border border-white/[.08] text-text-sub rounded-lg hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all cursor-pointer font-medium"
              >
                🔗 {isEn ? 'Apex Domain Alias (Priority 0)' : 'Apex 域名別名 (Priority 0)'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('custom-port')}
                className="px-3 py-1 text-sm bg-white/[.04] border border-white/[.08] text-text-sub rounded-lg hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all cursor-pointer font-medium"
              >
                🔌 {isEn ? 'Custom Port (8443) + IP Hint' : '自訂 Port (8443) + IP Hint'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('clear')}
                className="px-3 py-1 text-sm bg-white/[.04] border border-white/[.08] text-text-sub rounded-lg hover:text-white transition-all cursor-pointer font-medium"
              >
                🧹 {isEn ? 'Reset' : '重置預設'}
              </button>
            </div>
          </div>

          {/* 模式切換 */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
              {isEn ? 'Mode' : '運作模式 (Mode)'}
            </span>
            <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-xl border border-white/[.08]">
              <button
                onClick={() => setMode('service')}
                className={`py-2 px-3 text-sm rounded-lg cursor-pointer transition-all border ${
                  mode === 'service'
                    ? 'bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#00f0ff] font-semibold'
                    : 'border-transparent text-text-sub hover:text-white font-medium'
                }`}
              >
                Service Mode ({isEn ? 'Priority' : '優先權'} &gt; 0)
              </button>
              <button
                onClick={() => setMode('alias')}
                className={`py-2 px-3 text-sm rounded-lg cursor-pointer transition-all border ${
                  mode === 'alias'
                    ? 'bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#00f0ff] font-semibold'
                    : 'border-transparent text-text-sub hover:text-white font-medium'
                }`}
              >
                Alias Mode ({isEn ? 'Priority' : '優先權'} = 0)
              </button>
            </div>
          </div>

          {/* 基礎欄位：Host, TTL */}
          <div className="grid grid-cols-2 gap-4 border-t border-white/[.05] pt-4">
            <div className="flex flex-col gap-2">
              <label htmlFor={hostInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                {isEn ? 'Host / Name' : '名稱 (Host / Subdomain)'}
              </label>
              <input
                id={hostInputId}
                type="text"
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="@"
                className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#00f0ff] font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={ttlInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                {isEn ? 'TTL (Sec)' : 'TTL 時間 (秒)'}
              </label>
              <input
                id={ttlInputId}
                type="number"
                value={ttl}
                onChange={e => setTtl(parseInt(e.target.value) || 300)}
                className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#00f0ff] font-mono"
              />
            </div>
          </div>

          {/* 基礎欄位：Priority, TargetName */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor={priorityInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                {isEn ? 'Priority' : '優先權 (Priority)'}
              </label>
              <input
                id={priorityInputId}
                type="number"
                disabled={mode === 'alias'}
                value={mode === 'alias' ? 0 : priority}
                onChange={e => setPriority(parseInt(e.target.value) || 1)}
                className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#00f0ff] font-mono disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={targetInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                {isEn ? 'TargetName' : '目標主機 (TargetName)'}
              </label>
              <input
                id={targetInputId}
                type="text"
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="."
                className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#00f0ff] font-mono"
              />
            </div>
          </div>

          {/* SvcParams (Service Mode 專屬參數) */}
          {mode === 'service' && (
            <div className="flex flex-col gap-5 border-t border-white/[.05] pt-4">
              <span className="text-sm font-semibold text-[#00f0ff]">SvcParams {isEn ? 'Parameters' : '服務參數配置'}</span>

              {/* ALPN 協定 */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-sub">
                  {isEn ? 'ALPN Protocols:' : 'ALPN 支援應用協定 (可多選)：'}
                </span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alpnH3}
                      onChange={e => setAlpnH3(e.target.checked)}
                      className="accent-[#00f0ff]"
                    />
                    HTTP/3 (h3)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alpnH2}
                      onChange={e => setAlpnH2(e.target.checked)}
                      className="accent-[#00f0ff]"
                    />
                    HTTP/2 (h2)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
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
                  <label htmlFor={ipv4InputId} className="text-sm font-medium text-text-sub">ipv4hint</label>
                  <input
                    id={ipv4InputId}
                    type="text"
                    value={ipv4hint}
                    onChange={e => setIpv4hint(e.target.value)}
                    placeholder="198.51.100.1, 198.51.100.2"
                    className="w-full bg-black/40 border border-white/[.08] text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-[#00f0ff] font-mono"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor={ipv6InputId} className="text-sm font-medium text-text-sub">ipv6hint</label>
                  <input
                    id={ipv6InputId}
                    type="text"
                    value={ipv6hint}
                    onChange={e => setIpv6hint(e.target.value)}
                    placeholder="2001:db8::1"
                    className="w-full bg-black/40 border border-white/[.08] text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-[#00f0ff] font-mono"
                  />
                </div>
              </div>

              {/* Port & No default ALPN */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor={portInputId} className="text-sm font-medium text-text-sub">
                    {isEn ? 'Port' : '埠號 (Port)'}
                  </label>
                  <input
                    id={portInputId}
                    type="number"
                    value={port}
                    onChange={e => setPort(e.target.value)}
                    placeholder="443"
                    className="w-full bg-black/40 border border-white/[.08] text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-[#00f0ff] font-mono"
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
                  {isEn ? 'Encrypted Client Hello (ech)' : 'Encrypted Client Hello (ech) Base64'}
                </label>
                <input
                  id={echInputId}
                  type="text"
                  value={ech}
                  onChange={e => setEch(e.target.value)}
                  placeholder="e.g. AEn+CiB..."
                  className="w-full bg-black/40 border border-white/[.08] text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-[#00f0ff] font-mono"
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
            🔗 {isEn ? 'Copy Shareable Link with Parameters' : '複製帶參數之分享連結'}
          </button>
        </div>

        {/* 右欄：產出紀錄與 DNS 代管商填寫對照表 */}
        <div className="flex flex-col gap-6">
          {/* 完整 BIND / RFC 9460 紀錄 */}
          <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-4 shadow-lg">
            <div className="flex justify-between items-center border-b border-white/[.06] pb-3">
              <span className="text-sm text-[#00f0ff] font-semibold uppercase tracking-[1px]">
                {isEn ? 'Full BIND / RFC 9460 Record' : '完整 BIND / RFC 9460 格式紀錄'}
              </span>
              <button
                onClick={() => copyText(fullBindRecord, isEn ? 'full record' : '完整紀錄')}
                className="px-3 py-1 text-sm bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] font-semibold rounded-lg hover:bg-[#00f0ff] hover:text-[#030305] transition-all cursor-pointer"
              >
                {isEn ? 'Copy Full Record' : '一鍵複製'}
              </button>
            </div>
            <div className="bg-black/50 border border-white/[.06] rounded-xl p-4 font-mono text-xs text-[#00f0ff] break-all">
              {fullBindRecord}
            </div>
          </div>

          {/* 4 大核心欄位對照表 */}
          <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-4 shadow-lg">
            <h3 className="text-sm text-[#00f0ff] font-semibold uppercase tracking-[1px] border-b border-white/[.06] pb-3">
              {isEn ? 'DNS Admin Panel [4 Core Fields] Breakdown' : 'DNS 管理介面【4大核心欄位】對照表'}
            </h3>

            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              {/* 1. 名稱 */}
              <div className="bg-black/40 border border-white/[.04] p-3.5 rounded-xl flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                  <span>1. {isEn ? 'Name / Host' : '名稱 (Name / Host)'}</span>
                  <button
                    onClick={() => copyText(host || '@', isEn ? 'Name' : '名稱')}
                    className="text-xs text-[#00f0ff] hover:underline cursor-pointer"
                  >
                    📋 {isEn ? 'Copy' : '複製'}
                  </button>
                </div>
                <div className="text-sm font-bold text-white font-mono">{host || '@'}</div>
                <span className="text-xs text-text-sub">
                  {isEn ? 'Subdomain or `@` (root domain).' : '子網域或 `@` (根網域)。'}
                </span>
              </div>

              {/* 2. 優先權 */}
              <div className="bg-black/40 border border-white/[.04] p-3.5 rounded-xl flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                  <span>2. {isEn ? 'Priority (SvcPriority)' : '優先權 (Priority)'}</span>
                  <button
                    onClick={() => copyText((mode === 'alias' ? 0 : priority).toString(), isEn ? 'Priority' : '優先權')}
                    className="text-xs text-[#00f0ff] hover:underline cursor-pointer"
                  >
                    📋 {isEn ? 'Copy' : '複製'}
                  </button>
                </div>
                <div className="text-sm font-bold text-[#00f0ff] font-mono">{mode === 'alias' ? 0 : priority}</div>
                <span className="text-xs text-text-sub">
                  {isEn ? '0 = Alias Mode; >=1 = Service Mode.' : '`0` 代表別名模式；`1` 以上代表服務模式。'}
                </span>
              </div>

              {/* 3. 目標 */}
              <div className="bg-black/40 border border-white/[.04] p-3.5 rounded-xl flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                  <span>3. {isEn ? 'Target (TargetName)' : '目標 (TargetName)'}</span>
                  <button
                    onClick={() => copyText(target.trim() || '.', isEn ? 'Target' : '目標')}
                    className="text-xs text-[#00f0ff] hover:underline cursor-pointer"
                  >
                    📋 {isEn ? 'Copy' : '複製'}
                  </button>
                </div>
                <div className="text-sm font-bold text-white font-mono">{target.trim() || '.'}</div>
                <span className="text-xs text-text-sub">
                  {isEn ? '`.` means self domain.' : '填寫 `.` 代表本網域本身。'}
                </span>
              </div>

              {/* 4. 內容/值 */}
              <div className="bg-black/40 border border-white/[.04] p-3.5 rounded-xl flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                  <span>4. {isEn ? 'Value / Content (SvcParams)' : '內容 / 值 (Value / SvcParams)'}</span>
                  <button
                    onClick={() => copyText(svcParamsValue || '(空)', isEn ? 'Value' : '內容值')}
                    className="text-xs text-[#00f0ff] hover:underline cursor-pointer"
                  >
                    📋 {isEn ? 'Copy' : '複製'}
                  </button>
                </div>
                <div className="text-xs font-bold text-[#00f0ff] font-mono break-all">{svcParamsValue || '(空)'}</div>
                <span className="text-xs text-text-sub">
                  {isEn ? 'SvcParams options (alpn, port, ip).' : '包含 alpn, port, ip 等服務參數。'}
                </span>
              </div>
            </div>
          </div>

          {/* 各大 DNS 代管商填寫指南 Tabs */}
          <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-4 shadow-lg">
            <h3 className="text-sm text-[#00f0ff] font-semibold uppercase tracking-[1px]">
              {isEn ? 'DNS Provider Tutorials & Guides' : '各大 DNS 代管商填寫指南'}
            </h3>

            {/* Provider Tabs */}
            <div className="grid grid-cols-4 gap-2 bg-black/40 p-1.5 rounded-xl border border-white/[.08] text-sm">
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
                  onClick={() => setActiveProvider(p.id)}
                  className={`py-1.5 rounded-lg cursor-pointer transition-all ${
                    activeProvider === p.id
                      ? 'bg-[#00f0ff]/20 text-[#00f0ff] font-bold'
                      : 'text-text-sub hover:text-white font-medium'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Guide Content Panel */}
            <div className="bg-black/50 border border-white/[.06] p-4 rounded-xl text-xs text-text-sub flex flex-col gap-2 leading-relaxed">
              {activeProvider === 'cf' && (
                <>
                  <strong className="text-white font-semibold">Cloudflare DNS 設定說明：</strong>
                  <ul className="list-disc pl-5 flex flex-col gap-1">
                    <li><strong>Type</strong>：選擇 <code className="text-[#00f0ff]">HTTPS</code></li>
                    <li><strong>Name</strong>：輸入 <code className="text-[#00f0ff]">{host || '@'}</code></li>
                    <li><strong>Priority</strong>：輸入 <code className="text-[#00f0ff]">{mode === 'alias' ? 0 : priority}</code></li>
                    <li><strong>Target</strong>：輸入 <code className="text-[#00f0ff]">{target.trim() || '.'}</code></li>
                    <li><strong>Value</strong>：輸入 <code className="text-[#00f0ff]">{svcParamsValue || '(留空)'}</code></li>
                  </ul>
                </>
              )}

              {activeProvider === 'r53' && (
                <>
                  <strong className="text-white font-semibold">AWS Route53 設定說明：</strong>
                  <ul className="list-disc pl-5 flex flex-col gap-1">
                    <li><strong>Record type</strong>：選擇 <code className="text-[#00f0ff]">HTTPS - Type 65</code></li>
                    <li><strong>Record name</strong>：輸入 <code className="text-[#00f0ff]">{host === '@' ? '' : host}</code></li>
                    <li><strong>Value</strong>：輸入完整單行 <code className="text-[#00f0ff]">{fullBindRecord}</code></li>
                  </ul>
                </>
              )}

              {activeProvider === 'gcdns' && (
                <>
                  <strong className="text-white font-semibold">Google Cloud DNS 設定說明：</strong>
                  <ul className="list-disc pl-5 flex flex-col gap-1">
                    <li><strong>Resource Record Type</strong>：選擇 <code className="text-[#00f0ff]">HTTPS</code></li>
                    <li><strong>DNS Name</strong>：輸入子網域或留空</li>
                    <li><strong>Canonical Data</strong>：貼上完整紀錄值 <code className="text-[#00f0ff]">{fullBindRecord}</code></li>
                  </ul>
                </>
              )}

              {activeProvider === 'bind' && (
                <>
                  <strong className="text-white font-semibold">BIND 9 Zone File 設定說明：</strong>
                  <ul className="list-disc pl-5 flex flex-col gap-1">
                    <li>將以下這行直接加入 Zone 檔中：</li>
                    <code className="text-[#00f0ff] bg-black/60 p-2 rounded block mt-1 font-mono">{fullBindRecord}</code>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] backdrop-blur-md">
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}
