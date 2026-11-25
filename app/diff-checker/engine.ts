/**
 * 文本差異比對純函式引擎（Split / Unified / Merge），無 UI 依賴，可獨立單元測試。
 */
import * as Diff from 'diff';

export interface SplitRow {
  leftLineNum?: number;
  leftContent?: string;
  leftType?: 'removed' | 'unchanged' | 'empty';
  rightLineNum?: number;
  rightContent?: string;
  rightType?: 'added' | 'unchanged' | 'empty';
}

export interface UnifiedDecision {
  id: number;
  type: 'keep' | 'removed' | 'added';
  text: string;
  leftLineNum?: number;
  rightLineNum?: number;
  state: 'active' | 'skipped';
  defaultState: 'active' | 'skipped';
}

export interface DiffAnalysisResult {
  splitRows: SplitRow[];
  unifiedDecisions: UnifiedDecision[];
  addedCount: number;
  removedCount: number;
  mergedText: string;
}

export const MAX_DIFF_CHARS = 3_000_000;

export function normalizeNewlines(str: string): string {
  if (!str) return '';
  return str.replace(/\r\n/g, '\n').replace(/\n*$/, '\n');
}

export function getDiffLines(str: string): string[] {
  const lines = str.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}

export function buildMergedText(decisions: UnifiedDecision[]): string {
  return decisions
    .filter((d) => d.state === 'active')
    .map((d) => d.text)
    .join('\n');
}

export function computeDiffAnalysis(
  originalText: string,
  modifiedText: string,
  options: { ignoreCase?: boolean } = {}
): DiffAnalysisResult {
  const { ignoreCase = false } = options;
  const safeOldStr = originalText.length > MAX_DIFF_CHARS ? originalText.substring(0, MAX_DIFF_CHARS) : originalText;
  const safeNewStr = modifiedText.length > MAX_DIFF_CHARS ? modifiedText.substring(0, MAX_DIFF_CHARS) : modifiedText;

  const oldStr = normalizeNewlines(safeOldStr);
  const newStr = normalizeNewlines(safeNewStr);

  const diffParts = (Diff.diffLines as (a: string, b: string, opts?: { ignoreCase?: boolean }) => Diff.Change[])(
    oldStr,
    newStr,
    { ignoreCase }
  );

  let totalAdd = 0;
  let totalRem = 0;

  const splitRows: SplitRow[] = [];
  let leftLineNum = 1;
  let rightLineNum = 1;

  let pendingRemoved: string[] = [];
  let pendingAdded: string[] = [];

  const flushPending = () => {
    const maxLen = Math.max(pendingRemoved.length, pendingAdded.length);
    for (let i = 0; i < maxLen; i++) {
      const row: SplitRow = {};
      if (i < pendingRemoved.length) {
        row.leftLineNum = leftLineNum++;
        row.leftContent = pendingRemoved[i];
        row.leftType = 'removed';
      } else {
        row.leftType = 'empty';
      }

      if (i < pendingAdded.length) {
        row.rightLineNum = rightLineNum++;
        row.rightContent = pendingAdded[i];
        row.rightType = 'added';
      } else {
        row.rightType = 'empty';
      }
      splitRows.push(row);
    }
    pendingRemoved = [];
    pendingAdded = [];
  };

  diffParts.forEach((part) => {
    const lines = getDiffLines(part.value);
    if (part.removed) {
      pendingRemoved.push(...lines);
      totalRem += lines.length;
    } else if (part.added) {
      pendingAdded.push(...lines);
      totalAdd += lines.length;
    } else {
      flushPending();
      lines.forEach((line) => {
        splitRows.push({
          leftLineNum: leftLineNum++,
          leftContent: line,
          leftType: 'unchanged',
          rightLineNum: rightLineNum++,
          rightContent: line,
          rightType: 'unchanged',
        });
      });
    }
  });
  flushPending();

  const unifiedDecisions: UnifiedDecision[] = [];
  let uLeftNum = 1;
  let uRightNum = 1;
  let decIndex = 0;

  diffParts.forEach((part) => {
    const lines = getDiffLines(part.value);
    if (part.removed) {
      lines.forEach((line) => {
        unifiedDecisions.push({
          id: decIndex++,
          type: 'removed',
          text: line,
          leftLineNum: uLeftNum++,
          state: 'skipped',
          defaultState: 'skipped',
        });
      });
    } else if (part.added) {
      lines.forEach((line) => {
        unifiedDecisions.push({
          id: decIndex++,
          type: 'added',
          text: line,
          rightLineNum: uRightNum++,
          state: 'active',
          defaultState: 'active',
        });
      });
    } else {
      lines.forEach((line) => {
        unifiedDecisions.push({
          id: decIndex++,
          type: 'keep',
          text: line,
          leftLineNum: uLeftNum++,
          rightLineNum: uRightNum++,
          state: 'active',
          defaultState: 'active',
        });
      });
    }
  });

  return {
    splitRows,
    unifiedDecisions,
    addedCount: totalAdd,
    removedCount: totalRem,
    mergedText: buildMergedText(unifiedDecisions),
  };
}
