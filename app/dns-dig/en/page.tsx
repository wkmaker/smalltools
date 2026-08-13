import type { Metadata } from 'next';
import DnsDigClient from '../DnsDigClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Online DNS DIG Tool - Free Cloudflare & Google DoH DNS Record Lookup',
  description:
    'Free online DNS DIG lookup tool! Query A, AAAA, CNAME, MX, TXT, NS, HTTPS records instantly using Cloudflare, Google, and AliDNS over HTTPS (DoH) APIs.',
  keywords: 'DNS Lookup, DIG Tool, DNS Records, Cloudflare DoH, Google DoH, Domain Diagnostics, MX Record Lookup',
  alternates: {
    canonical: 'https://tools.cjkuo.net/dns-dig/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/dns-dig/',
      en: 'https://tools.cjkuo.net/dns-dig/en/',
      'x-default': 'https://tools.cjkuo.net/dns-dig/en/',
    },
  },
  openGraph: {
    title: 'Online DNS DIG Tool - Free Cloudflare & Google DoH DNS Record Lookup',
    description: 'Essential online DNS lookup tool for engineers. Supports Cloudflare/Google DoH, domain parsing, and RFC 9460 decoding.',
    url: 'https://tools.cjkuo.net/dns-dig/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Online DNS DIG Tool - Free Cloudflare & Google DoH DNS Record Lookup',
    description: 'Essential online DNS lookup tool for engineers. Supports Cloudflare/Google DoH, domain parsing, and RFC 9460 decoding.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Online DNS DIG Tool',
  url: 'https://tools.cjkuo.net/dns-dig/en/',
  description: 'Free online DNS DIG diagnostic tool querying DNS over HTTPS (DoH) APIs for instant domain record lookup.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is DNS over HTTPS (DoH), and how does it differ from traditional DNS?',
    a: 'Traditional DNS queries use unencrypted UDP/TCP port 53 in plaintext, vulnerable to ISP eavesdropping and DNS spoofing/hijacking. DoH (RFC 8484) encrypts DNS queries inside TLS tunnels over HTTPS (port 443), dramatically enhancing privacy while bypassing firewalls blocking port 53. Our tool supports switching between Cloudflare (1.1.1.1), Google (8.8.8.8), and AliDNS endpoints instantly.',
  },
  {
    q: 'What do common DNS record types (A, AAAA, CNAME, MX, TXT, NS, CAA) mean?',
    a: `Common DNS record types and functions:

① A Record: Maps a domain name to an IPv4 address (e.g. 192.0.2.1).
② AAAA Record: Maps a domain name to an IPv6 address (e.g. 2001:db8::1).
③ CNAME Record: Canonical Name alias pointing one domain to another target domain.
④ MX Record: Mail Exchange record specifying email servers and priority for the domain.
⑤ TXT Record: Text record used for SPF, DKIM, DMARC email authentication, and domain verification.
⑥ NS Record: Identifies the authoritative name servers hosting DNS for the domain.
⑦ CAA Record: Certificate Authority Authorization specifying which CAs can issue SSL certs for the domain.`,
  },
  {
    q: 'What is DNS Propagation and TTL?',
    a: 'TTL (Time To Live) is the number of seconds DNS resolvers cache a record (e.g. TTL=300 means 5 minutes). When updating DNS records, global ISPs and resolvers gradually refresh old cached data over 5 minutes to 48 hours—a process known as DNS Propagation. Our tool displays the remaining TTL seconds for every query response.',
  },
  {
    q: 'Why can\'t A and CNAME records coexist on the apex/root domain (@)?',
    a: 'According to RFC 1034, a CNAME record claims full alias authority over a node, prohibiting coexisting records of any other type (such as MX or SOA). Since root domains (example.com) must contain SOA and NS records, CNAME cannot exist at the root. Solution: Use Cloudflare CNAME Flattening or ALIAS records.',
  },
  {
    q: 'What is the new RFC 9460 HTTPS / SVCB record, and why don\'t legacy dig tools display it properly?',
    a: 'HTTPS (TYPE 65) and SVCB (TYPE 64) are modern IETF specifications enabling browsers to retrieve HTTP/3, QUIC, ALPN protocols, and Encrypted Client Hello (ECH) parameters directly from DNS before establishing HTTP connections. Legacy command-line dig tools output raw hexadecimal TYPE65 blobs, whereas our tool includes a built-in RFC 9460 binary decoder to render human-readable parameters.',
  },
  {
    q: 'How does this tool query DNS records? Does it use intermediate third-party servers?',
    a: `Queries are sent 100% directly from your own browser via HTTP/2 to official DoH endpoints (Cloudflare 1.1.1.1 or Google 8.8.8.8), completely bypassing any intermediate third-party proxy servers (No Third-Party Proxy Server)!

Key advantages:
① Direct Browser-to-DNS Connection: Queries travel straight from your client IP to official DNS servers without intermediate interception or data logging.
② Zero Proxy Caching: No intermediate server caching, allowing you to verify DNS changes immediately after saving them at your registrar.
③ Complete Privacy Guarantee: Our servers never store, log, or track your queried domains or IP history.`,
  },
  {
    q: 'Why didn\'t my DNS update take effect immediately after updating records at my registrar (GoDaddy, Cloudflare, Namecheap)?',
    a: `Delayed DNS updates are typically caused by four primary factors:

① Unexpired TTL (Cache Timeout):
Before your change, the old DNS record was cached by global ISPs and resolvers. You must wait until the old TTL seconds count down to zero (e.g. 300s or 86400s) before resolvers request fresh records.

② Local OS & Browser DNS Caching:
Your local operating system and browser (Chrome/Safari) maintain their own DNS cache:
- Windows: Run ipconfig /flushdns in Command Prompt.
- Mac: Run sudo dscacheutil -flushcache in Terminal.
- Try opening an Incognito window or testing via mobile cellular network (4G/5G).

③ Nameserver (NS) Delegation Changes:
If you recently changed your DNS provider (e.g. updating NS records to Cloudflare), TLD-level delegation updates take 24 to 48 hours to fully propagate globally.

④ Authoritative Cluster Synchronization:
Some DNS providers require a few seconds to minutes for changes to sync across all internal cluster nodes after saving. You can switch between Cloudflare DoH and Google DoH in this tool to cross-verify propagation status!`,
  },
]);

export default function DnsDigEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <DnsDigClient lang="en" />
    </>
  );
}
