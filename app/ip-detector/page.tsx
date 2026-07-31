import type { Metadata } from 'next';
import IpDetectorClient from './IpDetectorClient';

export const metadata: Metadata = {
  title: 'IP 檢測助手 - 免費線上 IPv4/IPv6 查詢、IP 地理位置與連線延遲診斷',
  description:
    '專業免費的線上 IP 檢測與診斷工具！即時查詢您的外網 IPv4 與 IPv6 位址、地理位置、Cloudflare 節點資訊及各大公有雲 (AWS, GCP, Azure) 連線延遲 (Latency)。',
  keywords: 'IP檢測,我的IP,IPv4查詢,IPv6查詢,IP位置,IP地理位置,連線延遲,Cloudflare Trace',
  alternates: {
    canonical: 'https://tools.cjkuo.net/ip-detector/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/ip-detector/',
      en: 'https://tools.cjkuo.net/ip-detector/en/',
      'x-default': 'https://tools.cjkuo.net/ip-detector/en/',
    },
  },
  openGraph: {
    title: 'IP 檢測助手 - 免費線上 IPv4/IPv6 查詢與連線延遲診斷',
    description: '即時檢測您的 IPv4/IPv6，解析 Cloudflare Trace 與隱私狀態，並診斷各大公有雲與 CDN 之連線延遲。',
    url: 'https://tools.cjkuo.net/ip-detector/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IP 檢測助手 - 免費線上 IPv4/IPv6 查詢與連線延遲診斷',
    description: '即時檢測您的 IPv4/IPv6，解析 Cloudflare Trace 與隱私狀態，並診斷各大公有雲與 CDN 之連線延遲。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'IP 檢測助手',
  url: 'https://tools.cjkuo.net/ip-detector/',
  description: '專業免費的網路 IP 檢測與診斷助手，支援 IPv4/IPv6 雙棧查詢與公有雲延遲量測。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function IpDetectorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <IpDetectorClient lang="zh-TW" />
    </>
  );
}
