import type { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: '隱私權說明',
  description:
    '工具庫（tools.cjkuo.net）隱私權說明：100% 純前端本機運算、極簡脫敏版 GA4 流量統計、本機儲存用途與開源透明承諾。',
  alternates: {
    canonical: 'https://tools.cjkuo.net/privacy/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/privacy/',
      en: 'https://tools.cjkuo.net/privacy/en/',
      'x-default': 'https://tools.cjkuo.net/privacy/',
    },
  },
};

export default function PrivacyPage() {
  return <PrivacyClient lang="zh-TW" />;
}
