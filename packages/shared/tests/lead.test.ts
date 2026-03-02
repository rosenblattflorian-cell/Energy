import { describe, expect, it } from 'vitest';
import { LeadIntakeSchema } from '../src/index';

describe('lead validation', () => {
  it('accepts a valid lead', () => {
    const parsed = LeadIntakeSchema.safeParse({
      name: 'Max Mustermann',
      email: 'max@example.com',
      phone: '+491234567',
      message: 'Bitte Angebot senden',
      source: 'web',
      website: ''
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const parsed = LeadIntakeSchema.safeParse({
      name: 'Max Mustermann',
      email: 'wrong',
      phone: '+491234567',
      message: 'Bitte Angebot senden',
      source: 'web',
      website: ''
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects honeypot content', () => {
    const parsed = LeadIntakeSchema.safeParse({
      name: 'Max Mustermann',
      email: 'max@example.com',
      phone: '+491234567',
      message: 'Bitte Angebot senden',
      source: 'web',
      website: 'spam'
    });
    expect(parsed.success).toBe(false);
  });
});
