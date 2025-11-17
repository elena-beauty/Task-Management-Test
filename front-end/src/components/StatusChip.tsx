import { Chip } from '@mui/material';
import type { TodoStatus } from '../types';

const statusColors: Record<TodoStatus, 'default' | 'success' | 'warning' | 'error'> = {
  backlog: 'default',
  in_progress: 'warning',
  done: 'success',
  blocked: 'error',
};

const statusLabels: Record<TodoStatus, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
};

type Props = {
  status: TodoStatus;
};

export const StatusChip = ({ status }: Props) => (
  <Chip label={statusLabels[status]} color={statusColors[status]} size="small" />
);

