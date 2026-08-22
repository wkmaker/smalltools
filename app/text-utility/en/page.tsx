import type { Metadata } from 'next';
import TextUtilityClient from '../TextUtilityClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Text Utility & Stats - Free Online Character Counter, Case Converter & Text Formatter',
  description:
    'Free professional online Text Utility & Statistics tool! Supports real-time character count, word count, line count, case conversion, removing duplicate/empty lines, and text formatting.',
  keywords:
    'word count, character counter, case converter, text utility, text formatter, remove duplicate lines, remove space, online text tool',
  alternates: {
    canonical: 'https://tools.cjkuo.net/text-utility/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/text-utility/',
      en: 'https://tools.cjkuo.net/text-utility/en/',
      'x-default': 'https://tools.cjkuo.net/text-utility/en/',
    },
  },
  openGraph: {
    title: 'Text Utility & Stats - Free Online Character Counter, Case Converter & Text Formatter',
    description: 'Instant text case conversion, space removal, and multi-dimensional text statistics.',
    url: 'https://tools.cjkuo.net/text-utility/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Text Utility & Stats - Free Online Character Counter, Case Converter & Text Formatter',
    description: 'Instant text case conversion, space removal, and multi-dimensional text statistics.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Text Utility & Stats',
  url: 'https://tools.cjkuo.net/text-utility/en/',
  description: 'Free online text processing & formatting tool with case conversion, space cleanup, and character stats.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'How are Chinese characters and English words counted in this tool?',
    a: 'We use industry-standard multilingual tokenization algorithms:\n\n① Chinese Character Count:\nMatches Unicode CJK Unified Ideographs (`\\u4e00-\\u9fa5`), counting each distinct Chinese character individually.\n\n② English Word Count:\nMatches continuous alphanumeric sequences and hyphenated words (`\\b[a-zA-Z0-9_-]+\\b`) as standalone words, unaffected by irregular spacing.',
  },
  {
    q: 'What is the difference between "Total Characters" and "Excluding Spaces"?',
    a: 'Their counting scopes and usage conventions differ:\n\n① Total Characters:\nIncludes letters, digits, punctuation marks, newline breaks (`\\n`), and all spaces.\n\n② Excluding Spaces:\nStrips ASCII spaces, full-width spaces, tab indents, and newlines. Many essay submissions, character-limited publishing rates, and social media constraints (Twitter/Threads) rely strictly on character counts excluding spaces.',
  },
  {
    q: 'How do the case conversion functions (UPPERCASE, lowercase, Title Case) operate?',
    a: 'Supports standard letter case transformations:\n\n① UPPERCASE:\nConverts all letters to capital form (e.g. `hello world` → `HELLO WORLD`).\n\n② lowercase:\nConverts all letters to small form.\n\n③ Title Case:\nCapitalizes the first letter of each word and lowers remaining letters (e.g. `hello world` → `Hello World`), ideal for headline typesetting.',
  },
  {
    q: 'Does "Remove Duplicate Lines" preserve the original line ordering?',
    a: 'Yes, original sequence is strictly maintained:\n\n① Stable Order Preservation:\nUsing a Set-based deduplication filter, only subsequent redundant duplicates are removed, preserving the first appearance of each unique line.\n\n② Best Use Cases:\nIdeal for cleaning up mailing lists, phone rosters, keyword sets, and raw database exports.',
  },
  {
    q: 'Is there any privacy or data leakage risk when pasting sensitive text into this tool?',
    a: 'Zero Risk! This tool operates entirely client-side inside your local browser memory:\n\n① Zero Backend Transmission:\nAll character statistics, case transformations, and cleanups execute in your local JavaScript runtime.\n\n② Zero Cloud Logging:\nNo text is ever dispatched to or stored on remote servers. Works fully offline.',
  },
  {
    q: 'How do "Remove Empty Lines" and "Trim Line Spaces" help with data cleansing?',
    a: 'Efficient preprocessing utilities:\n\n① Remove Empty Lines:\nEliminates blank lines and lines containing only whitespace, condensing document layout.\n\n② Trim Line Spaces:\nStrips leading and trailing spaces from every line, cleaning up artifacts copied from PDFs or web tables before importing into Excel or databases.',
  },
  {
    q: 'Can this text utility handle very long manuscripts or large datasets (100,000+ words)?',
    a: 'Yes! Optimized with high-efficiency regular expressions and native JavaScript string APIs, the tool processes manuscripts exceeding 500,000 words in just a few milliseconds.',
  },
]);

export default function TextUtilityEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <TextUtilityClient lang="en" />
    </>
  );
}
