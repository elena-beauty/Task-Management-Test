export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type TeamRole = 'owner' | 'member';

export type Team = {
  id: string;
  name: string;
  description?: string;
  owner: AuthUser;
  role: TeamRole;
  createdAt?: string;
};

export type TeamMember = {
  id: string;
  role: TeamRole;
  user: AuthUser;
};

export type TodoStatus = 'backlog' | 'in_progress' | 'done' | 'blocked';

export type Todo = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  status: TodoStatus;
  assignee?: AuthUser | null;
  team: Team;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type AiSuggestion = {
  titleSuggestion: string;
  descriptionSuggestion: string;
  recommendedStatus: TodoStatus;
  confidence: number;
  reasoning: string;
};

