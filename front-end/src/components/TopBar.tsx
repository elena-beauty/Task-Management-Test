import {
  AppBar,
  Avatar,
  Badge,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { logout } from '../store/slices/authSlice';
import { clearTeams } from '../store/slices/teamsSlice';
import { clearTodos } from '../store/slices/todosSlice';

export const TopBar = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const notifications = useAppSelector((state) => state.notifications.items);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.read === b.read) {
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return a.read ? 1 : -1;
  });

  const handleLogout = () => {
    dispatch(clearTeams());
    dispatch(clearTodos());
    dispatch(logout());
  };

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" color="inherit" elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5">Team Tasks</Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time collaboration hub
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Tooltip title="Notifications">
            <IconButton onClick={handleOpenNotifications}>
              <Badge
                color="error"
                badgeContent={unreadCount}
                overlap="circular"
              >
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseNotifications}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {sortedNotifications.length === 0 && (
              <MenuItem disabled>No notifications yet</MenuItem>
            )}
            {sortedNotifications.map((notification) => (
              <MenuItem key={notification.id} dense>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: notification.read ? 400 : 600 }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notification.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar>{user?.name?.[0]}</Avatar>
            <Box textAlign="right">
              <Typography variant="subtitle2">{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Sign out">
            <IconButton onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

