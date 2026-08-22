import type { Metadata } from 'next';
import IpDetectorClient from '../IpDetectorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'My IP Address & Network Diagnostics Tool - Free IPv4/IPv6 & Cloud Latency Test',
  description:
    'Free online IP address detector & network diagnostic tool! Instant lookup for public IPv4/IPv6 address, IP geolocation, Cloudflare Trace, and latency tests for AWS, GCP, Azure, and CDNs.',
  keywords: 'My IP Address, IP Lookup, IPv4 Lookup, IPv6 Test, IP Geolocation, Network Diagnostics, Cloud Latency Test, Cloudflare Trace',
  alternates: {
    canonical: 'https://tools.cjkuo.net/ip-detector/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/ip-detector/',
      en: 'https://tools.cjkuo.net/ip-detector/en/',
      'x-default': 'https://tools.cjkuo.net/ip-detector/en/',
    },
  },
  openGraph: {
    title: 'My IP Address & Network Diagnostics Tool - Free IPv4/IPv6 & Cloud Latency Test',
    description: 'Instant public IPv4/IPv6 lookup, Cloudflare Trace analysis, IP geolocation, and cloud latency diagnostics.',
    url: 'https://tools.cjkuo.net/ip-detector/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My IP Address & Network Diagnostics Tool - Free IPv4/IPv6 & Cloud Latency Test',
    description: 'Instant public IPv4/IPv6 lookup, Cloudflare Trace analysis, IP geolocation, and cloud latency diagnostics.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'My IP Address & Diagnostics Tool',
  url: 'https://tools.cjkuo.net/ip-detector/en/',
  description: 'Free online IP address detector supporting dual-stack IPv4/IPv6 lookup, geolocation, and latency testing for major cloud providers.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is the technical difference between IPv4 and IPv6 addresses?',
    a: 'IPv4 and IPv6 represent different generations of the Internet Protocol:\n\n① IPv4 (32-bit):\nFormatted as four decimal blocks (e.g. `203.0.113.1`), yielding ~4.3 billion unique addresses globally. The IPv4 pool is completely exhausted, requiring Network Address Translation (NAT) for shared access.\n\n② IPv6 (128-bit):\nFormatted as eight hexadecimal groups (e.g. `2001:db8::1`), providing 3.4 × 10^38 addresses (virtually inexhaustible), native end-to-end encryption support, and streamlined packet routing.',
  },
  {
    q: 'Why does my device show a public IPv4 address but no IPv6 address?',
    a: 'An undetected IPv6 address usually stems from several network factors:\n\n① ISP Configuration:\nYour Internet Service Provider (ISP) may not have provisioned dual-stack IPv6 connectivity on your broadband or mobile plan.\n\n② Home Router Settings:\nMany consumer Wi-Fi routers disable IPv6 DHCP/SLAAC routing by default; enabling IPv6 in the router admin panel resolves this.\n\n③ VPN or Proxy Restrictions:\nCertain VPN providers route only IPv4 traffic and deliberately disable IPv6 to prevent DNS and IPv6 leaks.',
  },
  {
    q: 'What is Cloudflare Trace and what does the edge data center code (Colo) mean?',
    a: 'Cloudflare Trace provides live diagnostic metadata from your nearest edge node:\n\n① Colo Airport Code:\nIdentifies the nearest Cloudflare data center handling your request (e.g., TPE for Taipei, HKG for Hong Kong, NRT for Tokyo, SFO for San Francisco).\n\n② Protocol & Security:\nDetects your client TLS cipher negotiation and the highest negotiated HTTP protocol (HTTP/2 or HTTP/3 QUIC).',
  },
  {
    q: 'How does a Public IP address differ from a Private / Local IP address?',
    a: 'Their routing scopes and network boundaries differ:\n\n① Private IP (`192.168.x.x`, `10.x.x.x`, `172.16.x.x`):\nUsed exclusively inside your local home or corporate network (LAN) and cannot be directly routed across the public Internet.\n\n② Public IP:\nA globally unique address assigned by your ISP that identifies your modem or gateway to the worldwide web. This tool displays your outward-facing Public IP.',
  },
  {
    q: 'How are IP Geolocation (GeoIP) and ASN Autonomous System Numbers determined?',
    a: 'Location data is derived from global IP allocation databases (MaxMind, IPinfo):\n\n① ASN (Autonomous System Number):\nIdentifies the carrier network routing your traffic (e.g. Chunghwa Telecom AS3462, Comcast AS7922).\n\n② Accuracy Overview:\nGeolocation is generally accurate to the country and metro city level. For privacy reasons, IP geolocation does not pinpoint individual street addresses.',
  },
  {
    q: 'Why does this tool test latency to major public clouds (AWS, GCP, Azure, Cloudflare) and popular services?',
    a: 'Providing comprehensive, single-page network reachability and health diagnostics:\n\n① Unified Global Service Reachability Audit:\nEngineers and users can verify from a single dashboard whether their current network node/IP can reach major cloud infrastructure, CDNs, and critical platforms (AWS, GCP, Cloudflare, GitHub, etc.) without routing sub-optimizations or ISP throttling.\n\n② Direct Browser Requests with Full Visibility:\nAll reachability tests are executed directly from your local browser to the target cloud provider endpoints—never routed through opaque third-party proxy relays. Every single request is fully inspectable in your browser Developer Tools (Network tab), guaranteeing 100% genuine and transparent metrics.',
  },
  {
    q: 'Does this IP detection tool record, log, or track my IP history?',
    a: 'Never! We strictly enforce a zero-logging privacy policy:\n\n① Direct Client-Side Requests:\nAll IP detection and ping measurements are dispatched in real-time by your browser. No IP addresses or test results are logged, stored, or monetized on our servers.\n\n② Ephemeral Session Data:\nAll diagnostics live solely in your browser memory and are permanently cleared when you close the tab.',
  },
]);

export default function IpDetectorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <IpDetectorClient lang="en" />
    </>
  );
}
