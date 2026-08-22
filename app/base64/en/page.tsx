import type { Metadata } from 'next';
import Base64Client from '../Base64Client';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Base64 Encoder & Decoder - Free Online Text & URL-Safe Base64 Converter',
  description:
    'Free online Base64 encoder and decoder tool! Supports UTF-8 Chinese characters, URL-Safe format, instant bidirectional conversion, and file preview/conversion.',
  keywords: 'Base64,Base64 encoder,Base64 decoder,Base64 converter,URL Safe Base64,UTF-8 Base64,online Base64',
  alternates: {
    canonical: 'https://tools.cjkuo.net/base64/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/base64/',
      en: 'https://tools.cjkuo.net/base64/en/',
      'x-default': 'https://tools.cjkuo.net/base64/en/',
    },
  },
  openGraph: {
    title: 'Base64 Encoder & Decoder - Free Online Text & URL-Safe Base64 Converter',
    description: 'Fast client-side Base64 encoder and decoder tool supporting UTF-8 & URL-Safe modes.',
    url: 'https://tools.cjkuo.net/base64/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Base64 Encoder & Decoder - Free Online Text & URL-Safe Base64 Converter',
    description: 'Fast client-side Base64 encoder and decoder tool supporting UTF-8 & URL-Safe modes.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Base64 Encoder & Decoder',
  url: 'https://tools.cjkuo.net/base64/en/',
  description: 'Free online Base64 encoder and decoder tool, supporting UTF-8 and URL-Safe formats.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is Base64 encoding, and why is it necessary to convert binary data or text to Base64?',
    a: 'Base64 is a binary-to-text encoding scheme that translates raw bytes into a radix-64 representation using 64 printable ASCII characters (A-Z, a-z, 0-9, +, /):\n\n① Preventing Data Corruption in Transit:\nEarly networking protocols (Email MIME, HTTP Headers, URL query strings) only supported 7-bit or ASCII character sets. Direct transmission of raw binary streams (images, audio, cryptographic keys) resulted in corrupt bytes due to system-level encoding translations.\n\n② Universal Compatibility:\nBase64 guarantees that arbitrary binary data travels safely and intact through text-only transmission channels and databases.',
  },
  {
    q: 'Why do Chinese or special Unicode characters often get garbled during Base64 decoding, and how does this tool fix it?',
    a: 'Garbled output arises from JavaScript legacy character set limitations:\n\n① Native JavaScript Limitations:\nThe browser built-in `btoa()` and `atob()` functions only support 8-bit Latin1 character ranges. Passing multibyte UTF-8 strings (Chinese characters, Japanese kanji, emojis) triggers an `InvalidCharacterError`.\n\n② Full UTF-8 Support:\nOur tool implements a robust `encodeURIComponent` and TypedArray byte-stream conversion pipeline, ensuring flawless, bidirectional encoding and decoding of Traditional Chinese, international scripts, and emoji characters without data loss.',
  },
  {
    q: 'What is "URL-Safe Base64"? How does it differ from standard Base64?',
    a: 'URL-Safe Base64 is an official standard variant (RFC 4648 §5) tailored for web addresses and filenames:\n\n① Character Substitutions:\nStandard Base64 contains `+` (which represents space in URLs) and `/` (which represents directory separators). URL-Safe Base64 replaces `+` with `-` (hyphen) and `/` with `_` (underscore).\n\n② Padding Stripping:\nURL-Safe Base64 typically omits trailing `=` padding characters, allowing strings to be directly and safely embedded in HTTP GET parameters, file names, or JWT (JSON Web Token) signatures.',
  },
  {
    q: 'Why does file size increase by approximately 33% after Base64 encoding?',
    a: 'Size expansion is an inherent mathematical property of the 6-bit encoding algorithm:\n\n① 3 Bytes to 4 Characters:\nBase64 groups 3 raw bytes (3 × 8 = 24 bits) into 4 chunks of 6 bits (4 × 6 = 24 bits), with each chunk mapped to an ASCII character.\n\n② Consistent 4/3 Ratio:\nThe encoded output is always exactly 4/3 (133.3%) the size of the original data. If the input byte length is not divisible by 3, 1 or 2 `=` padding characters are appended.',
  },
  {
    q: 'What is a "Data URL (data:image/png;base64,...)" and when should it be used in web development?',
    a: 'A Data URL is a URI scheme that embeds media files directly inline within HTML/CSS documents:\n\n① Syntax Structure:\nFormatted as `data:[<MIME-type>][;base64],<data>`, for example `data:image/svg+xml;base64,...`.\n\n② Use Cases & Trade-offs:\nIdeal for inlining small icons (<10KB), SVG graphics, or critical fonts directly into HTML/CSS to eliminate extra HTTP round-trips; larger files (>50KB) should remain external files to leverage browser caching.',
  },
  {
    q: 'Is Base64 an encryption algorithm? Can it be used to store passwords securely?',
    a: 'No! Base64 is strictly a "data representation encoding," not encryption:\n\n① Zero Confidentiality:\nBase64 has no secret keys or protection mechanisms; anyone can reverse the encoding with standard decoders in milliseconds.\n\n② Security Best Practices:\nNever use Base64 to store passwords, API secrets, or sensitive PII. For secure data storage and transit, always use authenticated encryption (AES-GCM, RSA) or cryptographic hashes (SHA-256, bcrypt, Argon2).',
  },
  {
    q: 'Is there any data privacy risk when encoding or decoding files with this online Base64 tool?',
    a: 'Zero Risk! This tool operates entirely within your local browser memory:\n\n① 100% Client-Side Execution:\nFiles are processed locally via the HTML5 FileReader API without being uploaded to remote servers.\n\n② Offline Compatibility:\nThe application functions fully even without an internet connection, guaranteeing total privacy for sensitive enterprise assets.',
  },
]);

export default function Base64EnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <Base64Client lang="en" />
    </>
  );
}
