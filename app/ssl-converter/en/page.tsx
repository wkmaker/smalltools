import type { Metadata } from 'next';
import SslConverterClient from '../SslConverterClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'SSL Certificate Converter - Free Online PFX/P12/PEM/DER Converter & Chain Fixer',
  description:
    'Free online SSL certificate converter tool! Convert PFX/P12, PEM, and DER certificates bi-directionally with client-side privacy, key matching hash check, and expiration warnings.',
  keywords: 'SSL Certificate Converter,PFX to PEM,PEM to PFX,DER to PEM,P12 converter,SSL cert chain fix,private key converter',
  alternates: {
    canonical: 'https://tools.cjkuo.net/ssl-converter/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/ssl-converter/',
      en: 'https://tools.cjkuo.net/ssl-converter/en/',
      'x-default': 'https://tools.cjkuo.net/ssl-converter/en/',
    },
  },
  openGraph: {
    title: 'SSL Certificate Converter - Free Online PFX/P12/PEM/DER Converter & Chain Fixer',
    description: 'Secure client-side SSL certificate format converter tool with certificate chain fixing and expiration analysis.',
    url: 'https://tools.cjkuo.net/ssl-converter/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SSL Certificate Converter - Free Online PFX/P12/PEM/DER Converter & Chain Fixer',
    description: 'Secure client-side SSL certificate format converter tool with certificate chain fixing and expiration analysis.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'SSL Certificate Converter',
  url: 'https://tools.cjkuo.net/ssl-converter/en/',
  description: 'Free online SSL certificate format converter tool supporting PFX, P12, PEM, and DER.',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'Is it safe to convert SSL certificates and private keys online? Will my private key be leaked?',
    a: `100% safe! SSL private keys are master credentials for server identity. Traditional online converters upload your key to remote servers, risking server log exposure or network sniffing.

Our tool operates on a Zero-Server Architecture principle: 100% of processing happens inside your browser RAM. You can even disconnect your Wi-Fi or Internet after loading the page and perform all PFX decryptions and PEM/DER conversions completely offline with zero leak risks.`,
  },
  {
    q: 'How can a browser perform OpenSSL-grade certificate processing without backend servers?',
    a: 'Historically, certificate conversions required server-side OpenSSL CLI. This tool leverages modern browser Web Cryptography API and a high-performance JavaScript cryptography engine (Node-Forge) to parse ASN.1 binary structures, decrypt 3DES/AES encrypted PKCS#12 bundles, and verify RSA/ECC modulus hashes directly in client RAM. This guarantees zero server latency, zero disk writes, and zero data transmission.',
  },
  {
    q: 'Why is Certificate Chain Auto-Detection & AIA Repair crucial for website uptime?',
    a: `Deploying an SSL cert without its Intermediate CA creates severe compatibility failures:

① Desktop Chrome/Edge might work due to AIA auto-fetching or cached CAs.
② Mobile Safari (iOS), Android, and API clients will crash, displaying NET::ERR_CERT_AUTHORITY_INVALID or unable to get local issuer certificate errors.

Our tool automatically parses the AIA (Authority Information Access) extension in your cert, pinpoints missing intermediate CA URLs, and lets you synthesize complete CA bundles with one click!`,
  },
  {
    q: 'What is the difference between PFX/P12, PEM, CRT, and DER formats?',
    a: `SSL certificate formats are categorized into three main types based on server environments:

① PEM / CRT / KEY (Base64 ASCII):
Plaintext Base64 encoded files starting with -----BEGIN CERTIFICATE-----, standard for Nginx, Apache, Cloudflare, AWS ELB, and Node.js.

② PFX / P12 (PKCS#12 Binary Bundle):
Encrypted binary container bundling certificate, private key, and CA chain, required by Windows IIS, Azure, and Tomcat.

③ DER / CER (ASN.1 Binary):
Raw binary encoded certificates, common in Java platforms (Keystore) and legacy enterprise systems.`,
  },
  {
    q: 'Why is a password required when converting PFX / P12 to PEM?',
    a: 'PFX / P12 files use PKCS#12 encryption (3DES/AES) to secure sensitive private keys. The password entered during export is required to decrypt the container and extract the PEM certificate and key locally inside your browser.',
  },
  {
    q: 'How can I verify if my SSL Private Key matches my Certificate?',
    a: 'Certificates and private keys share the same public key modulus. Our tool automatically calculates SHA-256 modulus hashes for both. If the hashes match 100%, the private key belongs to that certificate, preventing web server startup failures.',
  },
  {
    q: 'Can I convert expired SSL certificates? How does expiration detection work?',
    a: 'Yes, expired certificates can still be converted for backup or archiving. The tool automatically analyzes the "Not After" date and displays warning alerts if the certificate is expired or expiring within 30 days.',
  },
]);

export default function SslConverterEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <SslConverterClient lang="en" />
    </>
  );
}
