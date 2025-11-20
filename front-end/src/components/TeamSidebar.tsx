import {
  Box,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import type { Team, TeamMember, TeamRole } from '../types';

type Props = {
  teams: Team[];
  selectedTeamId?: string;
  selectedTeamRole?: TeamRole;
  onSelect: (teamId: string) => void;
  onCreateTeam: () => void;
  onAddMember: () => void;
  members: TeamMember[];
  isLoadingMembers: boolean;
};

export const TeamSidebar = ({
  teams,
  selectedTeamId,
  selectedTeamRole,
  onSelect,
  onCreateTeam,
  onAddMember,
  members,
  isLoadingMembers,
}: Props) => {
  const isOwner = selectedTeamRole === 'owner';
  
  return (
    <Box
      sx={{
        width: 280,
        backgroundColor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box px={2} py={3}>
        <Typography variant="h6">Teams</Typography>
        <Stack direction="column" spacing={1} mt={2}>
          {isOwner && (
            <Button variant="contained" onClick={onCreateTeam} fullWidth>
              New Team
            </Button>
          )}
          {isOwner && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={onAddMember}
              fullWidth
              disabled={!selectedTeamId}
            >
              Invite Member
            </Button>
          )}
        </Stack>
      </Box>
    <Divider />
    <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
      <List>
        {teams.map((team) => (
          <ListItemButton
            key={team.id}
            selected={team.id === selectedTeamId}
            onClick={() => onSelect(team.id)}
          >
            <ListItemText
              primary={team.name}
              secondary={team.description}
            />
          </ListItemButton>
        ))}
        {teams.length === 0 && (
          <Box px={2} py={4}>
            <Typography color="text.secondary" variant="body2">
              No teams yet. Create one to get started.
            </Typography>
          </Box>
        )}
      </List>
    </Box>
    <Divider />
    <Box px={2} py={2}>
      <Typography variant="subtitle2">Members</Typography>
      {isLoadingMembers ? (
        <Stack alignItems="center" py={2}>
          <CircularProgress size={20} />
        </Stack>
      ) : (
        <List dense sx={{ maxHeight: 200, overflowY: 'auto' }}>
          {members.map((member) => (
            <ListItem key={member.id} disablePadding>
              <ListItemText
                primary={member.user_name ?? "User name"}
                secondary={member.role}
              />
            </ListItem>
          ))}
          {members.length === 0 && (
            <Typography variant="body2" color="text.secondary" mt={1}>
              No members yet.
            </Typography>
          )}
        </List>
      )}
    </Box>
  </Box>
  );
};

