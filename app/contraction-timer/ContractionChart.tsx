'use client';

import { useEffect, useRef } from 'react';
import type { EChartsType } from 'echarts/core';
import type { ChartPoint } from './engine';

export interface ContractionChartLabels {
  interval: string;
  duration: string;
  rolling: string;
  minUnit: string;
  secUnit: string;
}

interface ContractionChartProps {
  points: ChartPoint[];
  /** X 軸右界（目前時間），左界為 6 小時前或第一筆紀錄 */
  now: number;
  labels: ContractionChartLabels;
  locale: string;
}

const SIX_HOURS = 6 * 60 * 60 * 1000;

function getCssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * 宮縮 6 小時趨勢圖：時間軸 + 雙 Y 軸（左：間隔分鐘、右：持續秒數）。
 * 沿用 app/components/TrendChart.tsx 的動態載入、主題切換與 resize 節流寫法，
 * 但因需要時間軸與雙軸，獨立成工具專屬元件，不影響既有金融圖表。
 */
export default function ContractionChart({ points, now, labels, locale }: ContractionChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsType | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!containerRef.current) return;

      const [echarts, { LineChart, ScatterChart }, { GridComponent, TooltipComponent, LegendComponent }, { CanvasRenderer }] =
        await Promise.all([
          import('echarts/core'),
          import('echarts/charts'),
          import('echarts/components'),
          import('echarts/renderers'),
        ]);

      if (cancelled || !containerRef.current) return;
      echarts.use([LineChart, ScatterChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

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
      const intervalColor = light ? '#7c3aed' : '#8b5cf6';
      const durationColor = light ? '#0284c7' : '#38bdf8';

      const minX = Math.max(now - SIX_HOURS, (points[0]?.at ?? now) - 10 * 60 * 1000);
      const timeFmt = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
      const isNarrow = typeof window !== 'undefined' && window.innerWidth < 640;

      chart.setOption(
        {
          backgroundColor: 'transparent',
          animationDuration: 300,
          legend: {
            top: 0,
            textStyle: { color: textSecondary, fontSize: 12 },
            data: [labels.interval, labels.rolling, labels.duration],
            itemGap: isNarrow ? 8 : 16,
          },
          tooltip: {
            trigger: 'axis',
            backgroundColor: tooltipBg,
            borderColor: gridColor,
            borderWidth: 1,
            textStyle: { color: textPrimary, fontSize: 12 },
            valueFormatter: (v: unknown) => (v === null || v === undefined ? '—' : String(v)),
          },
          grid: {
            left: isNarrow ? 4 : 8,
            right: isNarrow ? 4 : 8,
            top: isNarrow ? 40 : 36,
            bottom: 8,
            containLabel: true,
          },
          xAxis: {
            type: 'time',
            min: minX,
            max: now,
            axisLine: { lineStyle: { color: gridColor } },
            splitLine: { show: false },
            axisLabel: {
              color: textSecondary,
              fontSize: 11,
              hideOverlap: true,
              formatter: (v: number) => timeFmt.format(v),
            },
          },
          yAxis: [
            {
              type: 'value',
              name: labels.minUnit,
              nameTextStyle: { color: textSecondary, fontSize: 11, padding: [0, 0, 0, 4] },
              min: 0,
              splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
              axisLabel: { color: textSecondary, fontSize: 11 },
            },
            {
              type: 'value',
              name: labels.secUnit,
              nameTextStyle: { color: textSecondary, fontSize: 11, padding: [0, 4, 0, 0] },
              min: 0,
              splitLine: { show: false },
              axisLabel: { color: textSecondary, fontSize: 11 },
            },
          ],
          series: [
            {
              name: labels.interval,
              type: 'line',
              yAxisIndex: 0,
              data: points.map((p) => [p.at, p.intervalMin]),
              connectNulls: false,
              showSymbol: true,
              symbolSize: 7,
              lineStyle: { color: intervalColor, width: 1.5, opacity: 0.5 },
              itemStyle: { color: intervalColor },
            },
            {
              name: labels.rolling,
              type: 'line',
              yAxisIndex: 0,
              data: points.map((p) => [p.at, p.rollingIntervalMin]),
              connectNulls: false,
              showSymbol: false,
              smooth: true,
              lineStyle: { color: intervalColor, width: 2.5, type: 'dashed' },
              itemStyle: { color: intervalColor },
            },
            {
              name: labels.duration,
              type: 'scatter',
              yAxisIndex: 1,
              data: points.map((p) => [p.at, p.durationSec]),
              symbolSize: 8,
              itemStyle: { color: durationColor, opacity: 0.85 },
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
  }, [points, now, labels, locale]);

  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
