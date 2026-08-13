import type { Metadata } from 'next';
import QrGeneratorClient from '../QrGeneratorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Designer QR Code Generator - Free Online Art QR Code, Logo Embedding & Vector SVG Output',
  description:
    'Free online Designer QR Code Generator! Supports custom dot styles, dual gradients, center logo embedding, automatic 30% error correction, and PNG/SVG/WEBP vector export.',
  keywords:
    'QR Code Generator, Designer QR Code, Art QR Code, QR Code with Logo, Vector QR Code, SVG QR Code, Free QR Code',
  alternates: {
    canonical: 'https://tools.cjkuo.net/qr-generator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/qr-generator/',
      en: 'https://tools.cjkuo.net/qr-generator/en/',
      'x-default': 'https://tools.cjkuo.net/qr-generator/en/',
    },
  },
  openGraph: {
    title: 'Designer QR Code Generator - Free Online Art QR Code, Logo Embedding & Vector SVG Output',
    description: 'Instantly design your artistic QR Code. Supports dot styles, gradients, center logo, and vector SVG output.',
    url: 'https://tools.cjkuo.net/qr-generator/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Designer QR Code Generator - Free Online Art QR Code, Logo Embedding & Vector SVG Output',
    description: 'Instantly design your artistic QR Code with custom gradients, center logo, and vector SVG output.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Designer QR Code Generator',
  url: 'https://tools.cjkuo.net/qr-generator/en/',
  description: 'Free professional designer QR Code generator supporting liquid dot styles, gradients, and center logo embedding.',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'Is my data safe with this QR Code generator? Are my inputs saved on any server?',
    a: 'Completely safe! This tool runs 100% on the client-side (Browser-Based). All encoding, image generation, and card processing occur entirely within your browser. Your input text, contact details, and uploaded logos are never sent or stored on any server, ensuring total privacy and zero tracking.',
  },
  {
    q: 'Will embedding a center Logo cause QR Code scanning to fail?',
    a: 'No. QR Codes feature built-in Error Correction. When you upload a Logo, this tool automatically boosts error correction to Level H (30%), allowing smartphones to scan and decode the QR code reliably even with up to 30% center coverage.',
  },
  {
    q: 'Why is vector SVG format recommended over PNG or WEBP?',
    a: 'SVG is a resolution-independent vector format that scales endlessly without pixelation, ideal for large print, billboards, and design software (Illustrator/Figma). Inline SVG also reduces HTTP requests, boosting website Core Web Vitals and SEO performance. PNG and WEBP are raster formats; WEBP offers superior compression for web image SEO, while PNG provides lossless transparency for social sharing.',
  },
  {
    q: 'Do generated QR Codes expire or have scan limits? Is it really free?',
    a: '100% free and permanent! All QR Codes generated are static codes where data is encoded directly into the matrix without redirect servers. There are no scan limits, no expiration dates, and zero ads. As long as your destination link remains valid, the QR code will work forever.',
  },
  {
    q: 'How do I create a vCard QR Code that saves contact info automatically?',
    a: 'Select the "Contact vCard" tab and enter your details to generate a standard vCard QR Code. Smartphone cameras will prompt "Add to Contacts" when scanned. Note: Due to OS security policies on iOS/Android, camera scanning alone may omit extended fields like addresses or notes. We recommend using our "Download .vcf Contact File" button to send a .vcf file directly for 100% full-field contact import.',
  },
  {
    q: 'Who is this Designer QR Code generator best suited for?',
    a: 'It is ideal for: ① Marketers & Designers: Creating posters, branded gradient QR codes, and exporting vector SVGs; ② Business & Restaurant Owners: Guiding Google reviews, social pages, digital menus, or instant WiFi connection; ③ Event Organizers & HR: Registration links, PDF downloads, calendar events (.ics), and offline PWA usage; ④ General Users: Sharing vCard contact cards or home WiFi passwords effortlessly.',
  },
]);

export default function QrGeneratorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <QrGeneratorClient lang="en" />
    </>
  );
}
