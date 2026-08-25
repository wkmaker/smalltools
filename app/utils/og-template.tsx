import React from 'react';

export interface OgTemplateProps {
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  accentColor?: string; // e.g. '#dc2626' 或 '#0284c7'
  badgeList?: string[];
  lang?: 'zh' | 'en';
}

export function OgImageTemplate({
  title,
  subtitle,
  description,
  category,
  accentColor = '#0284c7',
  badgeList = ['免費即時', '隱私安全', '高速計算'],
  lang = 'zh',
}: OgTemplateProps) {
  const isEn = lang === 'en';
  const defaultBadges = isEn
    ? ['100% Free & Online', 'Private & Safe', 'Instant Results']
    : badgeList;

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        backgroundImage: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
        position: 'relative',
        fontFamily: '"Noto Sans TC", sans-serif',
      }}
    >
      {/* 背景柔和氛圍流光 Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '-5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor} 0%, rgba(255,255,255,0) 65%)`,
          opacity: 0.14,
          filter: 'blur(70px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-5%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #38bdf8 0%, rgba(255,255,255,0) 65%)',
          opacity: 0.12,
          filter: 'blur(70px)',
        }}
      />

      {/* 主體亮色毛玻璃卡片 (Apple-Style Clean Glass Card) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '1120px',
          height: '550px',
          padding: '46px 52px',
          borderRadius: '32px',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 頂部科技流光飾條 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: `linear-gradient(90deg, #38bdf8 0%, ${accentColor} 50%, #6366f1 100%)`,
          }}
        />

        {/* Header 列：品牌識別與分類 Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Smalltools Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(2, 132, 199, 0.25)',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '-0.03em',
              }}
            >
              Smalltools
            </span>
          </div>

          {/* Category Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 20px',
              borderRadius: '9999px',
              backgroundColor: `${accentColor}12`,
              border: `1px solid ${accentColor}35`,
              color: accentColor,
              fontSize: '17px',
              fontWeight: 700,
              letterSpacing: '0.03em',
            }}
          >
            {category}
          </div>
        </div>

        {/* Main 核心內容區 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            marginTop: '8px',
          }}
        >
          {subtitle && (
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: accentColor,
                textTransform: 'uppercase',
              }}
            >
              {subtitle}
            </div>
          )}

          <div
            style={{
              fontSize: title.length > 18 ? '48px' : '56px',
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxWidth: '980px',
            }}
          >
            {description.split('\n').map((line, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: '22px',
                  fontWeight: 400,
                  color: '#334155',
                  lineHeight: 1.45,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Footer 底部特性標籤與網址 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          {/* Feature Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {defaultBadges.map((badge, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#334155',
                  fontSize: '15px',
                  fontWeight: 400,
                }}
              >
                <div
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: accentColor,
                  }}
                />
                {badge}
              </div>
            ))}
          </div>

          {/* Domain */}
          <div
            style={{
              fontSize: '18px',
              fontWeight: 400,
              color: '#64748b',
              letterSpacing: '0.04em',
            }}
          >
            tools.cjkuo.net
          </div>
        </div>
      </div>
    </div>
  );
}
