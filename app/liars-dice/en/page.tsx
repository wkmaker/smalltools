import type { Metadata } from 'next';
import LiarsDiceClient from '../LiarsDiceClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Liar\'s Dice Roller - Anti-Cheat Timer & Top 5 History Logs',
  description:
    'Online Liar\'s Dice roller designed for party and bar games! Features an anti-cheat timer showing time elapsed since the last roll, cup cover, and top 5 roll history.',
  keywords: 'Liar\'s Dice, Dice Roller, Anti-cheat Timer, Party Game, Bar Games, Dice Cup Cover, Top 5 History',
  alternates: {
    canonical: 'https://tools.cjkuo.net/liars-dice/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/liars-dice/',
      en: 'https://tools.cjkuo.net/liars-dice/en/',
      'x-default': 'https://tools.cjkuo.net/liars-dice/en/',
    },
  },
  openGraph: {
    title: 'Liar\'s Dice Roller - Anti-Cheat Timer & Top 5 History Logs',
    description: 'Online Liar\'s Dice roller with anti-cheat timer showing time elapsed since last roll and top 5 history records.',
    url: 'https://tools.cjkuo.net/liars-dice/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Liar\'s Dice Roller - Anti-Cheat Timer & Top 5 History Logs',
    description: 'Online Liar\'s Dice roller with anti-cheat timer showing time elapsed since last roll and top 5 history records.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Liar\'s Dice Roller',
  url: 'https://tools.cjkuo.net/liars-dice/en/',
  description: 'Online Liar\'s Dice roller with anti-cheat timer showing time elapsed since last roll and top 5 history records.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is the Anti-Cheat Timer and how does it prevent stealth re-rolling?',
    a: 'A dedicated fairness mechanism engineered for party and bar games:\n\n① Live Elapsed Seconds:\nEvery time the dice are rolled, the header timer resets to zero and counts upward in real-time (e.g., "Just rolled (00:05)").\n\n② Catching Re-Rolls Instantly:\nIf a player secretly re-rolls to get better dice, the timer immediately resets to 0 seconds, making unauthorized re-rolls obvious to all participants.',
  },
  {
    q: 'What are the standard rules and bidding mechanics of Liar\'s Dice?',
    a: 'Party gameplay walkthrough:\n\n① Round Start:\nEach player receives 5 dice, rolls under a covered cup, and privately peeks at their own roll.\n\n② Sequential Bidding:\nThe starting player bids on total dice across the table (e.g. "three 4s"). Successive players must raise the quantity (e.g. "four 4s") or call a higher face value (e.g. "three 5s"), or challenge the previous bid by calling "Liar / Open!".\n\n③ Showdown:\nAll players reveal cups; if total matching dice are equal to or greater than the bid, the challenger loses; otherwise, the bidder loses.',
  },
  {
    q: 'How does the "1s are Wild" rule work, and when do 1s lose wild status?',
    a: 'Wild card rules summary:\n\n① Universal Substitute:\nBy default, 1s count as wild cards and can represent whatever face value is currently being bid.\n\n② De-Wilding ("Pure 1s"):\nOnce any player bids 1s (e.g., "three 1s"), 1s immediately lose their wild card property for the remainder of the round and only count as 1s.',
  },
  {
    q: 'How should the "Cover Cup" and "Hold to Peek" features be used during in-person parties?',
    a: 'Privacy-focused cup controls:\n\n① Auto-Cover:\nWith auto-cover enabled, the frosted virtual dice cup drops immediately upon rolling, shielding dice from neighboring glances.\n\n② Hold to Peek:\nPress and hold the peek button to temporarily make the cup translucent, releasing it to instantly re-cover.',
  },
  {
    q: 'What is the purpose of the "Top 5 Roll History" log?',
    a: 'Audit trail for dispute resolution:\n\n① Timestamped Log:\nStores the exact local time and dice array for the last 5 consecutive rolls.\n\n② Resolving Disagreements:\nEasily verify whether someone accidentally touched the roll button or inspect previous hand distributions.',
  },
  {
    q: 'Does this dice roller use a cryptographically secure random number generator (RNG)?',
    a: 'Strictly unbiased digital dice:\n\n① Web Crypto & Modern PRNG:\nPowered by high-entropy browser randomness, each die face (1 to 6) has an exactly equal 16.67% probability.\n\n② Zero Pre-Programmed Biases:\nCompletely decentralized and free of predetermined roll patterns.',
  },
  {
    q: 'How do I activate Fullscreen Mode on tablets or large displays in party settings?',
    a: 'Click the "Fullscreen" button in the upper right to expand into a stage-ready table view with oversized timer typography and dynamic 3D dice physics.',
  },
  {
    q: 'Does this tool support real-time online multiplayer over the internet?',
    a: 'This web app is designed as an in-person physical party companion tool (eliminating the need to carry physical dice cups while preventing cheats via the anti-cheat timer).\n\nIf you want to play a real-time online multiplayer version with friends remotely, check out our dedicated online party game platform: Drink Games (https://dgames.cjkuo.net/), which features live multiplayer rooms, synchronized turn-based bidding, and automatic winner calculation!',
  },
]);

export default function LiarsDiceEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <LiarsDiceClient lang="en" />
    </>
  );
}
