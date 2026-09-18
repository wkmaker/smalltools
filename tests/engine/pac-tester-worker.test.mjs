import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBatchPacTest, runSinglePacTest, SAMPLE_PAC_SCRIPT } from '../../app/pac-tester/engine.ts';

/**
 * public/pac-tester-worker.js 是 app/pac-tester/engine.ts 的手動同步副本
 * （拿掉 TypeScript 型別標註的純 JS 版本，供獨立 Worker 執行緒載入，見該檔開頭
 * 說明）。這份測試在 Node vm 沙盒中直接載入該檔案，模擬 postMessage 驅動它，
 * 並與 engine.ts 的真正實作在同一組測試案例下逐一比對輸出，確保兩邊沒有漏改
 * 而悄悄產生行為落差。
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerSourcePath = path.join(__dirname, '../../public/pac-tester-worker.js');
const workerSource = readFileSync(workerSourcePath, 'utf-8');

function createWorkerContext() {
  const posted = [];
  const sandbox = {
    postMessage: (msg) => posted.push(msg),
    performance,
    URL,
    BigInt,
    console,
  };
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(workerSource, sandbox, { filename: 'pac-tester-worker.js' });
  return { sandbox, posted };
}

function runWorkerSingle(pacScript, testUrl, mockContext) {
  const { sandbox, posted } = createWorkerContext();
  sandbox.self.onmessage({ data: { kind: 'single', requestId: 1, pacScript, testUrl, mockContext } });
  assert.equal(posted.length, 1);
  return posted[0];
}

function runWorkerBatch(pacScript, urls, mockContext) {
  const { sandbox, posted } = createWorkerContext();
  sandbox.self.onmessage({ data: { kind: 'batch', requestId: 1, pacScript, urls, mockContext } });
  assert.equal(posted.length, 1);
  return posted[0];
}

function withoutExecutionTime(result) {
  const { executionTimeMs, ...rest } = result;
  // 經 vm 沙盒產生的物件與目前 realm 的 Object.prototype 不同，deepEqual 會誤判
  // 為不相等；先做一次 JSON 往返轉換成當前 realm 的純物件再比較。
  return JSON.parse(JSON.stringify(rest));
}

test('pac-tester-worker.js: onmessage 存在且為函式（Worker 入口點）', () => {
  const { sandbox } = createWorkerContext();
  assert.equal(typeof sandbox.self.onmessage, 'function');
});

test('pac-tester-worker.js: 單一網址測試結果與 engine.ts runSinglePacTest 逐位元一致', () => {
  const mockContext = { clientIpv4: '192.168.1.100', clientIpv6: '2001:db8::100', dnsMap: {} };
  const urls = [
    'http://intranet/',
    'https://www.google.com/search',
    'https://developer.mozilla.org/en-US/',
    'https://[fc00::1]/service',
    'https://git.corp.internal/repo',
  ];

  for (const url of urls) {
    const real = runSinglePacTest(SAMPLE_PAC_SCRIPT, url, mockContext);
    const workerMsg = runWorkerSingle(SAMPLE_PAC_SCRIPT, url, mockContext);
    assert.equal(workerMsg.kind, 'single', `URL ${url} 應回傳 single 訊息`);
    assert.deepEqual(withoutExecutionTime(workerMsg.result), withoutExecutionTime(real), `URL ${url} 結果應與 engine.ts 一致`);
  }
});

test('pac-tester-worker.js: 批次測試結果與 engine.ts runBatchPacTest 逐位元一致', () => {
  const mockContext = { clientIpv4: '192.168.1.100', clientIpv6: '2001:db8::100', dnsMap: {} };
  const urls = ['http://intranet/', 'https://github.com', 'https://example.com'];
  const real = runBatchPacTest(SAMPLE_PAC_SCRIPT, urls, mockContext);
  const workerMsg = runWorkerBatch(SAMPLE_PAC_SCRIPT, urls, mockContext);
  assert.equal(workerMsg.kind, 'batch');
  assert.equal(workerMsg.results.length, real.length);
  workerMsg.results.forEach((r, i) => {
    assert.deepEqual(withoutExecutionTime(r), withoutExecutionTime(real[i]));
  });
});

test('pac-tester-worker.js: 支援 weekdayRange / timeRange 時間排程模擬且與 engine.ts 一致', () => {
  const script = `function FindProxyForURL(url, host) {
    if (weekdayRange("MON", "FRI") && timeRange(9, 18)) {
      return "PROXY work-proxy:8080";
    }
    return "DIRECT";
  }`;
  const workContext = { clientIpv4: '10.0.0.1', clientIpv6: '2001:db8::1', dnsMap: {}, simulatedDay: 'WED', simulatedHour: 14 };
  const weekendContext = { clientIpv4: '10.0.0.1', clientIpv6: '2001:db8::1', dnsMap: {}, simulatedDay: 'SUN', simulatedHour: 14 };

  const realWork = runSinglePacTest(script, 'https://example.com', workContext);
  const workerWork = runWorkerSingle(script, 'https://example.com', workContext);
  assert.deepEqual(withoutExecutionTime(workerWork.result), withoutExecutionTime(realWork));
  assert.equal(workerWork.result.status, 'PROXY');

  const realWeekend = runSinglePacTest(script, 'https://example.com', weekendContext);
  const workerWeekend = runWorkerSingle(script, 'https://example.com', weekendContext);
  assert.deepEqual(withoutExecutionTime(workerWeekend.result), withoutExecutionTime(realWeekend));
  assert.equal(workerWeekend.result.status, 'DIRECT');
});

test('pac-tester-worker.js: 支援 myIpAddress 本機 IP 分流與字串拼接備援代理，且與 engine.ts 一致', () => {
  const userClientIpScript = `
function FindProxyForURL(url, host) {
  if (isInNet(myIpAddress(), "10.1.0.0", "255.255.0.0"))
  { return "PROXY wcg1.example.com:8080; " +
  "PROXY wcg2.example.com:8080";
  }
  return "DIRECT";
}
  `;
  const mockContext = { clientIpv4: '10.1.50.20' };
  const real = runSinglePacTest(userClientIpScript, 'https://example.com/test', mockContext);
  const workerMsg = runWorkerSingle(userClientIpScript, 'https://example.com/test', mockContext);
  assert.deepEqual(withoutExecutionTime(workerMsg.result), withoutExecutionTime(real));
  assert.equal(workerMsg.result.returnString, 'PROXY wcg1.example.com:8080; PROXY wcg2.example.com:8080');
});

test('pac-tester-worker.js: 腳本例外時回傳 ERROR 狀態且與 engine.ts 一致', () => {
  const brokenScript = 'function FindProxyForURL(url, host) { return undefinedVar; }';
  const mockContext = { clientIpv4: '192.168.1.100', clientIpv6: '2001:db8::100', dnsMap: {} };
  const real = runSinglePacTest(brokenScript, 'https://example.com', mockContext);
  const workerMsg = runWorkerSingle(brokenScript, 'https://example.com', mockContext);
  assert.equal(workerMsg.result.status, 'ERROR');
  assert.equal(real.status, 'ERROR');
  assert.deepEqual(withoutExecutionTime(workerMsg.result), withoutExecutionTime(real));
});
