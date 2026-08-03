import type { Metadata } from 'next';
import HourlyRateCalculatorClient from '../../HourlyRateCalculatorClient';
import milestoneData from '../../config/percentile_milestones.json';

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
  const milestoneLabel = matched ? matched.label : '全台打工人 PR 評定';
  const milestonePr = matched ? matched.pr : 50;
  const milestoneDesc = matched ? matched.desc : '快來測測你的扣除通勤與加班後的真實時薪。';

  const title = `【${milestoneLabel} (PR ${milestonePr})】全台薪資排行榜專屬評定 - 真實時薪計算器`;
  const description = `【PR ${milestonePr} - ${milestoneLabel}】${milestoneDesc} 精算扣除通勤工時、隱形加班與生活開銷後的生命真實時薪與全球生活圈適配度。`;
  const canonicalUrl = `https://tools.cjkuo.net/hourly-rate-calculator/rank/${slug}/`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Smalltools 小工具庫',
      locale: 'zh_TW',
      type: 'website',
      images: [
        {
          url: 'https://tools.cjkuo.net/support.svg',
          width: 1200,
          height: 630,
          alt: `${milestoneLabel} (PR ${milestonePr}) 全台打工人薪資評定`,
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

export default async function RankPage({ params }: RankPageProps) {
  const { slug } = await params;
  const matched = findMilestone(slug);
  const milestoneLabel = matched ? matched.label : '全台打工人 PR 評定';
  const milestonePr = matched ? matched.pr : 50;
  const milestoneDesc = matched ? matched.desc : '快來測測你的扣除通勤與加班後的真實時薪。';
  const canonicalUrl = `https://tools.cjkuo.net/hourly-rate-calculator/rank/${slug}/`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `【${milestoneLabel} (PR ${milestonePr})】全台薪資排行榜專屬評定`,
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
      />
    </>
  );
}

