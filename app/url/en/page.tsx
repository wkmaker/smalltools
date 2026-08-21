import type { Metadata } from 'next';
import UrlEncoderClient from '../UrlEncoderClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'URL Encoder & Decoder - Free Online encodeURIComponent Tool',
  description:
    'Free online URL encoder and decoder tool! Supports encodeURIComponent and decodeURIComponent with instant bidirectional query parameter breakdown.',
  keywords: 'URL Encoder,URL Decoder,encodeURIComponent,decodeURIComponent,URL encode,percent encoding',
  alternates: {
    canonical: 'https://tools.cjkuo.net/url/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/url/',
      en: 'https://tools.cjkuo.net/url/en/',
      'x-default': 'https://tools.cjkuo.net/url/en/',
    },
  },
  openGraph: {
    title: 'URL Encoder & Decoder - Free Online encodeURIComponent Tool',
    description: 'Fast client-side URL encoder and decoder supporting Unicode & query parameter breakdown.',
    url: 'https://tools.cjkuo.net/url/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'URL Encoder & Decoder - Free Online encodeURIComponent Tool',
    description: 'Fast client-side URL encoder and decoder supporting Unicode & query parameter breakdown.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'URL Encoder & Decoder',
  url: 'https://tools.cjkuo.net/url/en/',
  description: 'Free online URL encoder and decoder tool with query parameter table editing.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is URL Encoding (Percent-Encoding) and why is it necessary?',
    a: 'Under RFC 3986 standards, URLs are restricted to a limited set of ASCII characters (unreserved characters include A-Z, a-z, 0-9, -, _, ., ~).\n\n① Handling Non-ASCII & Unicode Characters:\nCharacters from non-Latin scripts (Chinese, Japanese, Arabic, etc.) and emojis must be converted into UTF-8 byte sequences, where each byte is represented by a percent sign followed by two hexadecimal digits (e.g., \'中\' becomes \'%E4%B8%AD\').\n\n② Preventing Syntax Ambiguities:\nIn a URL, characters like \'?\' denote the start of query parameters, \'=\' separates key-value pairs, and \'&\' separates parameters. If a parameter value itself contains \'&\', \'=\', \'?\', or spaces, it must be percent-encoded to prevent server-side parsing errors.',
  },
  {
    q: 'What is the difference between encodeURIComponent() and encodeURI()?',
    a: 'The primary difference lies in how reserved URL structural characters are treated:\n\n① encodeURIComponent() (Recommended for Query Parameter Values):\nEncodes all reserved characters including : / ? # [ ] @ ! $ & \' ( ) * + , ; =. This is essential for individual query parameter keys and values so they do not break the overall URL structure.\n\n② encodeURI() (Used for Complete URL Strings):\nPreserves URL structural syntax (e.g. ://, /, ?, &, # remain unencoded) and only encodes non-ASCII characters and spaces. It should not be used on parameter values containing \'&\' or \'=\' because it will not escape them.\n\n③ Rule of Thumb: Use encodeURIComponent() for individual parameter keys/values, and encodeURI() when encoding a whole, valid URL string.',
  },
  {
    q: 'Should space be encoded as \'%20\' or \'+\' in URLs?',
    a: 'This depends on the specification and context:\n\n① RFC 3986 Standard (%20):\nUnder standard URI and HTTP specifications, spaces must be encoded as %20. In the path component of a URL (e.g., /my%20documents/), %20 is the only valid representation.\n\n② application/x-www-form-urlencoded (+):\nHistorically, HTML form submissions using GET/POST with application/x-www-form-urlencoded encode spaces as \'+\'. Most backend frameworks (PHP, Spring, ASP.NET, Express) automatically decode both \'+\' and \'%20\' as spaces in query strings.\n\nThis tool provides a toggle switch to encode spaces as \'+\' if required by your specific backend.',
  },
  {
    q: 'What is Double Encoding and how do I prevent it?',
    a: 'Double encoding occurs when an already percent-encoded string is accidentally encoded a second time:\n\n① Mechanism:\nA character like \'中\' is encoded to \'%E4%B8%AD\'. If encoded again, the \'%\' character is converted to \'%25\', resulting in \'%25E4%25B8%25AD\'.\n\n② Negative Impact:\nWhen the receiving server decodes the URL once, it obtains the string \'%E4%B8%AD\' rather than the original character \'中\', resulting in broken search queries, 404 file not found errors, or corrupted database records.\n\n③ Prevention: Always ensure data is in its raw, unencoded state before applying encodeURIComponent().',
  },
  {
    q: 'Why does decodeURIComponent() throw a \'URI malformed\' error?',
    a: 'The \'URI malformed\' JavaScript runtime error typically happens in the following cases:\n\n① Truncated Percent Sequences:\nA trailing \'%\' sign or an incomplete hex pair (e.g., \'%E\' instead of \'%E4\').\n\n② Incomplete UTF-8 Byte Sequences:\nMost international characters require 2 to 4 consecutive %XX byte sequences. If a string was trimmed or truncated midway (e.g., \'%E4%B8\' missing its third byte), decodeURIComponent() cannot reconstruct a valid Unicode character and throws an exception.\n\n③ Legacy Non-UTF8 Encodings:\nURLs encoded using legacy character sets (such as Big5 or ISO-8859-1) fail when processed by modern UTF-8 decoders.',
  },
  {
    q: 'What is the difference between Base64 and URL encoding? Can they replace each other?',
    a: 'Base64 and URL encoding serve fundamentally different purposes and are not interchangeable:\n\n① URL Encoding (Percent-encoding):\nSelectively replaces invalid characters with %XX while keeping standard alphanumeric ASCII characters intact with minimal length overhead.\n\n② Base64 Encoding:\nEncodes arbitrary binary data or text into an ASCII string using a 64-character alphabet (A-Z, a-z, 0-9, +, /), increasing data size by ~33%. Standard Base64 contains \'+\', \'/\', and \'=\' which are reserved characters in URLs and must be URL-encoded or converted to \'Base64URL\' format before being placed in a query string.',
  },
  {
    q: 'Data Privacy & Zero Server Storage Guarantee',
    a: 'This tool operates 100% on the client side using pure browser JavaScript:\n\n① Zero Server Transmission:\nAll URLs, API keys, bearer tokens, and sensitive query parameters you paste or inspect remain entirely within your local browser memory. Nothing is ever sent to, logged by, or stored on any remote server.\n\n② Safe for Confidential Data:\nYou can safely inspect, parse, and debug sensitive OAuth redirect URLs, JWT tokens, and private API query parameters with total peace of mind.',
  },
]);

export default function UrlEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <UrlEncoderClient lang="en" />
    </>
  );
}

