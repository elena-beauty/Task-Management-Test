import {
  Alert,
  Box,
  Button,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { loginUser, registerUser } from '../store/slices/authSlice';

export default function AuthPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useAppSelector((state) => state.auth);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (token && status === 'succeeded') {
      navigate('/', { replace: true });
    }
  }, [token, status, navigate]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'login') {
      dispatch(loginUser({ email: form.email, password: form.password }));
    } else {
      dispatch(registerUser(form));
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ background: 'linear-gradient(120deg, #0066ff, #764ba2)' }}
    >
      <Paper sx={{ width: 420, p: 4, borderRadius: 4 }}>
        <Typography variant="h4" mb={1}>
          Team Tasks
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Collaborate with your team in real time.
        </Typography>
        <Tabs
          value={mode}
          onChange={(_event, value) => setMode(value)}
          variant="fullWidth"
        >
          <Tab label="Sign In" value="login" />
          <Tab label="Create Account" value="register" />
        </Tabs>
        <Box
          component="form"
          mt={3}
          display="flex"
          flexDirection="column"
          gap={2}
          onSubmit={handleSubmit}
        >
          {mode === 'register' && (
            <TextField
              label="Full name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          )}
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            helperText="Must be at least 8 characters"
            required
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={status === 'loading'}
          >
            {status === 'loading'
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

