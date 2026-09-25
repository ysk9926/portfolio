import assert from 'node:assert/strict';
import test from 'node:test';
import { extractToc } from '../lib/blog/toc';

test('duplicate heading IDs retain source lines for deterministic markdown rendering', () => {
  const toc = extractToc('## 개요\n본문\n## 개요');
  assert.deepEqual(toc.map(({ id, sourceLine }) => ({ id, sourceLine })), [
    { id: '개요', sourceLine: 1 },
    { id: '개요-1', sourceLine: 3 },
  ]);
});
