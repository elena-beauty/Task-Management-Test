import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';
import type { Team, TeamMember } from '../../types';

type CreateTeamPayload = {
  name: string;
  description?: string;
};

type AddMemberPayload = {
  teamId: string;
  email: string;
  role?: 'owner' | 'member';
};

type TeamsState = {
  teams: Team[];
  membersByTeam: Record<string, TeamMember[]>;
  selectedTeamId?: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  membersStatus: 'idle' | 'loading';
  error?: string | null;
};

const initialState: TeamsState = {
  teams: [],
  membersByTeam: {},
  selectedTeamId: undefined,
  status: 'idle',
  membersStatus: 'idle',
  error: null,
};

export const fetchTeams = createAsyncThunk<Team[]>(
  'teams/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<Team[]>('/teams');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load teams');
    }
  },
);

export const createTeam = createAsyncThunk<Team, CreateTeamPayload>(
  'teams/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<Team>('/teams', payload);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Unable to create team');
    }
  },
);

export const addTeamMember = createAsyncThunk<
  TeamMember,
  AddMemberPayload
>('teams/addMember', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<TeamMember>(
      `/teams/${payload.teamId}/members`,
      {
        email: payload.email,
        role: payload.role,
      },
    );
    return data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ?? 'Unable to add member',
    );
  }
});

export const fetchTeamMembers = createAsyncThunk<
  { teamId: string; members: TeamMember[] },
  string
>('teams/members', async (teamId, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.get<TeamMember[]>(
      `/teams/${teamId}/members`,
    );
    return { teamId, members: data };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ?? 'Unable to load members',
    );
  }
});

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    selectTeam(state, action: PayloadAction<string | undefined>) {
      state.selectedTeamId = action.payload;
    },
    clearTeams(state) {
      state.teams = [];
      state.membersByTeam = {};
      state.selectedTeamId = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.teams = action.payload;
        if (
          !state.selectedTeamId &&
          action.payload.length > 0
        ) {
          state.selectedTeamId = action.payload[0].id;
        }
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.teams.push(action.payload);
        state.selectedTeamId = action.payload.id;
      })
      .addCase(addTeamMember.fulfilled, (state, action) => {
        const teamId = state.selectedTeamId;
        if (!teamId) return;
        const currentMembers = state.membersByTeam[teamId] ?? [];
        const existing = currentMembers.find(
          (member) => member.user.id === action.payload.user.id,
        );
        if (!existing) {
          state.membersByTeam[teamId] = [...currentMembers, action.payload];
        }
      })
      .addCase(fetchTeamMembers.pending, (state) => {
        state.membersStatus = 'loading';
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.membersStatus = 'idle';
        state.membersByTeam[action.payload.teamId] = action.payload.members;
      })
      .addCase(fetchTeamMembers.rejected, (state) => {
        state.membersStatus = 'idle';
      });
  },
});

export const { selectTeam, clearTeams } = teamsSlice.actions;
export default teamsSlice.reducer;

