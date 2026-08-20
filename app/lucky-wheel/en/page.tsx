import type { Metadata } from 'next';
import LuckyWheelClient from '../LuckyWheelClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Lucky Wheel & Slot Spinner - Free Online Random Picker & Prize Draw',
  description:
    'Free online Lucky Wheel and Slot Machine prize drawer! Customize prize titles, weights, quantities, and colors. Features fullscreen stage, realistic physics spin animation, and history log.',
  keywords: 'lucky wheel, slot machine spinner, random picker, prize draw, raffle generator, spin wheel online, decision maker, giveaway wheel',
  alternates: {
    canonical: 'https://tools.cjkuo.net/lucky-wheel/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/lucky-wheel/',
      en: 'https://tools.cjkuo.net/lucky-wheel/en/',
      'x-default': 'https://tools.cjkuo.net/lucky-wheel/en/',
    },
  },
  openGraph: {
    title: 'Lucky Wheel & Slot Spinner - Free Online Random Picker & Prize Draw',
    description: 'Free online prize wheel and slot spinner with customizable items, probability weights, physics rotation animation, sound effects, and TXT import/export.',
    url: 'https://tools.cjkuo.net/lucky-wheel/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lucky Wheel & Slot Spinner - Free Online Random Picker & Prize Draw',
    description: 'Free online prize wheel and slot spinner with customizable items, probability weights, physics rotation animation, sound effects, and TXT import/export.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Lucky Wheel & Slot Spinner',
  url: 'https://tools.cjkuo.net/lucky-wheel/en/',
  description: 'Free online Lucky Wheel and Slot Machine prize drawer supporting custom prizes, probability weights, colors, and fullscreen stage.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'How does the random drawing algorithm work? Is it completely fair and unbiased?',
    a: `100% fair and mathematically unbiased! The tool utilizes the browser's cryptographic-grade random number generator (Web Cryptography API - crypto.getRandomValues) and high-entropy randomness algorithms. Every spin angle and outcome is determined independently, eliminating any possibility of bias or predictable patterns.`,
  },
  {
    q: "How does the 'Weight' setting affect win probability and slice proportions?",
    a: `Each prize's probability is calculated by dividing its weight by the sum of weights of all currently available prizes:

1. Visual Proportion: In wheel mode, the arc angle of each slice is strictly proportional to its weight (Angle = 360° × Prize Weight / Total Weights).

2. Dynamic Rebalancing: When a prize runs out of stock (or is marked finished), it is excluded from future draws, and its probability is automatically redistributed proportionally among the remaining available items.`,
  },
  {
    q: "What is the difference between 'Lucky Wheel' and 'Slot Machine' modes?",
    a: `Both modes share the identical prize pool and probability calculations, offering distinct visual experiences:

1. Lucky Wheel: Classic circular wheel with an indicator pointer and visual slice proportions. Ideal for small gatherings, party games, and quick decisions.

2. Slot Machine: Features glowing three-reel animations, flashing neon lights, and slot sound effects. Creates casino-grade excitement, perfect for annual company galas, trade shows, and live events.`,
  },
  {
    q: "How does 'Quantity Limit' work? When should I use 'Unlimited Mode'?",
    a: `The tool offers flexible inventory management:

1. Quantity Limit Enabled: Set a fixed inventory count for each prize (e.g., Grand Prize × 1, Second Prize × 3). Each draw automatically deducts stock, and exhausted items are removed from the wheel to prevent over-awarding.

2. Unlimited Mode (Exhibition Mode): Disables stock limits, allowing items to be drawn indefinitely. Best suited for trade show giveaways, recurring party games, or daily decision-making.`,
  },
  {
    q: 'How can I quickly import large participant or prize lists? What formats are supported?',
    a: `Click the 'Import TXT/List' button to import data in two convenient formats:

1. Simple Name List: Enter one name or ID per line (e.g., 'Alice Smith'). The system automatically generates equal-weighted items.

2. Full Prize Format (CSV/TXT): Use comma-separated values 'Prize Name, Weight, Quantity' per line (e.g., 'iPad, 2, 3') to batch configure names, probabilities, and stock counts at once.

You can also click 'Export TXT' to backup your configuration for future events.`,
  },
  {
    q: "How do I use 'Fullscreen Stage Mode' for projector presentations at events?",
    a: `Click the 'Fullscreen' button at the top right to enter dedicated stage presentation mode:

1. Immersive Display: Hides administrative settings, highlighting the high-definition wheel/slot spinner, available prize counter, and recent winner banner.

2. Celebratory Confetti & Sounds: Winning a prize triggers celebratory sound effects alongside full-screen physics confetti particles to hype up the audience.`,
  },
  {
    q: 'Are employee names or prize data uploaded to any server? Will data be lost if I close the browser?',
    a: `Never uploaded — 100% private and secure!

1. Zero-Server Architecture: All participant lists, draw history, and random logic operate purely inside your browser's local memory. The tool works 100% offline without internet connectivity.

2. Local Persistence: Settings and history are automatically preserved in your browser's localStorage. Refreshing or closing the tab will not lose your configured prizes or winners log.`,
  },
]);

export default function LuckyWheelEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <LuckyWheelClient lang="en" />
    </>
  );
}
