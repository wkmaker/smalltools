import type { Metadata } from 'next';
import PrivacyClient from '../PrivacyClient';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for Smalltools (tools.cjkuo.net): 100% client-side local processing, minimal anonymized GA4 page-path analytics, local storage usage, and open-source transparency.',
  alternates: {
    canonical: 'https://tools.cjkuo.net/privacy/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/privacy/',
      en: 'https://tools.cjkuo.net/privacy/en/',
      'x-default': 'https://tools.cjkuo.net/privacy/',
    },
  },
};

export default function PrivacyEnPage() {
  return <PrivacyClient lang="en" />;
}
