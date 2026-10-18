'use client';

import { useEffect, useRef } from 'react';
import type { EChartsType } from 'echarts/core';

export interface KickChartPoint {
  dateLabel: string;
  minutes: number;
}

interface KickChartProps {
  points: KickChartPoint[];
  yAxisLabel: string;
}

function getCssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export default function KickChart({ points, yAxisLabel }: KickChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsType | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!containerRef.current) return;

      const [echarts, { LineChart }, { GridComponent, TooltipComponent }, { CanvasRenderer }] =
        await Promise.all([
          import('echarts/core'),
          import('echarts/charts'),
          import('echarts/components'),
          import('echarts/renderers'),
        ]);

      if (cancelled || !containerRef.current) return;
      echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

      let chart = chartRef.current;
      if (!chart) {
        chart = echarts.init(containerRef.current);
        chartRef.current = chart;
      }

      const light = document.documentElement.getAttribute('data-theme') === 'light';
      const textPrimary = getCssVar('--text-primary', '#ffffff');
      const textSecondary = getCssVar('--text-secondary', '#94a3b8');
      const gridColor = getCssVar('--card-border', 'rgba(255, 255, 255, 0.08)');
      const tooltipBg = getCssVar('--card-bg-solid', '#0b0b0e');
      const accentColor = light ? '#e11d48' : '#fb7185';
      const isNarrow = typeof window !== 'undefined' && window.innerWidth < 640;

      chart.setOption(
        {
          backgroundColor: 'transparent',
          animationDuration: 300,
          tooltip: {
            trigger: 'axis',
            backgroundColor: tooltipBg,
            borderColor: gridColor,
            borderWidth: 1,
            textStyle: { color: textPrimary, fontSize: 12 },
            formatter: (params: unknown) => {
              if (!Array.isArray(params) || params.length === 0) return '';
              const p = params[0] as { name: string; value: number };
              return `<div style="font-weight:600;margin-bottom:4px">${p.name}</div><div>耗時：<b>${p.value}</b> 分鐘</div>`;
            },
          },
          grid: {
            left: isNarrow ? 4 : 8,
            right: isNarrow ? 8 : 12,
            top: 24,
            bottom: 8,
            containLabel: true,
          },
          xAxis: {
            type: 'category',
            data: points.map((p) => p.dateLabel),
            axisLine: { lineStyle: { color: gridColor } },
            axisLabel: { color: textSecondary, fontSize: 11 },
          },
          yAxis: {
            type: 'value',
            name: yAxisLabel,
            nameTextStyle: { color: textSecondary, fontSize: 11, padding: [0, 0, 0, 4] },
            min: 0,
            splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
            axisLabel: { color: textSecondary, fontSize: 11 },
          },
          series: [
            {
              name: yAxisLabel,
              type: 'line',
              data: points.map((p) => p.minutes),
              showSymbol: true,
              symbolSize: 8,
              smooth: true,
              lineStyle: { color: accentColor, width: 2.5 },
              itemStyle: { color: accentColor },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: light ? 'rgba(225, 29, 72, 0.18)' : 'rgba(251, 113, 133, 0.25)' },
                  { offset: 1, color: 'transparent' },
                ]),
              },
            },
          ],
        },
        true,
      );
    };

    void render();

    let resizeFrame: number | null = null;
    const handleResize = () => {
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => chartRef.current?.resize());
    };
    window.addEventListener('resize', handleResize, { passive: true });

    const themeObserver = new MutationObserver(() => void render());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      cancelled = true;
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      window.removeEventListener('resize', handleResize);
      themeObserver.disconnect();
    };
  }, [points, yAxisLabel]);

  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
