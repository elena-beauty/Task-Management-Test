import type { TodoStatus } from '../types';

export const statusOptions: { label: string; value: TodoStatus }[] = [
  { label: 'Backlog', value: 'backlog' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
  { label: 'Blocked', value: 'blocked' },
];

