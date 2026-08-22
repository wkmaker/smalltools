import type { Metadata } from 'next';
import EpochClient from '../EpochClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Epoch Timestamp Converter - Free Online Unix Timestamp & Date Converter',
  description:
    'Free online Unix Epoch timestamp converter tool! Auto second/millisecond detection, instant 2-way conversion, multi-timezone comparison (Taipei, UTC, PST), and conversion history.',
  keywords: 'epoch timestamp converter, unix timestamp, timestamp converter, epoch converter, unix time, timestamp to date, date to timestamp',
  alternates: {
    canonical: 'https://tools.cjkuo.net/epoch/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/epoch/',
      en: 'https://tools.cjkuo.net/epoch/en/',
      'x-default': 'https://tools.cjkuo.net/epoch/en/',
    },
  },
  openGraph: {
    title: 'Epoch Timestamp Converter - Free Online Unix Timestamp & Date Converter',
    description: 'Free online Unix Epoch timestamp converter with multi-timezone comparison and history.',
    url: 'https://tools.cjkuo.net/epoch/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Epoch Timestamp Converter - Free Online Unix Timestamp & Date Converter',
    description: 'Free online Unix Epoch timestamp converter with multi-timezone comparison and history.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Epoch Timestamp Converter',
  url: 'https://tools.cjkuo.net/epoch/en/',
  description: 'Free online Unix Epoch timestamp converter tool supporting auto second/millisecond detection and multi-timezone comparison.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is Unix Epoch Time, and why do server logs and databases widely adopt it?',
    a: 'Unix Timestamp (POSIX time) is a universal numeric standard for tracking time across computing systems:\n\n① Epoch Origin:\nDefined as the elapsed seconds since "00:00:00 UTC on January 1, 1970" (excluding leap seconds).\n\n② Why Server Logs Use Unix Timestamps:\nServer and system log records frequently use Unix Epoch timestamps because they are completely immune to local timezone shifts and Daylight Saving Time (DST). Pure integers conserve disk space, allow ultra-fast indexed range queries, and can be effortlessly converted into local time across global servers for simplified log correlation and debugging.',
  },
  {
    q: 'What is the difference between 10-digit (seconds) and 13-digit (milliseconds) timestamps?',
    a: 'Precision scale and unit length differ:\n\n① 10-Digit Seconds (e.g. `1700000000`):\nStandard in backend languages and system tools (Python `time.time()`, PHP `time()`, Linux `date +%s`).\n\n② 13-Digit Milliseconds (e.g. `1700000000000`):\nNative to JavaScript (`Date.now()`) and Java (`System.currentTimeMillis()`).\n\n③ Auto-Detection:\nOur tool automatically detects 10-digit vs 13-digit values based on digit length and valid epoch ranges.',
  },
  {
    q: 'What is the Year 2038 Problem (Y2K38) and how does it affect computer systems?',
    a: 'A classic 32-bit integer overflow milestone:\n\n① Overflow Moment:\nSigned 32-bit integers cap out at `2,147,483,647` seconds, which occurs on **January 19, 2038, at 03:14:07 UTC**.\n\n② Consequence:\nUnupdated legacy systems will roll over to `-2,147,483,648` (December 13, 1901), causing critical calculation faults. Modern 64-bit architectures expand the limit to 292 billion years in the future.',
  },
  {
    q: 'How do you get current Unix timestamps in different programming languages?',
    a: 'Language quick-reference snippets:\n\n① JavaScript / TypeScript: `Date.now()` (13-digit ms) or `Math.floor(Date.now() / 1000)` (10-digit sec).\n\n② Python: `import time; int(time.time())` (10-digit sec).\n\n③ PHP: `time()` (10-digit sec).\n\n④ Go: `time.Now().Unix()` (10-digit sec).\n\n⑤ Java: `System.currentTimeMillis()` (13-digit ms).',
  },
  {
    q: 'How do Timezones and Daylight Saving Time (DST) interact with timestamps?',
    a: 'Timestamps are absolute UTC values independent of geographic location:\n\n① UTC Universality:\nA given Unix timestamp represents the exact same physical instant everywhere on Earth.\n\n② Local Rendering:\nConverting to a human-readable date requires applying local timezone offsets (e.g., Taipei UTC+8, New York UTC-5 / DST UTC-4). This tool provides simultaneous multi-timezone views.',
  },
  {
    q: 'What are the ISO 8601 and RFC 3339 date format standards?',
    a: 'Globally standardized text timestamp specifications:\n\n① Standard Structure:\nFormatted as `2026-08-22T08:30:00Z` (UTC) or `2026-08-22T16:30:00+08:00` (with timezone offset).\n\n② Key Advantages:\nEnables natural alphabetical sorting and removes ambiguity, serving as the required standard for JSON payloads and REST APIs.',
  },
  {
    q: 'What features and utilities does this online Epoch converter offer?',
    a: 'An all-in-one time toolkit:\n\n① Live Dynamic Clock:\nDisplays live real-time second and millisecond timestamps with pause/resume and quick-copy.\n\n② Bidirectional Conversion:\nConvert timestamps to formatted dates, or pick custom dates/times with milliseconds to calculate timestamps, day-of-week, day-of-year, and leap year validation.',
  },
]);

export default function EpochEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <EpochClient lang="en" />
    </>
  );
}
