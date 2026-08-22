import type { Metadata } from 'next';
import HarCleanerClient from '../HarCleanerClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'HAR Sensitive Data Sanitizer - Free Online HTTP Archive Privacy Scrubber & Size Reducer',
  description:
    'Professional free online HAR privacy cleaner (HAR Sensitive Data Sanitizer)! Redact Cookies, Authorization headers, Bearer JWTs, API keys, sensitive query params, and JSON payloads. 100% in-browser security.',
  keywords:
    'HAR cleaner,HAR sanitizer,HTTP Archive,HAR privacy,redact cookies,Authorization header,JWT sanitizer,API key scrubber,DevTools network',
  alternates: {
    canonical: 'https://tools.cjkuo.net/har-cleaner/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/har-cleaner/',
      en: 'https://tools.cjkuo.net/har-cleaner/en/',
      'x-default': 'https://tools.cjkuo.net/har-cleaner/en/',
    },
  },
  openGraph: {
    title: 'HAR Sensitive Data Sanitizer - Free Online HTTP Archive Privacy Scrubber & Size Reducer',
    description:
      'Professional client-side HAR privacy scrubber! Strip cookies, tokens, API keys, and heavy base64 media with 100% local processing.',
    url: 'https://tools.cjkuo.net/har-cleaner/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HAR Sensitive Data Sanitizer - Free Online HTTP Archive Privacy Scrubber & Size Reducer',
    description:
      'Professional client-side HAR privacy scrubber! Strip cookies, tokens, API keys, and heavy base64 media with 100% local processing.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'HAR Sensitive Data Sanitizer',
  url: 'https://tools.cjkuo.net/har-cleaner/en/',
  description:
    'Professional free online HAR privacy cleaner (HAR Sensitive Data Sanitizer) with 100% in-browser processing.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is a HAR (HTTP Archive) file, and why is sharing it risky?',
    a: 'A HAR (HTTP Archive) file is a standard JSON-formatted log containing comprehensive records of HTTP/HTTPS communications between a browser and servers:\n\n① Contains Highly Sensitive Credentials:\nHAR files faithfully record `Authorization` headers (Bearer tokens, Basic auth), session `Cookie` / `Set-Cookie` identifiers, API keys, and request/response payloads.\n\n② Account Takeover Risk:\nIf an un-sanitized HAR is shared with support desks, posted on GitHub, or shared with vendors, attackers can extract session cookies or tokens to replay requests and hijack active user sessions without credentials.',
  },
  {
    q: 'How does this tool sanitize HAR files? Is my data uploaded anywhere?',
    a: '100% Private & Safe! This tool operates entirely on a Zero-Server client-side architecture:\n\n① In-Memory Local Processing:\nAll JSON parsing, regex pattern matching, field scrubbing, and file generation execute strictly inside your local browser memory.\n\n② Zero Network Transmission:\nYour archive contents are never transmitted to any remote servers, cloud endpoints, or third-party telemetry services. It works seamlessly even when offline.',
  },
  {
    q: 'What is "Media Stripping" and how does it reduce file size?',
    a: 'Media Stripping is a powerful feature designed to tackle bloated HAR archives:\n\n① Solves Huge File Sizes:\nWhen recording web sessions, browsers serialize images (PNG, JPEG, WebP), fonts (WOFF2), and binary assets into massive Base64 strings inside Response Bodies, inflating files to 30MB-100MB+.\n\n② Retains Critical Diagnostics while Slashing File Size:\nEnabling this option strips heavy Base64 media data while perfectly preserving HTTP status codes, network timing, request/response headers, and JSON API payloads—typically shrinking the file by over 90% (<1MB).',
  },
  {
    q: 'Which sensitive patterns and fields are automatically sanitized?',
    a: 'The engine features multi-tier automated detection:\n\n① Authentication & Headers:\nRedacts `Authorization`, `Proxy-Authorization`, `X-Api-Key`, `X-Auth-Token`, `Bearer`, `Cookie`, `Set-Cookie`, and session identifiers.\n\n② URL & Form Keys:\nIntercepts `token`, `access_token`, `auth`, `api_key`, `secret`, `password`, `code`, `session_id`, and `refresh_token`.\n\n③ Deep Regex Detection:\nDetects and masks JWT signatures (`eyJ...`), AWS Access Keys (`AKIA...`), Stripe keys (`sk_live_...`), emails, and RSA/OpenSSH private keys.',
  },
  {
    q: 'Can the cleaned HAR file be re-imported into Chrome DevTools or Postman?',
    a: 'Fully Compatible! The tool strictly adheres to the W3C HAR 1.2 specification:\n\n① Preserves JSON Integrity:\nSanitization modifies sensitive string values (e.g. replacing them with `[REDACTED]`) without altering object hierarchies, timestamps, or required structure.\n\n② Seamless Multi-Tool Support:\nExported `.har` files can be immediately dragged back into Chrome DevTools Network tab, Charles Proxy, Wireshark, Postman, Fiddler, or Datadog for continued troubleshooting.',
  },
  {
    q: 'How can I add custom sensitive fields specific to my company or app?',
    a: 'You can easily configure custom rules:\n\n① Custom Keywords List:\nEnter field names (comma or newline separated) such as `customer_ssn, internal_org_id, pay_secret`.\n\n② Global Automatic Matching:\nThe scrubber will automatically redact these keys across Request Headers, Query parameters, POST form bodies, and nested JSON objects.',
  },
  {
    q: 'What does the "Tracker Filter" option do?',
    a: 'Eliminates telemetry noise:\n\n① Removes Third-Party Analytics Requests:\nRecorded browser sessions often contain dozens of tracking beacons from Google Analytics, Facebook Pixel, Hotjar, Sentry, Datadog, etc.\n\n② Focuses on Core APIs:\nEnabling this filter purges these irrelevant telemetry requests so you can focus purely on your application\'s primary endpoints.',
  },
  {
    q: 'How can I quickly try out and test this tool?',
    a: 'One-Click Sample Experience:\n\n① Click "Load Sample HAR File":\nThe tool will immediately load a realistic sample HAR containing JWTs, auth cookies, sensitive query params, and image payloads.\n\n② Real-time Inspection:\nToggle cleaning rules, view entry diffs, and observe instant file size reduction and sanitization statistics.',
  },
]);

export default function HarCleanerEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <HarCleanerClient lang="en" />
    </>
  );
}
