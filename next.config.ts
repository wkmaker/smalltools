import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 靜態匯出模式（SSG），產出 out/ 目錄後部署至 S3
  output: 'export',

  // 尾部斜線：/tool/ 而非 /tool（S3 靜態目錄友善）
  trailingSlash: true,

  // S3 靜態匯出模式下無 Image Optimization API，需關閉優化
  images: {
    unoptimized: true,
  },
};


export default nextConfig;
