'use client';

import { useEffect, useRef } from 'react';
import type { EChartsType } from 'echarts/core';

export interface TrendChartSeries {
  /** 圖例與 tooltip 顯示名稱 */
  name: string;
  /**
   * 依 xLabels 順序排列的數值，tooltip 原樣顯示此值。
   * 若 stackOnPrevious 為 true，這裡要傳「當層本身的量」（例如利息增量），
   * 不是累加後的高度——疊圖的視覺高度由 ECharts 的 stack 機制加總，不由本元件計算。
   */
  data: number[];
  /** 折線與圖例顏色：[暗色模式, 亮色模式] */
  colorDark: string;
  colorLight: string;
  /** 漸層填色起始色（不傳則不畫面積）：[暗色模式, 亮色模式] */
  areaColorDark?: string;
  areaColorLight?: string;
  /** true 時與其他 stackOnPrevious 數列疊加（用於堆疊區域圖，例如本金 + 利息） */
  stackOnPrevious?: boolean;
  dashed?: boolean;
  lineWidth?: number;
}

export interface TrendChartProps {
  xLabels: string[];
  series: TrendChartSeries[];
}

function getCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function isLightTheme(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'light';
}

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString('zh-TW')}`;
}

/**
 * 主題感知的金融趨勢折線／堆疊區域圖，取代各工具原本的自製 Canvas 手繪圖表。
 * 只服務「單一數列折線」與「兩數列堆疊區域」這兩種既有版面，不做成通用圖表框架。
 */
export default function TrendChart({ xLabels, series }: TrendChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsType | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!containerRef.current || xLabels.length < 2) {
        chartRef.current?.dispose();
        chartRef.current = null;
        return;
      }

      const [echarts, { LineChart }, { GridComponent, TooltipComponent }, { CanvasRenderer }] = await Promise.all([
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

      const light = isLightTheme();
      const textPrimary = getCssVar('--text-primary', '#ffffff');
      const textSecondary = getCssVar('--text-secondary', '#94a3b8');
      const gridColor = getCssVar('--card-border', 'rgba(255, 255, 255, 0.08)');
      const tooltipBg = getCssVar('--card-bg-solid', '#0b0b0e');

      const echartsSeries = series.map((s) => {
        const lineColor = light ? s.colorLight : s.colorDark;
        const areaColor = light ? s.areaColorLight : s.areaColorDark;

        return {
          name: s.name,
          type: 'line' as const,
          data: s.data,
          stack: s.stackOnPrevious ? 'trend' : undefined,
          showSymbol: false,
          lineStyle: {
            color: lineColor,
            width: s.lineWidth ?? 2.5,
            type: s.dashed ? ('dashed' as const) : ('solid' as const),
          },
          itemStyle: { color: lineColor },
          areaStyle: areaColor
            ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: areaColor },
                  { offset: 1, color: 'transparent' },
                ]),
              }
            : undefined,
        };
      });

      const option = {
        backgroundColor: 'transparent',
        animationDuration: 300,
        tooltip: {
          trigger: 'axis' as const,
          backgroundColor: tooltipBg,
          borderColor: gridColor,
          borderWidth: 1,
          textStyle: { color: textPrimary, fontSize: 12 },
          formatter: (params: unknown) => {
            if (!Array.isArray(params) || params.length === 0) return '';
            const dataIndex = (params[0] as { dataIndex: number }).dataIndex;
            const lines = [
              `<div style="font-weight:600;margin-bottom:4px;color:${textPrimary}">${xLabels[dataIndex]}</div>`,
            ];
            series.forEach((s) => {
              lines.push(
                `<div style="display:flex;justify-content:space-between;gap:12px;color:${textSecondary}"><span>${s.name}</span><b style="color:${textPrimary};margin-left:8px">${formatCurrency(s.data[dataIndex])}</b></div>`,
              );
            });
            return lines.join('');
          },
        },
        grid: {
          left: 8, right: 12, top: 16, bottom: 24, containLabel: true,
        },
        xAxis: {
          type: 'category' as const,
          boundaryGap: false,
          data: xLabels,
          axisLine: { lineStyle: { color: gridColor } },
          axisLabel: {
            color: textSecondary,
            fontSize: 11,
            interval: 'auto' as const,
          },
        },
        yAxis: {
          type: 'value' as const,
          splitLine: { lineStyle: { color: gridColor, type: 'dashed' as const } },
          axisLabel: {
            color: textSecondary,
            fontSize: 11,
            formatter: (v: number) => formatCurrency(v),
          },
        },
        series: echartsSeries,
      };

      chart.setOption(option, true);
    };

    void render();

    let resizeFrame: number | null = null;
    const handleResize = () => {
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => chartRef.current?.resize());
    };
    window.addEventListener('resize', handleResize, { passive: true });

    const themeObserver = new MutationObserver(() => void render());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      cancelled = true;
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      window.removeEventListener('resize', handleResize);
      themeObserver.disconnect();
    };
  }, [xLabels, series]);

  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
