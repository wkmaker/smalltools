import type { Metadata } from 'next';
import TimeClient from '../TimeClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Target Countdown Timer - Free Online Event Countdown & Accumulator',
  description:
    'A beautiful online target countdown timer & time accumulator! Customize event title, choose time units (years, months, days, hours, mins, secs), view in full screen, and share via direct link.',
  keywords: 'target countdown timer, online timer, event countdown, time accumulator, anniversary countdown, time management, full screen timer',
  alternates: {
    canonical: 'https://tools.cjkuo.net/time/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/time/',
      en: 'https://tools.cjkuo.net/time/en/',
      'x-default': 'https://tools.cjkuo.net/time/en/',
    },
  },
  openGraph: {
    title: 'Target Countdown Timer - Free Online Event Countdown & Accumulator',
    description: 'A beautiful online target countdown timer & time accumulator with customizable event titles and fullscreen mode.',
    url: 'https://tools.cjkuo.net/time/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Target Countdown Timer - Free Online Event Countdown & Accumulator',
    description: 'A beautiful online target countdown timer & time accumulator with customizable event titles and fullscreen mode.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Target Countdown Timer',
  url: 'https://tools.cjkuo.net/time/en/',
  description: 'A beautiful online target countdown timer & time accumulator with customizable event titles and fullscreen mode.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'How does the dual-mode "Countdown" and "Time Elapsed" mechanism function?',
    a: 'Seamless bidirectional timeline calculation:\n\n① Future Events (Countdown / Remaining Time):\nWhen the specified target datetime is set in the future, the timer counts down live in days, hours, minutes, and seconds.\n\n② Past Events (Time Elapsed Accumulator):\nWhen target datetime has passed (e.g. wedding anniversary, smoke-free days, project launch), the system automatically flips to elapsed mode to track accumulated time.',
  },
  {
    q: 'What happens if I set a target date in the past?',
    a: 'Automatic transition to a milestone tracker:\n\n① Status Badge:\nThe status indicator switches dynamically from "REMAINING TIME" to "TIME ELAPSED".\n\n② Use Cases:\nIdeal for celebrating milestones (baby age, sobriety tracker, workout streaks, relationship milestones).',
  },
  {
    q: 'Can I customize which time units (years, months, days, hours, minutes, seconds) are displayed?',
    a: 'Flexible custom unit combinations:\n\n① Multi-Unit Toggles:\nCheck or uncheck individual unit boxes in setup (e.g., show only Days/Hours/Mins/Secs or Years/Months/Days).\n\n② Automatic Rebalancing:\nThe math engine dynamically redistributes the remaining duration according to your active units.',
  },
  {
    q: 'How do I share a customized countdown timer via URL with friends or a remote team?',
    a: 'Stateless parameter sharing without account logins:\n\n① One-Click Share URL:\nClick "Copy Share Link" to generate an encoded URL containing event title, target timestamp, and display units.\n\n② Instant Loading:\nRecipients open the link to view the exact customized timer immediately, suitable for bookmarking or presentation dashboards.',
  },
  {
    q: 'What features are optimized for Fullscreen Mode on large TVs or conference projectors?',
    a: 'Built for stage, venue, and boardrooms:\n\n① Distraction-Free Layout:\nHides navigation bars and scrollbars with fluid typography responsive scaling.\n\n② Dark / Light Themes:\nSupports celestial dark mode and crisp light mode for high-contrast visibility under stage lighting.',
  },
  {
    q: 'When users across different timezones open the same link, is the countdown synchronized?',
    a: 'Strict absolute UTC synchronization:\n\n① Universal Anchor:\nShareable URLs carry an exact ISO 8601 UTC timestamp.\n\n② Timezone Agnostic:\nWhether viewers reside in Tokyo, London, or Los Angeles, all timers hit zero at the exact same physical instant.',
  },
  {
    q: 'Does the timer maintain drift-free precision when running in background tabs or asleep devices?',
    a: 'Protected against browser throttle drift:\n\n① System Epoch Diffing:\nRather than incrementally accumulating `setInterval` ticks, each tick recalculates against absolute system clock deltas.\n\n② Wakeup Calibration:\nWaking a device instantly resyncs the display to the exact current millisecond.',
  },
]);

export default function TimeEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <TimeClient lang="en" />
    </>
  );
}
