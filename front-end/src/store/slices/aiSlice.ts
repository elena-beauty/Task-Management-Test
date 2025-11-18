import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';
import type { AiSuggestion, AiChatResponse, AiChatMessage } from '../../types';

type AiState = {
  suggestion: AiSuggestion | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string | null;
  chatMessages: AiChatMessage[];
  chatStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  chatError?: string | null;
};

const initialState: AiState = {
  suggestion: null,
  status: 'idle',
  error: null,
  chatMessages: [],
  chatStatus: 'idle',
  chatError: null,
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

export const sendChatMessage = createAsyncThunk<
  AiChatResponse,
  { message: string }
>('ai/chat', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<AiChatResponse>(
      '/ai/chat',
      payload,
    );
    return data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ?? 'Unable to send chat message',
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
    addChatMessage(state, action: { payload: AiChatMessage }) {
      state.chatMessages.push(action.payload);
    },
    clearChat(state) {
      state.chatMessages = [];
      state.chatStatus = 'idle';
      state.chatError = null;
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
      })
      .addCase(sendChatMessage.pending, (state) => {
        state.chatStatus = 'loading';
        state.chatError = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.chatStatus = 'succeeded';
        // Add user message and AI response to chat history
        const userMessage: AiChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: action.meta.arg.message,
          timestamp: new Date().toISOString(),
        };
        const aiMessage: AiChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: action.payload.summary,
          timestamp: new Date().toISOString(),
        };
        state.chatMessages.push(userMessage, aiMessage);
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.chatStatus = 'failed';
        state.chatError = action.payload as string;
      });
  },
});

export const { clearSuggestion, addChatMessage, clearChat } = aiSlice.actions;
export default aiSlice.reducer;

