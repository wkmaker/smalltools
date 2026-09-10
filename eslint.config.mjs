// ESLint 扁平設定（Flat Config）。
// Next 16 已移除 `next lint`，改用 ESLint CLI 直接讀取本檔。
// eslint-config-next v16 已原生輸出扁平設定陣列。
import next from 'eslint-config-next/core-web-vitals';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...next,
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'node_modules/**',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo',
    ],
  },
  {
    rules: {
      // 本站為 output: 'export' 靜態匯出且 images.unoptimized，next/image 最佳化無效，
      // 一律使用原生 <img>，此規則不適用。
      '@next/next/no-img-element': 'off',

      // 以下為 eslint-plugin-react-hooks v7 新增的 React Compiler 就緒性「建議規則」，
      // 非既有錯誤：本專案所有 'use client' 工具頁皆需在 effect 內同步 window / localStorage /
      // 動態 import 的狀態（即 AGENTS 手冊記載的 isMountedRef 慣例），屬正當用法。
      // 降為 warning 保留訊號以攔截新程式碼的「純衍生狀態誤用 effect」，但不阻斷 CI。
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
];

export default config;
