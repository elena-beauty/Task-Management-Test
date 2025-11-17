import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';

export type Notification = {
  id: string;
  type: 'todo.created' | 'todo.updated' | 'todo.deleted';
  message: string;
  read: boolean;
  createdAt: string;
};

type NotificationsState = {
  items: Notification[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string | null;
};

const initialState: NotificationsState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchNotifications = createAsyncThunk<Notification[]>(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<Notification[]>('/notifications');
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? 'Failed to load notifications',
      );
    }
  },
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notificationReceived(state, action: PayloadAction<Notification>) {
      state.items = [action.payload, ...state.items].slice(0, 50);
    },
    clearNotifications(state) {
      state.items = [];
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { notificationReceived, clearNotifications } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;


