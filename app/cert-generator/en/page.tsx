import type { Metadata } from 'next';
import CertGeneratorClient from '../CertGeneratorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'CA & Server Certificate Generator - Free Self-Signed RSA/ECDSA/Ed25519 SSL Tool',
  description:
    'Free online self-signed certificate generator! Supports a direct self-signed mode or a CA + server certificate mode, RSA 2048/4096, ECDSA P-256/P-384, or Ed25519 key algorithms, and PEM, DER, or PKCS#12 output — ideal for local development and internal testing.',
  keywords: 'CA generator,self-signed certificate,server certificate,root certificate,SAN,RSA,ECDSA,Ed25519,PKCS12,DER,localhost https,dev certificate generator',
  alternates: {
    canonical: 'https://tools.cjkuo.net/cert-generator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/cert-generator/',
      en: 'https://tools.cjkuo.net/cert-generator/en/',
      'x-default': 'https://tools.cjkuo.net/cert-generator/en/',
    },
  },
  openGraph: {
    title: 'CA & Server Certificate Generator - Free Self-Signed RSA/ECDSA/Ed25519 SSL Tool',
    description: 'Pure client-side self-signed certificate generator with a direct or CA-issued mode, multiple key algorithms, and PEM/DER/PKCS#12 output.',
    url: 'https://tools.cjkuo.net/cert-generator/en/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CA & Server Certificate Generator - Free Self-Signed RSA/ECDSA/Ed25519 SSL Tool',
    description: 'Pure client-side self-signed certificate generator with a direct or CA-issued mode, multiple key algorithms, and PEM/DER/PKCS#12 output.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'CA & Server Certificate Generator',
  url: 'https://tools.cjkuo.net/cert-generator/en/',
  description: 'Free online client-side self-signed certificate generator with a direct or CA-issued mode, RSA/ECDSA/Ed25519 key algorithms, and PEM/DER/PKCS#12 output.',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'Should I use "Self-Signed Only" or "CA + Server Certificate"?',
    a: 'Just one machine, one domain, want the quickest path? Choose "Self-Signed Only" — it issues a single certificate in one step (subject equals issuer). Expect to manage several internal test hosts or domains? Choose "CA + Server Certificate" — import the root CA into your trust store once, and every server certificate it issues afterward is automatically trusted, with no need to re-trust each one.',
  },
  {
    q: 'Should I pick RSA, ECDSA, or Ed25519?',
    a: 'RSA 2048/4096 has the widest compatibility — virtually every system and legacy client recognizes it, and it is the only option that supports PKCS#12 (.p12) packaging here. ECDSA (P-256/P-384) has shorter keys and faster operations, and is well supported by modern browsers and servers (Nginx, Caddy, recent OpenSSL) — a good fit when performance matters. Ed25519 has the fastest signing and shortest keys with strong security, but some older systems or enterprise clients may not support it yet — best when you control both ends of the connection.',
  },
  {
    q: 'Does this tool support post-quantum cryptography (PQC) algorithms such as ML-DSA / Dilithium?',
    a: 'Not yet. Key generation and certificate signing here rely entirely on the browser\'s native Web Crypto API, and that spec does not yet include post-quantum signature algorithms like ML-DSA or SLH-DSA — no mainstream browser implements them either, so a purely client-side tool cannot produce PQC certificates today. X.509 support for PQC algorithms (e.g. RFC 9881) is also still being standardized and isn\'t broadly interoperable yet. We will consider adding it once browser and ecosystem support matures.',
  },
  {
    q: 'What is the difference between PEM, DER, and PKCS#12 output?',
    a: 'PEM is a Base64 text format (`-----BEGIN CERTIFICATE-----`) — the most universal, accepted by Nginx, Apache, and Node.js, and easy to copy-paste. DER is the equivalent binary encoding, common with Java Keystores or certain embedded devices. PKCS#12 (.p12/.pfx) bundles a certificate and private key into one password-protected file, mainly used by Windows IIS, Java Tomcat, or anywhere a single importable file is required — currently RSA keys only.',
  },
  {
    q: 'Why does my browser still show an "insecure" or "not trusted" warning?',
    a: "A self-signed root CA (or a directly self-signed certificate) is not part of your OS or browser's built-in trust store, so the browser cannot verify the authenticity of the chain — this warning is expected, not a bug. To remove it, manually import the generated certificate into your system or browser trust store (see the next question).",
  },
  {
    q: 'How do I make my browser or OS trust this certificate and clear the warning?',
    a: 'Download the root CA certificate (from "CA + Server Certificate" mode) or the certificate itself (from "Self-Signed Only" mode) and import it into your trust store: on Windows, use Certificate Manager (certmgr.msc) under "Trusted Root Certification Authorities"; on macOS, import it via Keychain Access and set it to "Always Trust"; on Linux, place it under /usr/local/share/ca-certificates/ and run update-ca-certificates (path varies by distro). In "CA + Server Certificate" mode, once the CA is imported, every certificate it issues is trusted automatically.',
  },
  {
    q: "How does a self-signed certificate differ from one issued by a public CA like Let's Encrypt? Which should I use?",
    a: "Certificates from public CAs (Let's Encrypt, DigiCert, etc.) are trusted by default across all major browsers and operating systems, and are the right choice for any production-facing domain. Self-signed certificates (whether direct or via your own CA) are only suitable for local development, internal testing, or closed-network services, since only devices that manually install the matching certificate/CA will trust them. Never use one for a production service.",
  },
  {
    q: 'Why do I need to fill in SAN (Subject Alternative Names) instead of relying on Common Name alone?',
    a: "Since 2017, major browsers such as Chrome and Safari no longer accept a certificate's Common Name for domain validation — only the DNS names or IPs listed in the subjectAltName (SAN) extension are honored. If you only set a Common Name without SAN entries, the browser may reject the connection as a domain mismatch. Always list every domain and IP you will use to access this server under SAN.",
  },
  {
    q: 'Is the generated private key safe? Is it ever uploaded to a server?',
    a: 'Never. All key generation and certificate signing here run locally in your browser using the native Web Crypto API (RSA/ECDSA/Ed25519), with no network requests involved at any point. You can even disconnect from the internet and continue generating certificates. Download your private keys and store them safely — refreshing the page clears everything from memory.',
  },
]);

export default function CertGeneratorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <CertGeneratorClient lang="en" />
    </>
  );
}
