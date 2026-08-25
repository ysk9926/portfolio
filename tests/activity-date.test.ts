import assert from 'node:assert/strict';
import test from 'node:test';
import { formatActivityDateLabel } from '../lib/activity/format';

test('activity dates use the portfolio calendar date in UTC server environments', () => {
  assert.equal(formatActivityDateLabel('2026-08-25'), '2026년 8월 25일 화');
});
