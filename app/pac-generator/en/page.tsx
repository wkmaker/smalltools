import type { Metadata } from 'next';
import PacGeneratorClient from '../PacGeneratorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'PAC Script Generator - Free Online Proxy Auto-Config File Builder',
  description:
    'Free online visual PAC (Proxy Auto-Config) generator. Build routing rules, IPv4/IPv6 dual-stack subnets (isInNetEx), proxy pools, failover fallback chains, and one-click Data URI exports.',
  keywords: 'PAC generator,proxy auto config,PAC file builder,FindProxyForURL,isInNetEx,SOCKS5,HTTP proxy,failover routing',
  alternates: {
    canonical: 'https://tools.cjkuo.net/pac-generator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/pac-generator/',
      en: 'https://tools.cjkuo.net/pac-generator/en/',
      'x-default': 'https://tools.cjkuo.net/pac-generator/en/',
    },
  },
  openGraph: {
    title: 'PAC Script Generator - Free Online Proxy Auto-Config Builder',
    description: 'Visual PAC rule builder with IPv4/IPv6 dual-stack support and one-click Data URI export. 100% private in-browser generation.',
    url: 'https://tools.cjkuo.net/pac-generator/en/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PAC Script Generator - Free Online Proxy Auto-Config Builder',
    description: 'Visual PAC rule builder with IPv4/IPv6 dual-stack support and one-click Data URI export. 100% private in-browser generation.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PAC Script Generator',
  url: 'https://tools.cjkuo.net/pac-generator/en/',
  description: 'Professional online visual PAC (Proxy Auto-Config) builder with IPv4/IPv6 and multi-proxy failover chains.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What condition match modes are supported in routing rules, and when should I use them?',
    a: `The generator supports 8 matching conditions covering hostnames, domains, full URLs, IP subnets, and regular expressions:

① Plain Hostname (isPlainHostName):
Matches hostnames without any dot "." (such as http://intranet/ or http://hr/). Ideal for directing internal local intranet traffic to DIRECT bypass.

② Domain Suffix (dnsDomainIs):
Matches a specific domain and all its subdomains. For example, entering ".google.com" matches mail.google.com, drive.google.com, and the apex domain google.com.

③ Exact Hostname (localHostOrDomainIs / host ===):
Matches a single, exact hostname. For example, "api.github.com" will only match that exact host and will not affect raw.githubusercontent.com.

④ Hostname Wildcard (shExpMatch host):
Matches hostname patterns using "*" and "?". For example, "*.internal.net" or "git-*.company.com".

⑤ URL Wildcard (shExpMatch url):
Matches the complete request URL including scheme, port, and path. For example, "https://*.secure.bank/*" or "ftp://*".

⑥ IPv4 Subnet / CIDR (isInNet):
Matches destination IPv4 addresses against CIDR subnets, such as "10.0.0.0/8", "172.16.0.0/12", or "192.168.1.0/24".

⑦ IPv6 Subnet / CIDR (isInNetEx):
Uses the modern isInNetEx() function for native IPv6 CIDR prefix matching, such as enterprise ULA private subnets "fc00::/7" or "2001:db8::/32".

⑧ Regular Expression (RegEx):
Evaluates arbitrary JavaScript regular expressions against the URL or host, such as "^https?://.*\\.internal(:[0-9]+)?/", ideal for complex routing logic.`,
  },
  {
    q: 'What is the difference with "Resolve Host IP Before Subnet Check (dnsResolve)", and when should I enable it?',
    a: `This setting controls whether the PAC script forces a synchronous DNS lookup before evaluating IP subnet rules (isInNet / isInNetEx):

① Disabled (Default & Recommended for Performance):
The script outputs isInNet(host, ...).
When target URLs are IP literals (e.g., http://192.168.1.1/ or http://[fc00::1]/), subnets are matched immediately. When given standard domain names (e.g., google.com), modern browser engines handle lookups internally without triggering blocking synchronous DNS stalls.

② Enabled (Forced DNS Resolution):
The script outputs isInNet(dnsResolve(host), ...).
The browser is forced to pause and synchronously resolve every hostname to an IP address before evaluating subnet rules.

When to use:
Enable this ONLY if you are deploying to legacy runtimes (such as older WinINet components or embedded WebViews) where isInNet fails to evaluate domain names automatically. In modern environments, keep it disabled for maximum browsing speed.`,
  },
  {
    q: 'What is a PAC (Proxy Auto-Config) file and how does it work?',
    a: `A PAC (Proxy Auto-Config) file is a standard introduced by Netscape in 1996.

At its core, a PAC file contains a JavaScript function named FindProxyForURL(url, host). Whenever the operating system or browser (Chrome, Edge, Safari, Firefox) initiates a network request, it invokes this function:

① Parameters: The target request URL (url) and destination hostname (host).
② Evaluation: Rules inside the script check domains, IP subnets, or host types.
③ Return Value: A routing instruction such as "DIRECT" (bypass proxy) or "PROXY 10.0.0.1:8080" (route through proxy).

This enables seamless switching between intranet direct connections and external secure proxy channels automatically.`,
  },
  {
    q: 'How do I load a PAC file in various operating systems and browsers?',
    a: `Setup steps across common platforms:

① Windows 10 / 11:
Open Settings ➔ Network & internet ➔ Proxy ➔ In "Automatic proxy setup", toggle "Use setup script" to ON, enter your PAC URL or Data URI, and click Save.

② macOS (Sequoia / Sonoma / Ventura):
Open System Settings ➔ Network ➔ Select your active connection ➔ Details... ➔ Proxies tab ➔ Toggle "Automatic Proxy Configuration" ON ➔ Enter the PAC URL.

③ iOS / iPadOS:
Go to Settings ➔ Wi-Fi ➔ Tap the "i" info icon next to your network ➔ Scroll down to "Configure Proxy" ➔ Choose "Automatic" ➔ Paste the URL.

④ Mozilla Firefox:
Open Settings ➔ General ➔ Network Settings ➔ Click "Settings..." ➔ Select "Automatic proxy configuration URL" ➔ Enter URL and confirm.

⑤ Browser Extensions (e.g. SwitchyOmega):
Create a new "PAC Profile", paste the generated script into the code box or point to the PAC URL for immediate switching.`,
  },
  {
    q: 'What is the difference between IPv6 isInNetEx and legacy isInNet in PAC?',
    a: `The legacy PAC specification only supported 32-bit IPv4 functions (isInNet, dnsResolve, myIpAddress). Passing IPv6 addresses into traditional isInNet() will fail or throw errors in many modern browsers.

To support IPv6 dual-stack environments, Microsoft and major browser engines introduced the IPv6 PAC extensions:

① isInNetEx(host, "2001:db8::/32"): Natively supports IPv6 CIDR prefix notation as well as IPv4 subnets.
② dnsResolveEx(host): Resolves hostnames and returns a semicolon-delimited list of all IPv4 and IPv6 addresses.
③ myIpAddressEx(): Returns all IPv4 and IPv6 network interface addresses of the client.

This generator natively supports isInNetEx syntax to accommodate modern dual-stack environments.`,
  },
  {
    q: 'How do DIRECT, PROXY, and SOCKS failover fallback chains work?',
    a: `PAC allows returning multiple proxy options separated by semicolons for automatic failover:

Example: "PROXY 10.0.0.1:8080; PROXY 10.0.0.2:8080; DIRECT"

① Primary Attempt: The browser first tries to route traffic through 10.0.0.1:8080.
② Automatic Failover: If the primary proxy is unresponsive or times out, the browser transparently tries 10.0.0.2:8080.
③ Final Safeguard: If all proxies are unavailable, the browser falls back to DIRECT connection.

This ensures high availability without breaking Internet access during proxy maintenance.`,
  },
  {
    q: 'Why are certain domains still bypassing or hitting the wrong proxy?',
    a: `Common pitfalls include:

① Evaluation Order: PAC rules execute sequentially from top to bottom and exit on the first match (short-circuit). If a broad wildcard rule is placed first, subsequent specific rules will never be evaluated.
② Subdomain Matching Nuances: dnsDomainIs(host, ".google.com") only matches subdomains (like mail.google.com), not the apex domain google.com. This tool automatically accounts for apex domains in suffix rules.
③ Excessive DNS Lookups: Overusing dnsResolve() forces synchronous DNS lookups for every request. If your DNS is slow, browsing performance degrades noticeably.
④ Browser Cache: Browsers cache PAC results. After modifying rules, restart your browser or visit chrome://net-internals/#proxy to clear proxy caches.`,
  },
  {
    q: 'How can I use Data URI format without hosting a web server?',
    a: `Traditionally, a PAC file had to be hosted on an HTTP server with the MIME type application/x-ns-proxy-autoconfig.

Modern operating systems (macOS and certain Windows builds) as well as browser extensions support RFC 2397 Data URIs:
data:application/x-ns-proxy-autoconfig;base64,....

Click the "Copy Data URI" button to encode the entire PAC script into a single string. You can paste this directly into the system proxy URL box without maintaining an external server.`,
  },
]);

export default function PacGeneratorEnPage() {
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
      <PacGeneratorClient lang="en" />
    </>
  );
}
