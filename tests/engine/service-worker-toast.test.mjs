import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

describe('ServiceWorkerRegister 更新通知樣式回歸測試', () => {
  const tsxPath = path.join(rootDir, 'app/components/ServiceWorkerRegister.tsx');
  const cssPath = path.join(rootDir, 'app/components/ServiceWorkerRegister.module.css');
  const globalsPath = path.join(rootDir, 'app/globals.css');

  const tsxContent = fs.readFileSync(tsxPath, 'utf-8');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  const globalsContent = fs.readFileSync(globalsPath, 'utf-8');

  it('JSX 中引用的無 fallback CSS 變數皆須於 globals.css 有定義，避免按鈕背景變透明隱形', () => {
    const varRefs = [...tsxContent.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)\s*\)/g)].map((m) => m[1]);
    assert.ok(varRefs.length > 0, '預期 ServiceWorkerRegister.tsx 有使用全域 CSS 變數');

    for (const cssVar of varRefs) {
      const defPattern = new RegExp(`${cssVar}\\s*:`);
      assert.match(
        globalsContent,
        defPattern,
        `ServiceWorkerRegister.tsx 引用了未於 globals.css 定義的 CSS 變數：${cssVar}`,
      );
    }
  });

  it('CSS Module 須完整定義暗色與亮色模式的通知卡片、狀態點與按鈕樣式', () => {
    for (const selector of ['.toastCard', '.statusDot', '.updateBtn', '.dismissBtn']) {
      assert.ok(cssContent.includes(selector), `缺少樣式類別：${selector}`);
      assert.ok(
        cssContent.includes(`:global([data-theme='light']) ${selector}`),
        `缺少亮色模式高對比覆寫：:global([data-theme='light']) ${selector}`,
      );
    }
  });
});
