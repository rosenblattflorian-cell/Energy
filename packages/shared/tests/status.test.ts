import { describe, expect, it } from 'vitest';
import { canTransition } from '../src/index';

describe('status transitions', () => {
  it('allows LEAD -> QUALIFIED', () => {
    expect(canTransition('LEAD', 'QUALIFIED')).toBe(true);
  });

  it('denies LEAD -> CONTRACT', () => {
    expect(canTransition('LEAD', 'CONTRACT')).toBe(false);
  });

  it('denies unknown statuses', () => {
    expect(canTransition('UNKNOWN', 'QUALIFIED')).toBe(false);
  });
});
