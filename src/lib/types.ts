export type TaskStatus = "backlog" | "em_progresso" | "concluida";

export type TaskPriority = "baixa" | "media" | "alta";

export type Tag = {
  id: number;
  name: string;
  color: string;
  createdAt: string;
};

export type Admin = {
  id: number;
  name: string;
  role: string;
  email: string;
  createdAt: string;
};

export type Workspace = {
  id: number;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export type TaskComment = {
  id: number;
  taskId: number;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
};

export type TaskActivity = {
  id: number;
  taskId: number;
  actorName: string;
  actorRole: string;
  action: string;
  createdAt: string;
};

export type Task = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignees: Admin[];
  notes: string;
  checklist: string;
  referenceLink: string;
  tags: Tag[];
  comments: TaskComment[];
  activity: TaskActivity[];
  createdAt: string;
  updatedAt: string;
};

export type TaskInput = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeIds: number[];
  notes: string;
  checklist: string;
  referenceLink: string;
  tagIds: number[];
};

export type TaskFilters = {
  status?: TaskStatus | "todas";
  priority?: TaskPriority | "todas";
  search?: string;
};

export type DashboardSummary = {
  total: number;
  concluidas: number;
  emProgresso: number;
  backlog: number;
  altaPrioridade: number;
  vencendoHoje: number;
  taxaConclusao: number;
};

export type TaskResponse = {
  tasks: Task[];
  summary: DashboardSummary;
};

export type TagResponse = {
  tags: Tag[];
};

export type AdminResponse = {
  admins: Admin[];
};

export type SessionPayload = {
  user: User;
  workspace: Workspace;
};

export type TaskCommentResponse = {
  comment: TaskComment;
};
