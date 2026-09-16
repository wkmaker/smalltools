import type { Metadata } from 'next';
import ChecksumVerifierClient from '../ChecksumVerifierClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'File Hash Calculator & Checksum Verifier - Free Online MD5 / SHA-256 / SHA-512 / CRC32 Tool',
  description:
    'Free client-side file hash calculator! Drag & drop files to compute MD5, SHA-1, SHA-256, SHA-512, CRC32, and drop the official checksum manifest (sha256sum, CHECKSUMS, .sfv) to automatically verify integrity — 100% local, nothing uploaded.',
  keywords:
    'file hash calculator md5 sha256 sha512 crc32 checksum verifier integrity check sha256sum md5sum sfv online tool',
  alternates: {
    canonical: 'https://tools.cjkuo.net/checksum-verifier/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/checksum-verifier/',
      en: 'https://tools.cjkuo.net/checksum-verifier/en/',
      'x-default': 'https://tools.cjkuo.net/checksum-verifier/en/',
    },
  },
  openGraph: {
    title: 'File Hash Calculator & Checksum Verifier - Free Online MD5 / SHA-256 / SHA-512 / CRC32 Tool',
    description: 'Drag & drop files to compute MD5/SHA-1/SHA-256/SHA-512/CRC32 and verify against a checksum manifest, 100% client-side.',
    url: 'https://tools.cjkuo.net/checksum-verifier/en/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'File Hash Calculator & Checksum Verifier - Free Online MD5 / SHA-256 / SHA-512 / CRC32 Tool',
    description: 'Drag & drop files to compute MD5/SHA-1/SHA-256/SHA-512/CRC32 and verify against a checksum manifest, 100% client-side.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'File Hash Calculator & Checksum Verifier',
  url: 'https://tools.cjkuo.net/checksum-verifier/en/',
  description: 'Client-side file hash calculator and checksum manifest verifier supporting MD5, SHA-1, SHA-256, SHA-512, CRC32.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is a file hash, and why do official downloads publish MD5/SHA256 checksums?',
    a: 'A hash is a one-way function that condenses arbitrary file content into a fixed-length fingerprint:\n\n① Integrity Verification:\nIf even a single byte of the file is altered (corrupted in transit, or maliciously swapped), the resulting hash changes completely, confirming whether your downloaded file exactly matches the original published by the vendor.\n\n② Common Use Cases:\nOS installation images (ISOs), open-source software packages, and Docker image layers are typically published alongside MD5/SHA-1/SHA-256/SHA-512 checksums so users can verify the download after the fact, guarding against man-in-the-middle tampering or CDN mirror corruption.',
  },
  {
    q: 'What is the difference between MD5, SHA-1, SHA-256, and SHA-512? Which one should I use?',
    a: 'These four algorithms differ in output length and security guarantees:\n\n① Output Length:\nMD5 produces 128 bits (32 hex characters), SHA-1 produces 160 bits (40 characters), SHA-256 produces 256 bits (64 characters), and SHA-512 produces 512 bits (128 characters).\n\n② Security Recommendation:\nMD5 and SHA-1 have known collision vulnerabilities and should never be used for digital signatures or password storage, though they remain useful for simply checking whether a download is corrupted or altered. When multiple checksums are provided, prefer SHA-256 or SHA-512 for verification.',
  },
  {
    q: 'Which checksum manifest formats are supported? Can I just drop a downloaded .sha256 file in?',
    a: 'Yes, and the tool automatically figures out what each dropped file is for:\n\n① Automatic Routing:\nWhen you drop a file into the main dropzone, if its extension or filename matches common checksum manifest conventions (e.g. .sha256, .md5, SHA256SUMS, CHECKSUMS), it is automatically parsed as a checksum manifest instead of being treated as a file to hash.\n\n② Supported Formats:\nGNU coreutils output (`<hash>  <filename>`, used by md5sum/sha256sum/shasum), BSD/OpenSSL format (`SHA256 (filename) = <hash>`), and a bare hash string with no filename (applied to every uploaded file).',
  },
  {
    q: 'What does "Unsupported" in the comparison result mean?',
    a: 'It means the hash length in the manifest corresponds to an algorithm this tool does not compute:\n\n① Common Cause:\nThis tool computes the five most common algorithms — MD5, SHA-1, SHA-256, SHA-512, and CRC32. If the manifest contains a SHA-384 hash (96 characters) or another variant, the tool honestly reports "Unsupported" rather than producing a misleading comparison.\n\n② Workaround:\nCompute it yourself with a built-in OS command (e.g. `shasum -a 384` on macOS/Linux, or `Get-FileHash -Algorithm SHA384` in Windows PowerShell) and compare visually against the manifest.',
  },
  {
    q: 'What is CRC32? Does this tool support .sfv checksum files?',
    a: 'CRC32 is a lightweight cyclic redundancy check widely used by ZIP, PNG, and SFV formats for error detection:\n\n① How It Differs From Cryptographic Hashes:\nCRC32 is not a cryptographically secure hash — it is designed to quickly catch random transmission errors (disk bad sectors, transfer noise) rather than deliberate tampering, so it should not be relied on for security verification, though it remains useful for checking whether a download got corrupted.\n\n② SFV Support:\nThis tool supports the standard `.sfv` format (`filename  crc32hex`, filename first followed by the 8-character hex CRC32, with lines starting with `;` treated as comments). Dropping a `.sfv` or `.cksum` file into the main dropzone automatically routes it to the checksum manifest parser.',
  },
  {
    q: 'Why does computing MD5 on a large file (e.g. a multi-GB disk image) feel slower than SHA-256?',
    a: 'This comes down to the underlying compute engine:\n\n① Native Acceleration vs. Pure Software:\nSHA-1/256/512 are computed via the browser\'s native Web Crypto API (SubtleCrypto), which benefits from low-level and sometimes hardware-accelerated implementations. MD5 is not natively supported by browsers, so this tool implements RFC 1321 in pure JavaScript, which is inherently slower.\n\n② No Freezing, Guaranteed:\nEven so, this tool periodically yields control back to the main thread while computing MD5, so the page stays scrollable and you can keep dragging in new files even while a large file is being hashed.',
  },
  {
    q: 'Is my file content uploaded to a server when I compute its hash on this site?',
    a: 'Never! This tool is a 100% client-side application:\n\n① Local Memory Processing:\nAll file reading and hash computation happen entirely within your browser via the native File API and Web Crypto API, on your local device memory.\n\n② Zero Cloud Upload:\nFile content, filenames, and computed results are never transmitted to any server or third party, making this safe for verifying confidential internal documents or proprietary software installers.',
  },
]);

export default function ChecksumVerifierEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <ChecksumVerifierClient lang="en" />
    </>
  );
}
