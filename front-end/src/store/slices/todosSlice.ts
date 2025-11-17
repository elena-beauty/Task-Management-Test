import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';
import type { Todo, TodoStatus } from '../../types';

type CreateTodoPayload = {
  title: string;
  description?: string;
  dueDate?: string | null;
  status?: TodoStatus;
  teamId: string;
  assigneeId?: string | null;
};

type UpdateTodoPayload = {
  id: string;
  updates: Partial<CreateTodoPayload>;
};

type TodosState = {
  items: Todo[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string | null;
};

const initialState: TodosState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchTodos = createAsyncThunk<Todo[], string>(
  'todos/fetch',
  async (teamId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<Todo[]>('/todos', {
        params: { teamId },
      });
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load todos');
    }
  },
);

export const createTodo = createAsyncThunk<Todo, CreateTodoPayload>(
  'todos/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<Todo>('/todos', payload);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Unable to create todo');
    }
  },
);

export const updateTodo = createAsyncThunk<Todo, UpdateTodoPayload>(
  'todos/update',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch<Todo>(`/todos/${id}`, updates);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Unable to update todo');
    }
  },
);

export const deleteTodo = createAsyncThunk<string, string>(
  'todos/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/todos/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Unable to delete todo');
    }
  },
);

const upsertTodo = (items: Todo[], todo: Todo) => {
  const idx = items.findIndex((item) => item.id === todo.id);
  if (idx >= 0) {
    items[idx] = todo;
  } else {
    items.push(todo);
  }
};

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    todoUpserted(state, action: PayloadAction<Todo>) {
      upsertTodo(state.items, action.payload);
    },
    todoDeleted(state, action: PayloadAction<string>) {
      state.items = state.items.filter((todo) => todo.id !== action.payload);
    },
    clearTodos(state) {
      state.items = [];
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(createTodo.fulfilled, (state, action) => {
        upsertTodo(state.items, action.payload);
      })
      .addCase(updateTodo.fulfilled, (state, action) => {
        upsertTodo(state.items, action.payload);
      })
      .addCase(deleteTodo.fulfilled, (state, action) => {
        state.items = state.items.filter((todo) => todo.id !== action.payload);
      });
  },
});

export const { todoUpserted, todoDeleted, clearTodos } = todosSlice.actions;
export default todosSlice.reducer;

