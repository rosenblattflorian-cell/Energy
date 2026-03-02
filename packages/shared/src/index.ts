import { z } from 'zod';

export const Roles = ['ADMIN', 'SALES', 'TECH', 'INSTALL', 'ACCOUNTING'] as const;
export type Role = (typeof Roles)[number];

export const Statuses = [
  'LEAD',
  'QUALIFIED',
  'SURVEY',
  'PROPOSAL',
  'CONTRACT',
  'SCHEDULED',
  'INSTALLED',
  'INVOICED',
  'PAID'
] as const;
export type Status = (typeof Statuses)[number];

const transitions: Record<Status, Status[]> = {
  LEAD: ['QUALIFIED'],
  QUALIFIED: ['SURVEY'],
  SURVEY: ['PROPOSAL'],
  PROPOSAL: ['CONTRACT'],
  CONTRACT: ['SCHEDULED'],
  SCHEDULED: ['INSTALLED'],
  INSTALLED: ['INVOICED'],
  INVOICED: ['PAID'],
  PAID: []
};

export function canTransition(from: string, to: string): boolean {
  if (!(from in transitions)) return false;
  return (transitions as Record<string, string[]>)[from].includes(to);
}

export const LeadIntakeSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(30),
  message: z.string().min(5).max(2000),
  source: z.enum(['web', 'phone', 'partner']).default('web'),
  website: z.string().max(0).optional().default('')
});
