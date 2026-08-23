import type { Metadata } from 'next';
import CalendarSplitClient from '../CalendarSplitClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Google Calendar ICS Splitter - Split Large .ics Calendar Files Online',
  description:
    'Free online iCalendar (.ics) Splitter! Solve Google Calendar 1MB file size import limits by automatically splitting large calendar files into smaller compliant chunks under 1MB. 100% local in-browser processing with one-click ZIP download.',
  keywords: 'ics splitter,calendar splitter,split google calendar,google calendar import limit,icalendar split,export google calendar too large,ics chunk',
  alternates: {
    canonical: 'https://tools.cjkuo.net/calendar-split/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/calendar-split/',
      en: 'https://tools.cjkuo.net/calendar-split/en/',
      'x-default': 'https://tools.cjkuo.net/calendar-split/en/',
    },
  },
  openGraph: {
    title: 'ICS Calendar Splitter - Free Online Tool to Split Large .ics Files',
    description: 'Free online iCalendar (.ics) Splitter! Overcome Google Calendar 1MB import limit, auto split large calendars into valid <1MB chunks with ZIP download.',
    url: 'https://tools.cjkuo.net/calendar-split/en/',
    images: [
      {
        url: '/img/og-calendar-split.webp',
        width: 1200,
        height: 630,
        alt: 'ICS Calendar Splitter - Free Online Tool to Split Large .ics Files',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ICS Calendar Splitter - Free Online Tool to Split Large .ics Files',
    description: 'Free online iCalendar (.ics) Splitter! Overcome Google Calendar 1MB import limit, auto split large calendars into valid <1MB chunks with ZIP download.',
    images: ['/img/og-calendar-split.webp'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Google Calendar ICS Splitter',
  url: 'https://tools.cjkuo.net/calendar-split/en/',
  description: 'Free online iCalendar (.ics) Splitter to overcome Google Calendar 1MB import file size limitations.',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'Why does Google Calendar fail to import my exported calendar?',
    a: 'Google Calendar has a strict file size limit (usually ~1MB to 1.8MB) for web uploads.\n\nWhen you export a calendar with years of history, the resulting `.ics` file is often 5MB to 20MB. Splitting the file into valid chunks under 1MB allows smooth batch importing without server timeouts.',
  },
  {
    q: 'Will recurring events or timezone settings be lost after splitting?',
    a: 'Not at all!\n\n① Full Global Headers Preserved:\nAll `VCALENDAR` properties and `VTIMEZONE` blocks from the original file are replicated in every single split chunk header.\n\n② Intact Event Blocks:\nEach `VEVENT` component (including recurrence rules `RRULE`, alarms `VALARM`, descriptions, and locations) is kept completely intact.',
  },
  {
    q: 'Is it safe to upload my personal or corporate calendar data?',
    a: '100% safe and private!\n\nAll text parsing, splitting, and ZIP packaging are performed locally in your web browser memory. No data is ever transmitted to any external server. It even functions seamlessly without an internet connection.',
  },
  {
    q: 'Should I choose 900 KB or 950 KB as the split threshold?',
    a: 'We recommend 950 KB or 900 KB. Setting a threshold slightly below the 1MB cap provides a safe margin for headers and ensures guaranteed acceptance by Google Calendar import filters.',
  },
  {
    q: 'Does this tool support Apple Calendar and Microsoft Outlook .ics files?',
    a: 'Yes! The generated `.ics` files adhere strictly to RFC 5545 standards and are fully compatible with Apple Calendar (macOS/iOS), Outlook, Thunderbird, and any iCalendar-supported application.',
  },
]);

export default function CalendarSplitEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <CalendarSplitClient lang="en" />
    </>
  );
}
