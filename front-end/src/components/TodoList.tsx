import {
  Box,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { format, parseISO } from 'date-fns';
import type { Todo } from '../types';
import { StatusChip } from './StatusChip';

type Props = {
  todos: Todo[];
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
};

const formatDueDate = (date?: string | null) => {
  if (!date) return 'No due date';
  try {
    return format(parseISO(date), 'MMM d, yyyy');
  } catch {
    return 'No due date';
  }
};

export const TodoList = ({ todos, onEdit, onDelete }: Props) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Tasks
      </Typography>
      <Box sx={{ maxHeight: '65vh', overflowY: 'auto' }}>
        <List>
          {todos.map((todo) => (
            <ListItem key={todo.id} sx={{ alignItems: 'flex-start' }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">{todo.title}</Typography>
                    <StatusChip status={todo.status} />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {todo.description || 'No description'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due: {formatDueDate(todo.dueDate)}
                      {todo.assignee && ` · ${todo.assignee.name}`}
                    </Typography>
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="Edit task">
                  <IconButton onClick={() => onEdit(todo)}>
                    <EditNoteIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete task">
                  <IconButton color="error" onClick={() => onDelete(todo.id)}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {todos.length === 0 && (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No tasks yet. Create one to share with your team.
            </Typography>
          )}
        </List>
      </Box>
    </CardContent>
  </Card>
);

