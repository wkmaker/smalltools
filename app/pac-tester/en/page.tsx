import type { Metadata } from 'next';
import PacTesterClient from '../PacTesterClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'PAC Tester & Simulator - Free Online Proxy Auto-Config Sandbox Debugger',
  description:
    'Free online PAC (Proxy Auto-Config) tester and debugger. Simulate FindProxyForURL in an in-browser sandbox with step-by-step trace logs, batch regression testing, and IPv6 (isInNetEx) support.',
  keywords: 'PAC tester,PAC debugger,proxy auto config,FindProxyForURL,isInNetEx,PAC simulator,batch URL test,IPv6 PAC',
  alternates: {
    canonical: 'https://tools.cjkuo.net/pac-tester/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/pac-tester/',
      en: 'https://tools.cjkuo.net/pac-tester/en/',
      'x-default': 'https://tools.cjkuo.net/pac-tester/en/',
    },
  },
  openGraph: {
    title: 'PAC Tester & Simulator - Free Online Proxy Auto-Config Debugger',
    description: 'In-browser sandbox simulation for PAC execution with trace logs, batch regression testing, and IPv6 extensions.',
    url: 'https://tools.cjkuo.net/pac-tester/en/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PAC Tester & Simulator - Free Online Proxy Auto-Config Debugger',
    description: 'In-browser sandbox simulation for PAC execution with trace logs, batch regression testing, and IPv6 extensions.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PAC Tester & Simulator',
  url: 'https://tools.cjkuo.net/pac-tester/en/',
  description: 'Professional online visual PAC (Proxy Auto-Config) simulator and debugger with trace logs and batch verification.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'Why do we need a dedicated PAC Tester & Debugger?',
    a: `When testing a PAC file directly in operating systems or browsers (Chrome, Edge, macOS), execution is a complete black box:

① Silent Failures: If a syntax error or exception occurs, the browser silently falls back to DIRECT connection with zero console warnings.
② Aggressive Caching: Browsers cache PAC evaluations for minutes, making rule verification frustrating.
③ Hidden Rule Matches: With dozens of rules, it is difficult to see which condition intercepted a given domain.

This in-browser simulator exposes execution traces, matched conditions, and millisecond timers directly.`,
  },
  {
    q: 'How does Single URL Trace help identify shadowed rules (Dead Code)?',
    a: `FindProxyForURL executes top-down and short-circuits on the first matching return statement.

If an overly broad rule (such as a wildcard *.internal) is placed above a specific rule, the subsequent rule is shadowed (Dead Code).

The Trace timeline displays:
① The sequential invocation of PAC helpers (dnsDomainIs, isInNetEx, isPlainHostName).
② Evaluated arguments and Boolean outcomes.
③ Exactly which line triggered the return statement.`,
  },
  {
    q: 'Why is Batch Regression Testing critical before enterprise deployment?',
    a: `Enterprise networks rely on dozens of interconnected systems (GitLab, Jira, cloud services, internal VPCs, APIs).

When an IT administrator adds a new proxy rule, the primary concern is unintended side effects breaking access to existing services.

Batch Testing enables:
① Maintaining a regression suite of 20~50 representative URLs.
② Running one-click simulation in milliseconds after script changes.
③ Reviewing pass/fail status filters and exporting CSV audit reports.`,
  },
  {
    q: 'How do Mock Client IP and DNS mapping work in this simulator?',
    a: `Many corporate PAC rules route traffic conditionally based on where the client is located:
e.g. If myIpAddress() is on the 10.x LAN, connect DIRECT; if on a remote public IP, route through a secure proxy.

The Mock Context tab lets you:
① Assign simulated client IPv4 and IPv6 addresses.
② Configure custom static DNS resolutions for intranet hostnames.
This enables testing multi-site routing logic without touching your physical network settings.`,
  },
  {
    q: 'Why does my PAC evaluate to SOCKS5 in the tester, but fails in the browser?',
    a: `A PAC file only instructs the browser where to connect (e.g. "SOCKS5 127.0.0.1:1080").

If browsing fails in practice, common causes include:
① The proxy daemon (Clash, v2ray, SSH tunnel) is not listening on that port.
② Local firewall rules block local socket connections.
③ Client protocol mismatch.
Using failover fallback chains (e.g. "SOCKS5 127.0.0.1:1080; DIRECT") prevents total disconnection during proxy outages.`,
  },
  {
    q: 'How can I identify performance bottlenecks like dnsResolve blocking?',
    a: `In PAC files, excessive calls to dnsResolve() or isResolvable() create severe latency because DNS lookups run synchronously before HTTP requests can proceed.

Best practices:
① Favor zero-cost string checks (isPlainHostName, dnsDomainIs).
② Use isInNetEx for IPv6/IPv4 CIDR prefix checks.
③ Monitor executionTimeMs in the trace; evaluations taking >5ms indicate excessive synchronous operations.`,
  },
]);

export default function PacTesterEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PacTesterClient lang="en" />
    </>
  );
}
