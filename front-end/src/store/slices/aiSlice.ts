import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';
import type { AiSuggestion } from '../../types';

type AiState = {
  suggestion: AiSuggestion | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string | null;
};

const initialState: AiState = {
  suggestion: null,
  status: 'idle',
  error: null,
};

export const requestSuggestion = createAsyncThunk<
  AiSuggestion,
  { prompt: string; teamContext?: string }
>('ai/suggest', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<AiSuggestion>(
      '/ai/suggestions',
      payload,
    );
    return data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ?? 'Unable to fetch AI suggestion',
    );
  }
});

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearSuggestion(state) {
      state.suggestion = null;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestSuggestion.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(requestSuggestion.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.suggestion = action.payload;
      })
      .addCase(requestSuggestion.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { clearSuggestion } = aiSlice.actions;
export default aiSlice.reducer;

