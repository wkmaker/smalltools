import type { Metadata } from 'next';
import HttpsDnsGeneratorClient from '../HttpsDnsGeneratorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'DNS HTTPS Record (Type 65) Generator & Tutorial - Free Online DNS Tool',
  description:
    'Free online DNS HTTPS (Type 65 / RFC 9460) record generator and setup tutorial. Supports Service Mode and Alias Mode with ALPN, ipv4hint, ipv6hint, port, and ECH parameters.',
  keywords: 'DNS HTTPS record generator, Type 65, RFC 9460, SVCB, Cloudflare HTTPS record, ALPN, ipv4hint, ipv6hint, DNS tutorial',
  alternates: {
    canonical: 'https://tools.cjkuo.net/https-dns-generator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/https-dns-generator/',
      en: 'https://tools.cjkuo.net/https-dns-generator/en/',
      'x-default': 'https://tools.cjkuo.net/https-dns-generator/en/',
    },
  },
  openGraph: {
    title: 'DNS HTTPS Record (Type 65) Generator & Tutorial',
    description: 'Interactive generator for standard RFC 9460 DNS HTTPS (Type 65) records with provider guides.',
    url: 'https://tools.cjkuo.net/https-dns-generator/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DNS HTTPS Record (Type 65) Generator & Tutorial',
    description: 'Interactive generator for standard RFC 9460 DNS HTTPS (Type 65) records with provider guides.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'DNS HTTPS Record (Type 65) Generator',
  url: 'https://tools.cjkuo.net/https-dns-generator/en/',
  description: 'Online visual DNS HTTPS (Type 65 / RFC 9460) record generator and provider configuration guide.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is a DNS HTTPS Record (Type 65 / RFC 9460) and what problems does it solve?',
    a: 'The DNS HTTPS record (Resource Record Type 65) is a next-generation standard standardized in RFC 9460 (a specialized form of SVCB for HTTPS):\n\n① Consolidated Protocol Discovery & IP Resolution:\nHistorically, clients queried A/AAAA records first and negotiated HTTP/2 or HTTP/3 later via Alt-Svc headers. HTTPS records allow clients to retrieve IP addresses, supported application protocols (ALPN), custom ports, and ECH public keys in a single initial DNS lookup.\n\n② Apex Domain Aliasing:\nOvercomes the classic RFC 1034 limitation prohibiting CNAME records at the domain root (Zone Apex).',
  },
  {
    q: 'What is the difference between Service Mode and Alias Mode in HTTPS records?',
    a: 'The behavior is governed by the SvcPriority field:\n\n① Alias Mode (Priority = 0):\nWhen SvcPriority is 0, the record acts as a CNAME-like alias to a TargetName. It safely functions at the domain root (Zone Apex) while directing the client to query HTTPS records at the target.\n\n② Service Mode (Priority ≥ 1):\nLower priority numbers take precedence. In this mode, developers can bind SvcParams (such as `alpn="h2,h3"`, `port=8443`, `ipv4hint`) instructing the client to initiate the optimal connection directly.',
  },
  {
    q: 'How does an HTTPS record accelerate HTTP/3 (QUIC) and eliminate 0-RTT negotiation delays?',
    a: 'Speed gains stem from upfront protocol knowledge during DNS resolution:\n\n① Eliminating Alt-Svc Round Trips:\nPreviously, first-time visitors connected over TCP/TLS first and only discovered HTTP/3 after receiving an `Alt-Svc: h3=":443"` header from the origin server.\n\n② Direct UDP QUIC Handshake:\nWith `alpn="h3,h2"` declared in the DNS HTTPS record, modern browsers (Chrome, Safari, Firefox) immediately initiate UDP QUIC on the very first packet, saving a full round-trip delay.',
  },
  {
    q: 'What are `ipv4hint` and `ipv6hint`, and how do they improve latency?',
    a: 'IP Hint parameters provide cached IP hints inside the HTTPS record payload:\n\n① Reducing Extra DNS Round-Trips:\nWhen the TargetName points to an external CDN hostname, clients typically require secondary A/AAAA lookups. `ipv4hint` and `ipv6hint` supply fallback IP addresses for immediate concurrent connection attempts.\n\n② Strict Security Compliance:\nRFC 9460 mandates that clients still asynchronously validate authoritative A/AAAA records, preserving both low latency and DNS integrity.',
  },
  {
    q: 'How does the HTTPS record enable Encrypted Client Hello (ECH) privacy protection?',
    a: 'ECH represents a major TLS 1.3 privacy enhancement:\n\n① Masking the Server Name Indication (SNI):\nTraditional TLS handshakes expose the requested domain name in plaintext Client Hello packets, enabling eavesdroppers and transit ISPs to inspect browsing habits.\n\n② Distributing ECH Keys via DNS:\nOrigin servers publish their cryptographic public keys via the `ech="Base64..."` SvcParam. The browser encrypts the entire inner Client Hello before transmission, completely sealing SNI leaks.',
  },
  {
    q: 'Why can HTTPS records be configured at the Root Domain (Zone Apex) where CNAME fails?',
    a: 'It resolves a fundamental DNS specification conflict:\n\n① CNAME Exclusivity Rule:\nDNS standards require SOA and NS records at the root domain (`example.com`), and CNAME records cannot coexist with any other record type.\n\n② Alias Mode Compatibility:\nAs an independent record type, Priority 0 HTTPS Alias records comfortably coexist with SOA, NS, and MX records, offering standard cross-provider root aliasing.',
  },
  {
    q: 'How do Cloudflare, AWS Route 53, and BIND 9 differ when creating HTTPS records?',
    a: 'DNS providers accommodate HTTPS records across varying interface designs:\n\n① Cloudflare DNS:\nProvides a dedicated 4-field modal (Name, Priority, Target, Value/SvcParams) for structured entry.\n\n② AWS Route 53:\nAllows pasting the full RFC 9460 presentation parameter string directly into the single value field (e.g. `1 . alpn="h2,h3"`).\n\n③ BIND 9 / NSD Zone Files:\nStandard single-line record format: `@ IN HTTPS 1 . alpn="h2,h3" ipv4hint=203.0.113.1`. This generator provides copy-ready syntax for all target environments.',
  },
  {
    q: 'Why do some raw DNS responses look like hex or gibberish, while this tool displays them normally?',
    a: 'Difference between wire format encoding and RFC 9460 presentation parsing:\n\n① Wire Format vs Unknown RR Types:\nUnder RFC 9460, HTTPS records (Type 65) transmit binary Key-Value pairs. Older DNS resolvers or legacy command-line tools (such as un-updated `dig TYPE65`) lack native Type 65 parsers, falling back to RFC 3597 unknown record output (e.g. `\\# 22 00010000010005026832...`) which looks like garbled hexadecimal data.\n\n② Native RFC 9460 Presentation Decoder:\nThis tool features a built-in RFC 9460 parsing engine that decodes raw binary attributes into human-readable parameters (ALPNs, IP Hints, ECH keys) and formats them for major cloud providers.',
  },
]);

export default function HttpsDnsGeneratorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <HttpsDnsGeneratorClient lang="en" />
    </>
  );
}
