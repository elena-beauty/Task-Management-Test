import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { TeamMember, Todo, TodoStatus } from '../types';
import { statusOptions } from '../constants/statusOptions';

type FormState = {
  title: string;
  description: string;
  dueDate: string;
  assigneeId: string | '';
  status: TodoStatus;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: {
    title: string;
    description: string;
    dueDate?: string | null;
    assigneeId?: string | null;
    status: TodoStatus;
  }) => void;
  members: TeamMember[];
  initialTodo?: Todo | null;
};

const defaultState: FormState = {
  title: '',
  description: '',
  dueDate: '',
  assigneeId: '',
  status: 'backlog',
};

export const TodoFormDialog = ({
  open,
  onClose,
  onSubmit,
  members,
  initialTodo,
}: Props) => {
  const [form, setForm] = useState<FormState>(defaultState);

  useEffect(() => {
    if (initialTodo) {
      setForm({
        title: initialTodo.title,
        description: initialTodo.description ?? '',
        dueDate: initialTodo.dueDate
          ? initialTodo.dueDate.substring(0, 10)
          : '',
        assigneeId: initialTodo.assignee?.id ?? '',
        status: initialTodo.status,
      });
    } else {
      setForm(defaultState);
    }
  }, [initialTodo, open]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = () => {
    onSubmit({
      title: form.title,
      description: form.description,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      status: form.status,
      assigneeId: form.assigneeId || null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialTodo ? 'Edit task' : 'New task'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
          <TextField
            multiline
            rows={3}
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
          />
          <TextField
            label="Due date"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Assignee"
            name="assigneeId"
            value={form.assigneeId}
            onChange={handleChange}
          >
            <MenuItem value="">Unassigned</MenuItem>
            {members.map((member) => (
              <MenuItem key={member.id} value={member.user.id}>
                {member.user.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {initialTodo ? 'Save changes' : 'Create task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

