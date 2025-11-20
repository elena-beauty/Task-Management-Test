import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { TeamSidebar } from '../components/TeamSidebar';
import { TodoList } from '../components/TodoList';
import { TodoFormDialog } from '../components/TodoFormDialog';
import { AddMemberDialog } from '../components/AddMemberDialog';
import { AiAssistant } from '../components/AiAssistant';
import { TopBar } from '../components/TopBar';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  addTeamMember,
  createTeam,
  fetchTeamMembers,
  fetchTeams,
  selectTeam,
} from '../store/slices/teamsSlice';
import {
  createTodo,
  deleteTodo,
  fetchTodos,
  updateTodo,
} from '../store/slices/todosSlice';
import { fetchNotifications } from '../store/slices/notificationsSlice';
import type { Todo } from '../types';
import { useRealtime } from '../hooks/useRealtime';

const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const { teams, selectedTeamId, membersByTeam, membersStatus, status } =
    useAppSelector((state) => state.teams);
  const members = membersByTeam[selectedTeamId ?? ''] ?? [];
  const todosState = useAppSelector((state) => state.todos);
  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId),
    [teams, selectedTeamId],
  );

  // Dialog state
  const [isTeamDialogOpen, setTeamDialogOpen] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', description: '' });
  const [isMemberDialogOpen, setMemberDialogOpen] = useState(false);
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  useRealtime(selectedTeamId);

  useEffect(() => {
    dispatch(fetchTeams());
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    if (selectedTeamId) {
      dispatch(fetchTodos(selectedTeamId));
      dispatch(fetchTeamMembers(selectedTeamId));
    }
  }, [dispatch, selectedTeamId]);

  const handleCreateTeam = () => {
    dispatch(createTeam(teamForm));
    setTeamDialogOpen(false);
    setTeamForm({ name: '', description: '' });
  };

  const handleCreateTodo = (payload: {
    title: string;
    description: string;
    dueDate?: string | null;
    status: Todo['status'];
    assigneeId?: string | null;
  }) => {
    if (!selectedTeamId) return;
    if (editingTodo) {
      dispatch(
        updateTodo({
          id: editingTodo.id,
          updates: { ...payload, teamId: selectedTeamId },
        }),
      );
    } else {
      dispatch(
        createTodo({
          ...payload,
          teamId: selectedTeamId,
        }),
      );
    }
    setTodoDialogOpen(false);
    setEditingTodo(null);
  };

  const handleDeleteTodo = (id: string) => {
    dispatch(deleteTodo(id));
  };

  const handleAddMember = (values: { name: string; email: string; role?: 'owner' | 'member' }) => {
    if (!selectedTeamId) return;
    dispatch(addTeamMember({ teamId: selectedTeamId, ...values }));
    setMemberDialogOpen(false);
  };

  const openNewTodoDialog = () => {
    setEditingTodo(null);
    setTodoDialogOpen(true);
  };

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <TopBar />
      <Box display="flex" flexGrow={1} minHeight={0}>
        <TeamSidebar
          teams={teams}
          selectedTeamId={selectedTeamId}
          selectedTeamRole={selectedTeam?.role}
          onSelect={(teamId) => dispatch(selectTeam(teamId))}
          onCreateTeam={() => setTeamDialogOpen(true)}
          onAddMember={() => setMemberDialogOpen(true)}
          members={members}
          isLoadingMembers={membersStatus === 'loading'}
        />
        <Box flexGrow={1} p={3} sx={{ overflowY: 'auto' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} mb={3} gap={2}>
            <Box>
              <Typography variant="h4">
                {selectedTeam?.name ?? 'Select a team'}
              </Typography>
              <Typography color="text.secondary">
                {selectedTeam?.description ??
                  'Choose a team to view its shared tasks.'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              {selectedTeam?.role === 'owner' && (
                <Button
                  variant="outlined"
                  onClick={() => setMemberDialogOpen(true)}
                  disabled={!selectedTeamId}
                >
                  Invite member
                </Button>
              )}
              <Button
                variant="contained"
                onClick={openNewTodoDialog}
                disabled={!selectedTeamId}
              >
                New task
              </Button>
            </Stack>
          </Stack>
          {status === 'failed' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load teams.
            </Alert>
          )}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            alignItems="stretch"
          >
            <Box flex={1}>
              <TodoList
                todos={todosState.items}
                onEdit={(todo) => {
                  setEditingTodo(todo);
                  setTodoDialogOpen(true);
                }}
                onDelete={handleDeleteTodo}
              />
            </Box>
            <Box flexBasis={{ xs: '100%', md: 360 }}>
              <AiAssistant teamContext={selectedTeam?.name} />
            </Box>
          </Stack>
        </Box>
      </Box>

      <Dialog
        open={isTeamDialogOpen}
        onClose={() => setTeamDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>New team</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Team name"
              value={teamForm.name}
              onChange={(event) =>
                setTeamForm((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
            <TextField
              label="Description"
              value={teamForm.description}
              onChange={(event) =>
                setTeamForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTeam}
            variant="contained"
            disabled={!teamForm.name}
          >
            Create team
          </Button>
        </DialogActions>
      </Dialog>

      <AddMemberDialog
        open={isMemberDialogOpen}
        onClose={() => setMemberDialogOpen(false)}
        onSubmit={handleAddMember}
      />

      <TodoFormDialog
        open={todoDialogOpen}
        onClose={() => {
          setTodoDialogOpen(false);
          setEditingTodo(null);
        }}
        onSubmit={handleCreateTodo}
        members={members}
        initialTodo={editingTodo}
      />
    </Box>
  );
};

export default DashboardPage;

