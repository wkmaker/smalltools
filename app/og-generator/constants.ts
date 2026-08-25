import { AspectRatio, PresetColor, PresetIcon, RatioDimension } from './types';

export const PRESET_COLORS: PresetColor[] = [
  {
    id: 'slate',
    name: 'Dark Slate',
    nameZh: '深邃岩灰',
    color1: '#0f172a',
    color2: '#1e1b4b',
    lightColor1: '#f8fafc',
    lightColor2: '#e2e8f0',
    accent: '#6366f1',
  },
  {
    id: 'cyber',
    name: 'Cyber Indigo',
    nameZh: '科技霓光',
    color1: '#030712',
    color2: '#1e1b4b',
    lightColor1: '#faf5ff',
    lightColor2: '#f3e8ff',
    accent: '#818cf8',
  },
  {
    id: 'emerald',
    name: 'Neo Emerald',
    nameZh: '極光翡翠',
    color1: '#022c22',
    color2: '#064e3b',
    lightColor1: '#f0fdf4',
    lightColor2: '#dcfce7',
    accent: '#10b981',
  },
  {
    id: 'sunset',
    name: 'Sunset Crimson',
    nameZh: '落日緋紅',
    color1: '#18181b',
    color2: '#450a0a',
    lightColor1: '#fff1f2',
    lightColor2: '#ffe4e6',
    accent: '#f43f5e',
  },
  {
    id: 'amber',
    name: 'Golden Amber',
    nameZh: '琥珀流金',
    color1: '#1c1917',
    color2: '#451a03',
    lightColor1: '#fffbeb',
    lightColor2: '#fef3c7',
    accent: '#f59e0b',
  },
  {
    id: 'sky',
    name: 'Deep Sky',
    nameZh: '深邃天空',
    color1: '#082f49',
    color2: '#0f172a',
    lightColor1: '#f0f9ff',
    lightColor2: '#e0f2fe',
    accent: '#0284c7',
  },
];

export const PRESET_ICONS: PresetIcon[] = [
  { id: 'code', label: 'Code', path: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z' },
  { id: 'sparkles', label: 'Sparkles', path: 'M12 2l1.9 5.8L20 9.8l-4.7 4.2 1.4 6-4.7-3.6-4.7 3.6 1.4-6L4 9.8l6.1-2z' },
  { id: 'rocket', label: 'Rocket', path: 'M13.13 2.87a9 9 0 0 0-8.26 8.26L2 14.07l4.93 4.93 2.94-2.87a9 9 0 0 0 8.26-8.26l1.87-5-5 1.87zM9.5 14.5l-2.5 2.5-1.5-1.5 2.5-2.5 1.5 1.5zm6-6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z' },
  { id: 'shield', label: 'Shield', path: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z' },
  { id: 'globe', label: 'Globe', path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 9h-3.8a15.4 15.4 0 0 0-1.2-5.4A8.04 8.04 0 0 1 18.9 11zM12 4c.9 1.8 1.6 4.3 1.9 7H10.1c.3-2.7 1-5.2 1.9-7zm-4.9 1.6A15.4 15.4 0 0 0 5.9 11H2.1a8.04 8.04 0 0 1 5-5.4zM2.1 13h3.8c.2 2 .7 3.8 1.2 5.4A8.04 8.04 0 0 1 2.1 13zm5 7.4c-.9-1.8-1.6-4.3-1.9-7.4h6.8c-.3 3.1-1 5.6-1.9 7.4-1-.1-2.1-.1-3 0zm6.8-.4c.5-1.6 1-3.4 1.2-5.4h3.8a8.04 8.04 0 0 1-5 5.4z' },
  { id: 'terminal', label: 'Terminal', path: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-12-3l3.5-3.5L8 8l1.4-1.4 4.9 4.9-4.9 4.9L8 15zm6 0h4v2h-4v-2z' },
];

export const RATIO_DIMENSIONS: Record<AspectRatio, RatioDimension> = {
  og: { width: 1200, height: 630, label: 'Open Graph / Facebook', desc: '1200 x 630 (1.91:1)' },
  twitter: { width: 1200, height: 675, label: 'Twitter / X', desc: '1200 x 675 (16:9)' },
  square: { width: 1080, height: 1080, label: 'Instagram / Square', desc: '1080 x 1080 (1:1)' },
  story: { width: 1080, height: 1920, label: 'Stories / Mobile', desc: '1080 x 1920 (9:16)' },
  linkedin: { width: 1200, height: 627, label: 'LinkedIn Post', desc: '1200 x 627 (1.91:1)' },
};
