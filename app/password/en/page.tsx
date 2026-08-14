import type { Metadata } from 'next';
import PasswordGeneratorClient from '../PasswordGeneratorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Secure Password Generator - Free Online CSPRNG & Passphrase Tool',
  description:
    'Free online CSPRNG cryptographically secure password generator! Customize length, uppercase/lowercase letters, digits, and symbols with live entropy evaluation.',
  keywords: 'Password Generator,CSPRNG,secure password,random password generator,strong password,password strength,passphrase generator,cryptographic random password,random password builder',
  alternates: {
    canonical: 'https://tools.cjkuo.net/password/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/password/',
      en: 'https://tools.cjkuo.net/password/en/',
      'x-default': 'https://tools.cjkuo.net/password/en/',
    },
  },
  openGraph: {
    title: 'Secure Password Generator - Free Online CSPRNG & Passphrase Tool',
    description: 'Cryptographically secure client-side password generator with live strength analysis.',
    url: 'https://tools.cjkuo.net/password/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Secure Password Generator - Free Online CSPRNG & Passphrase Tool',
    description: 'Cryptographically secure client-side password generator with live strength analysis.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Secure Password Generator',
  url: 'https://tools.cjkuo.net/password/en/',
  description: 'Free online cryptographically secure CSPRNG random password generator.',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)? How is it different from standard random numbers?',
    a: `CSPRNG (Cryptographically Secure Pseudo-Random Number Generator) is a randomness generator engine designed to meet strict cryptographic security standards.

Standard random functions like JavaScript's Math.random() produce deterministic pseudo-random numbers with predictable internal states, making them vulnerable to cryptographic attacks and reverse engineering.

This tool strictly uses the browser's native window.crypto.getRandomValues() API, powered by operating system entropy sources (such as hardware noise and system interrupts) to guarantee true unpredictability and uniform distribution.`,
  },
  {
    q: 'Is it safe to generate passwords on a website? Are generated passwords uploaded or sent to any server?',
    a: `100% Safe! This tool operates entirely on the client side inside your web browser memory.

All password generation, entropy calculation, and local history management are executed locally without making any HTTP network requests to any backend server.

You can verify this by turning off your internet connection or turning on Airplane mode—the password generator will continue to function seamlessly. Furthermore, passwords are never stored in localStorage or external databases; refreshing the page clears all session memory.`,
  },
  {
    q: 'How is password strength and entropy calculated? How long should a password be for optimal security?',
    a: `Password security is quantified by cryptographic Entropy (measured in bits), calculated via the formula Entropy = Length * log2(Character_Pool_Size).

Entropy represents the mathematical computational difficulty required for a brute-force attack:

① 8-digit numbers only (~26.5 bits): Cracked within milliseconds.
② 12-character mixed letters and digits (~71.4 bits): Takes years of computing power.
③ 16-character mixed with symbols (>100 bits): Requires billions of years for modern supercomputers to crack.

We recommend setting password length to at least 16 characters with a full mix of uppercase, lowercase, numbers, and symbols.`,
  },
  {
    q: 'What do the "Exclude ambiguous characters" and "Strict mode" settings do?',
    a: `These options enhance both practical usability and cryptographic security:

① Exclude ambiguous characters: Automatically filters out visually confusing character pairs (such as uppercase 'I' vs lowercase 'l', number '0' vs letter 'O', number '1' vs letter 'l'). This prevents user entry errors when passwords are read visually or typed manually on mobile devices.

② Strict mode (Include from each set): Ensures that at least one character is randomly drawn from every selected character set (uppercase, lowercase, digits, symbols), preventing statistical bias during short length sampling.`,
  },
  {
    q: 'Why do some systems reject passwords with special symbols? How can I fix this?',
    a: `Certain legacy web applications, database tools, or remote VPN services enforce restrictive input validation or escape rules for special characters.

To solve this compatibility issue, our tool categorizes symbols into two option sets:
① Common Symbols (!@#$%^&*_-+=): Widely accepted across modern identity providers and standard web forms.
② Other Symbols (()[]{}.,:;?): Contains brackets and punctuation marks which legacy systems might disallow.

If a service rejects your generated password, try unchecking "Other Symbols" while keeping "Common Symbols" enabled.`,
  },
  {
    q: 'How to create memorably secure passwords using the Passphrase principle?',
    a: `For master passwords or PINs that you need to memorize without relying on a password manager, the "Passphrase" technique is highly recommended:

Combine 4 to 5 randomly chosen unrelated words separated by hyphens or symbols (e.g., correct-horse-battery-staple-2026).

A Passphrase exceeding 20 characters offers extremely high entropy against brute-force attacks while remaining easy for human memory to retain via visual association.`,
  },
  {
    q: 'Security Best Practices & Usage Disclaimer',
    a: `[Security Best Practices & Usage Disclaimer]

① We recommend saving generated passwords using a reputable end-to-end encrypted password manager (such as Bitwarden, 1Password, or KeePass).

② Always enable Two-Factor Authentication (2FA / MFA) on critical platforms like primary emails, financial banking accounts, and social media.

③ This tool is provided free of charge for password generation and entropy estimation. Users are solely responsible for managing and safeguarding their generated credentials. The author and website accept no liability for credential loss or security incidents on third-party services.`,
  },
]);

export default function PasswordEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <PasswordGeneratorClient lang="en" />
    </>
  );
}

