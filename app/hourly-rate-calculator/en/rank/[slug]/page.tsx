import type { Metadata } from 'next';
import HourlyRateCalculatorClient from '../../../HourlyRateCalculatorClient';
import milestoneData from '../../../config/percentile_milestones.json';

interface RankPageProps {
  params: Promise<{ slug: string }>;
}

function findMilestone(slug: string) {
  const s = slug.toLowerCase();
  return milestoneData.find(
    (m) =>
      m.id.toLowerCase() === s ||
      m.slug.toLowerCase() === s ||
      `pr${m.pr}` === s ||
      `pr${m.pr < 10 ? '0' + m.pr : m.pr}` === s
  );
}

export async function generateStaticParams() {
  const milestones = milestoneData;
  return milestones.map((m) => {
    const prCode = `pr${m.pr < 10 ? '0' + m.pr : m.pr}`;
    return { slug: prCode };
  });
}

export async function generateMetadata({ params }: RankPageProps): Promise<Metadata> {
  const { slug } = await params;
  const matched = findMilestone(slug);
  const milestoneLabel = matched ? (matched.label_en || matched.label) : 'Taiwan Salary Percentile';
  const milestonePr = matched ? matched.pr : 50;
  const milestoneDesc = matched ? (matched.desc_en || matched.desc) : 'Calculate your real hourly earnings and migration matches.';

  const title = `【${milestoneLabel} (PR ${milestonePr})】Taiwan Worker Salary Ranking - Real Hourly Rate Calculator`;
  const description = `【PR ${milestonePr} - ${milestoneLabel}】${milestoneDesc} Calculate net hourly earnings after commute and unpaid overtime.`;
  const canonicalUrl = `https://tools.cjkuo.net/hourly-rate-calculator/en/rank/${slug}/`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'zh-TW': `https://tools.cjkuo.net/hourly-rate-calculator/rank/${slug}/`,
        en: canonicalUrl,
        'x-default': canonicalUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Smalltools',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: 'https://tools.cjkuo.net/support.svg',
          width: 1200,
          height: 630,
          alt: `${milestoneLabel} (PR ${milestonePr}) Taiwan Worker Salary Rating`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://tools.cjkuo.net/support.svg'],
    },
  };
}

export default async function EnglishRankPage({ params }: RankPageProps) {
  const { slug } = await params;
  const matched = findMilestone(slug);
  const milestoneLabel = matched ? (matched.label_en || matched.label) : 'Taiwan Salary Percentile';
  const milestonePr = matched ? matched.pr : 50;
  const milestoneDesc = matched ? (matched.desc_en || matched.desc) : 'Calculate your real hourly earnings and migration matches.';
  const canonicalUrl = `https://tools.cjkuo.net/hourly-rate-calculator/en/rank/${slug}/`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `【${milestoneLabel} (PR ${milestonePr})】Taiwan Salary Ranking`,
    description: milestoneDesc,
    url: canonicalUrl,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HourlyRateCalculatorClient
        initialSlug={slug}
        initialPr={matched ? matched.pr : undefined}
        lang="en"
      />
    </>
  );
}
