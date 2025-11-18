import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { apiClient, setAuthToken } from '../../api/client';
import type { AuthResponse, AuthUser } from '../../types';

type Credentials = {
  email: string;
  password: string;
};

type Registration = Credentials & {
  name: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string | null;
};

const persistedToken = localStorage.getItem('accessToken');

const initialState: AuthState = {
  user: null,
  token: persistedToken,
  status: 'idle',
  error: null,
};

export const registerUser = createAsyncThunk<AuthResponse, Registration>(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<AuthResponse>(
        '/auth/register',
        payload,
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? 'Unable to register',
      );
    }
  },
);

export const loginUser = createAsyncThunk<AuthResponse, Credentials>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? 'Invalid credentials',
      );
    }
  },
);

export const fetchProfile = createAsyncThunk<AuthUser>(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<{ user: AuthUser }>('/auth/me');
      return data.user;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? 'Unable to fetch profile',
      );
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      setAuthToken(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        setAuthToken(action.payload.access_token);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        setAuthToken(action.payload.access_token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.user = null;
        state.token = null;
        setAuthToken(null);
      });
  },
});

export const { hydrateUser, logout } = authSlice.actions;
export default authSlice.reducer;

