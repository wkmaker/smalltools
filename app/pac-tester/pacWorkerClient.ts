'use client';

import type { MockContext, PacBatchItemResult, PacSingleTestResult } from './types.ts';

/**
 * 主執行緒端的 Worker 生命週期管理：把使用者貼上的 PAC 腳本丟到
 * /pac-tester-worker.js（public/pac-tester-worker.js，見該檔開頭說明為何放在
 * public/ 而非交給打包器切 chunk）獨立執行緒執行，並加上逾時保護。若腳本卡死
 * （無窮迴圈、災難性回溯正則等），逾時後直接 terminate() 整個 Worker，避免主
 * 執行緒（也就是整個分頁 UI）被拖死。
 */

const PAC_WORKER_URL = '/pac-tester-worker.js';
const SINGLE_TEST_TIMEOUT_MS = 3000;
const BATCH_TEST_TIMEOUT_MS = 10000;

type PacWorkerRequest =
  | { kind: 'single'; requestId: number; pacScript: string; testUrl: string; mockContext: MockContext }
  | { kind: 'batch'; requestId: number; pacScript: string; urls: string[]; mockContext: MockContext };

type PacWorkerResponse =
  | { kind: 'single'; requestId: number; result: PacSingleTestResult }
  | { kind: 'batch'; requestId: number; results: PacBatchItemResult[] }
  | { kind: 'error'; requestId: number; message: string };

interface PendingEntry {
  resolve: (response: PacWorkerResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

let worker: Worker | null = null;
let requestSeq = 0;
const pending = new Map<number, PendingEntry>();

function rejectAllPending(message: string) {
  for (const [id, entry] of pending) {
    clearTimeout(entry.timer);
    entry.reject(new Error(message));
    pending.delete(id);
  }
}

function terminateAndReset(reason: string) {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  rejectAllPending(reason);
}

function getWorker(): Worker {
  if (worker) return worker;

  const w = new Worker(PAC_WORKER_URL);
  w.onmessage = (event: MessageEvent<PacWorkerResponse>) => {
    const data = event.data;
    const entry = pending.get(data.requestId);
    if (!entry) return;
    pending.delete(data.requestId);
    clearTimeout(entry.timer);
    entry.resolve(data);
  };
  w.onerror = () => {
    // Worker 層級例外（非逾時），全部待處理請求一併回報失敗並重建 Worker
    terminateAndReset('PAC_WORKER_CRASHED');
  };
  worker = w;
  return w;
}

function postWithTimeout(request: PacWorkerRequest, timeoutMs: number): Promise<PacWorkerResponse> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const timer = setTimeout(() => {
      pending.delete(request.requestId);
      // 逾時代表腳本仍在執行緒中卡死，唯一能救回主執行緒的方式是砍掉整個 Worker
      terminateAndReset('PAC_SCRIPT_TIMEOUT');
      reject(new Error('PAC_SCRIPT_TIMEOUT'));
    }, timeoutMs);

    pending.set(request.requestId, { resolve, reject, timer });
    w.postMessage(request);
  });
}

export class PacScriptTimeoutError extends Error {
  constructor() {
    super('PAC_SCRIPT_TIMEOUT');
    this.name = 'PacScriptTimeoutError';
  }
}

export async function runSinglePacTestSafe(
  pacScript: string,
  testUrl: string,
  mockContext: MockContext
): Promise<PacSingleTestResult> {
  const requestId = ++requestSeq;
  try {
    const res = await postWithTimeout(
      { kind: 'single', requestId, pacScript, testUrl, mockContext },
      SINGLE_TEST_TIMEOUT_MS
    );
    if (res.kind !== 'single') throw new Error(res.kind === 'error' ? res.message : 'UNEXPECTED_RESPONSE');
    return res.result;
  } catch (err) {
    if (err instanceof Error && err.message === 'PAC_SCRIPT_TIMEOUT') throw new PacScriptTimeoutError();
    throw err;
  }
}

export async function runBatchPacTestSafe(
  pacScript: string,
  urls: string[],
  mockContext: MockContext
): Promise<PacBatchItemResult[]> {
  const requestId = ++requestSeq;
  try {
    const res = await postWithTimeout(
      { kind: 'batch', requestId, pacScript, urls, mockContext },
      BATCH_TEST_TIMEOUT_MS
    );
    if (res.kind !== 'batch') throw new Error(res.kind === 'error' ? res.message : 'UNEXPECTED_RESPONSE');
    return res.results;
  } catch (err) {
    if (err instanceof Error && err.message === 'PAC_SCRIPT_TIMEOUT') throw new PacScriptTimeoutError();
    throw err;
  }
}
