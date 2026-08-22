import type { Metadata } from 'next';
import JsonFormatterClient from '../JsonFormatterClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'JSON Formatter & Validator - Free Online JSON Beautifier & Minifier',
  description:
    'Free online JSON formatter, validator, beautifier, and minifier tool! Features syntax error positioning, tree view, indentation options, and file export.',
  keywords: 'JSON Formatter,JSON Validator,JSON Beautifier,JSON Minifier,JSON syntax check,JSON parser',
  alternates: {
    canonical: 'https://tools.cjkuo.net/json/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/json/',
      en: 'https://tools.cjkuo.net/json/en/',
      'x-default': 'https://tools.cjkuo.net/json/en/',
    },
  },
  openGraph: {
    title: 'JSON Formatter & Validator - Free Online JSON Beautifier & Minifier',
    description: 'Fast client-side JSON formatting tool with live syntax linting and interactive tree view.',
    url: 'https://tools.cjkuo.net/json/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON Formatter & Validator - Free Online JSON Beautifier & Minifier',
    description: 'Fast client-side JSON formatting tool with live syntax linting and interactive tree view.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'JSON Formatter & Validator',
  url: 'https://tools.cjkuo.net/json/en/',
  description: 'Free online JSON formatter, validator, beautifier, and minifier tool.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is JSON, and why is it ubiquitous in modern Web APIs and front-end development?',
    a: 'JSON (JavaScript Object Notation) is a lightweight, human-readable text-based data interchange format:\n\n① High Efficiency & Readability:\nMore lightweight and faster to serialize/deserialize than XML, saving network bandwidth and compute resources.\n\n② Native Compatibility:\nMaps directly to JavaScript Objects and Arrays, with built-in first-class parser support across all backend languages (Python, Go, Java, Node.js, Rust), making it the gold standard for RESTful and microservice architectures.',
  },
  {
    q: 'What are the most common JSON syntax errors, and how can they be fixed?',
    a: 'Common JSON syntax violations include:\n\n① Trailing Commas:\nLeaving a trailing comma `,` after the final element in an Object or Array (strictly forbidden by standard JSON).\n\n② Quote Inconsistencies:\nUsing single quotes or unquoted keys; standard JSON requires strict double quotes around all keys and string values.\n\n③ Comments & Escape Sequences:\nStandard JSON (RFC 8259) prohibits single-line or multi-line comments. Our tool instantly identifies the exact error line and column index for rapid resolution.',
  },
  {
    q: 'Is it secure to paste confidential JSON data (API Keys, Tokens, Business Payloads) into this tool?',
    a: '100% Secure! This tool runs entirely on a client-side architecture in your local browser:\n\n① Zero Backend Transmission:\nAll parsing, linting, syntax highlighting, and tree rendering occur purely within your local browser memory.\n\n② Zero Cloud Logging:\nNo data is ever dispatched or persisted to remote servers. The tool functions seamlessly even when completely offline.',
  },
  {
    q: 'What is the difference between JSON "Beautify / Format" and "Minify / Compress"?',
    a: 'The trade-off lies between human readability and network efficiency:\n\n① Beautify / Format:\nAdds clear line breaks and 2-space / 4-space / Tab indentation to display nested data hierarchy, ideal for debugging, API testing, and code review.\n\n② Minify / Compress:\nStrips all unnecessary whitespace and newlines into a compact single line, reducing payload size by 30% to 50% for high-throughput production network transmissions.',
  },
  {
    q: 'How does Standard JSON differ from JSON5 and JavaScript Object Literals?',
    a: 'Their syntactic strictness and intended use cases differ:\n\n① Standard JSON (RFC 8259):\nStrict specification requiring double quotes on keys/strings, prohibiting comments, trailing commas, multiline strings, and hexadecimal numbers.\n\n② JSON5 & JS Objects:\nSuperset formats designed for human authoring that permit single quotes, unquoted keys, trailing commas, and inline comments. This validator strictly checks against standard RFC 8259 specifications.',
  },
  {
    q: 'How should very large JSON files (e.g. 50MB+) be handled to prevent browser lag?',
    a: 'Performance optimization tips for large datasets:\n\n① Avoid Over-rendering DOM Nodes:\nRendering hundreds of thousands of syntax-highlighted DOM elements can strain browser memory.\n\n② Recommended Approach:\nUse the "Plain Text View" or collapse root tree nodes. Alternatively, use the "Minify" action for instant compact text output without extensive UI repaints.',
  },
  {
    q: 'What productivity features does this online JSON Formatter provide?',
    a: 'Our formatter integrates an end-to-end developer workflow:\n\n① Interactive Collapsible Tree View:\nExpand or collapse any nested object or array level with a single click.\n\n② Developer Toolbox:\nOffers 2-space / 4-space / Tab indentation switching, real-time error markers, one-click copy, clear button, and direct `.json` file download.',
  },
]);

export default function JsonEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <JsonFormatterClient lang="en" />
    </>
  );
}
