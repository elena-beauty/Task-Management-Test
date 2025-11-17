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
import { useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; email: string; role?: 'owner' | 'member' }) => void;
};

export const AddMemberDialog = ({ open, onClose, onSubmit }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'owner' | 'member'>('member');

  const handleSubmit = () => {
    onSubmit({ name, email, role });
    setName('');
    setEmail('');
    setRole('member');
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Invite team member</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <TextField
            select
            label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value as 'owner' | 'member')}
          >
            <MenuItem value="member">Member</MenuItem>
            <MenuItem value="owner">Owner</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!name || !email}>
          Send invite
        </Button>
      </DialogActions>
    </Dialog>
  );
};

