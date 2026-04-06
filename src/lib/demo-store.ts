import type {
  Admin,
  SessionPayload,
  Tag,
  Task,
  TaskComment,
  TaskInput,
  User,
  Workspace,
} from "@/lib/types";

type DemoState = {
  workspace: Workspace;
  users: Array<User & { password: string }>;
  admins: Admin[];
  tags: Tag[];
  tasks: Task[];
};

const STORAGE_KEY = "taskflow_demo_state_v1";
const SESSION_KEY = "taskflow_demo_session_v1";

const now = "2026-04-05T18:00:00.000Z";

const workspace: Workspace = {
  id: 1,
  name: "TaskFlow Studio",
  slug: "taskflow-studio",
  plan: "Pro",
  createdAt: now,
};

const users: Array<User & { password: string }> = [
  {
    id: 1,
    name: "Ronald Oliveira",
    email: "ronald@taskflow.dev",
    role: "Owner",
    createdAt: now,
    password: "taskflow123",
  },
  {
    id: 2,
    name: "Bianca Alves",
    email: "bianca@taskflow.dev",
    role: "Product Manager",
    createdAt: now,
    password: "taskflow123",
  },
  {
    id: 3,
    name: "Carlos Lima",
    email: "carlos@taskflow.dev",
    role: "Tech Lead",
    createdAt: now,
    password: "taskflow123",
  },
];

const admins: Admin[] = [
  {
    id: 1,
    name: "Ronald",
    role: "Founder",
    email: "ronald@taskflow.dev",
    createdAt: now,
  },
  {
    id: 2,
    name: "Bianca",
    role: "Product Manager",
    email: "bianca@taskflow.dev",
    createdAt: now,
  },
  {
    id: 3,
    name: "Carlos",
    role: "Tech Lead",
    email: "carlos@taskflow.dev",
    createdAt: now,
  },
  {
    id: 4,
    name: "Aline",
    role: "Finance Ops",
    email: "aline@taskflow.dev",
    createdAt: now,
  },
  {
    id: 5,
    name: "Marina",
    role: "AI Specialist",
    email: "marina@taskflow.dev",
    createdAt: now,
  },
];

const tags: Tag[] = [
  { id: 1, name: "Produto", color: "blue", createdAt: now },
  { id: 2, name: "IA", color: "cyan", createdAt: now },
  { id: 3, name: "Urgente", color: "rose", createdAt: now },
  { id: 4, name: "Financeiro", color: "amber", createdAt: now },
];

function comment(
  id: number,
  taskId: number,
  authorName: string,
  authorRole: string,
  body: string,
  createdAt: string,
): TaskComment {
  return { id, taskId, authorName, authorRole, body, createdAt };
}

function activity(
  id: number,
  taskId: number,
  actorName: string,
  actorRole: string,
  action: string,
  createdAt: string,
) {
  return { id, taskId, actorName, actorRole, action, createdAt };
}

const tasks: Task[] = [
  {
    id: 1,
    title: "Estruturar onboarding de clientes",
    description:
      "Definir checklist inicial, mensagens automáticas e primeira entrega do time.",
    status: "backlog",
    priority: "alta",
    dueDate: "2026-04-08",
    assignees: [admins[0], admins[1]],
    notes: "Criar fluxo simples para demo e deixar espaço para automações depois.",
    checklist:
      "Mapear etapas principais\nValidar cópias da experiência\nDefinir primeira reunião",
    referenceLink: "https://www.notion.so/",
    tags: [tags[0], tags[2]],
    comments: [
      comment(
        1,
        1,
        "Bianca Alves",
        "Product Manager",
        "Vamos priorizar a versão mais enxuta para apresentar o fluxo inteiro no portfólio.",
        "2026-04-05T14:20:00.000Z",
      ),
    ],
    activity: [
      activity(1, 1, "Ronald Oliveira", "Owner", "Criou a tarefa", "2026-04-05T12:30:00.000Z"),
      activity(
        2,
        1,
        "Bianca Alves",
        "Product Manager",
        "Adicionou um comentário",
        "2026-04-05T14:20:00.000Z",
      ),
    ],
    createdAt: now,
    updatedAt: "2026-04-05T14:20:00.000Z",
  },
  {
    id: 2,
    title: "Ajustar visão geral do dashboard",
    description:
      "Revisar cards de métricas para deixar o acompanhamento mais claro para liderança.",
    status: "em_progresso",
    priority: "media",
    dueDate: "2026-04-06",
    assignees: [admins[1], admins[2]],
    notes: "Focar em leitura rápida e consistência visual.",
    checklist: "Reduzir ruído visual\nAjustar títulos\nRevisar hierarquia",
    referenceLink: "",
    tags: [tags[0]],
    comments: [],
    activity: [
      activity(3, 2, "Carlos Lima", "Tech Lead", "Criou a tarefa", "2026-04-05T10:10:00.000Z"),
    ],
    createdAt: now,
    updatedAt: "2026-04-05T10:10:00.000Z",
  },
  {
    id: 3,
    title: "Configurar alertas de prazo",
    description:
      "Notificar o time quando tarefas de alta prioridade estiverem perto do vencimento.",
    status: "em_progresso",
    priority: "alta",
    dueDate: "2026-04-05",
    assignees: [admins[2], admins[4]],
    notes: "Pensar em evolução futura com notificações por e-mail e Slack.",
    checklist: "Criar regra de vencimento\nDefinir mensagem padrão",
    referenceLink: "",
    tags: [tags[2], tags[1]],
    comments: [],
    activity: [
      activity(4, 3, "Marina", "AI Specialist", "Criou a tarefa", "2026-04-05T09:40:00.000Z"),
    ],
    createdAt: now,
    updatedAt: "2026-04-05T09:40:00.000Z",
  },
  {
    id: 4,
    title: "Publicar área de cobrança",
    description:
      "Finalizar ajustes da seção financeira para clientes do plano premium.",
    status: "concluida",
    priority: "media",
    dueDate: "2026-04-03",
    assignees: [admins[3]],
    notes: "Entrega usada para composição do case no GitHub.",
    checklist: "Revisar layout\nConferir termos de pagamento",
    referenceLink: "",
    tags: [tags[3]],
    comments: [],
    activity: [
      activity(5, 4, "Aline", "Finance Ops", "Concluiu a tarefa", "2026-04-04T16:00:00.000Z"),
    ],
    createdAt: now,
    updatedAt: "2026-04-04T16:00:00.000Z",
  },
  {
    id: 5,
    title: "Preparar automação de status com IA",
    description:
      "Criar rotina para resumir andamento semanal com apoio de IA generativa.",
    status: "backlog",
    priority: "alta",
    dueDate: "2026-04-10",
    assignees: [admins[0], admins[4]],
    notes: "Boa tarefa para mostrar IA aplicada sem exagerar escopo.",
    checklist: "Definir prompt\nEscolher entradas\nMontar resumo final",
    referenceLink: "https://platform.openai.com/docs",
    tags: [tags[1], tags[0]],
    comments: [],
    activity: [
      activity(6, 5, "Ronald Oliveira", "Owner", "Criou a tarefa", "2026-04-05T08:15:00.000Z"),
    ],
    createdAt: now,
    updatedAt: "2026-04-05T08:15:00.000Z",
  },
];

function getInitialState(): DemoState {
  return {
    workspace,
    users,
    admins,
    tags,
    tasks,
  };
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadDemoState(): DemoState {
  if (!isBrowser()) {
    return getInitialState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const initial = getInitialState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  return JSON.parse(raw) as DemoState;
}

export function saveDemoState(state: DemoState) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetDemoState() {
  const initial = getInitialState();
  saveDemoState(initial);
  return initial;
}

export function authenticateDemoUser(email: string, password: string) {
  const state = loadDemoState();
  const user = state.users.find(
    (item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password,
  );

  if (!user) {
    return null;
  }

  const session: SessionPayload = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    workspace: state.workspace,
  };

  if (isBrowser()) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  return session;
}

export function loadSession() {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as SessionPayload) : null;
}

export function clearSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

export function createTagInState(name: string, color: string) {
  const state = loadDemoState();
  const nextId = Math.max(0, ...state.tags.map((tag) => tag.id)) + 1;
  const tag: Tag = {
    id: nextId,
    name,
    color,
    createdAt: new Date().toISOString(),
  };

  state.tags = [...state.tags, tag];
  saveDemoState(state);
  return { state, tag };
}

function createActivity(taskId: number, actorName: string, actorRole: string, action: string) {
  return activity(
    Math.floor(Math.random() * 1_000_000_000),
    taskId,
    actorName,
    actorRole,
    action,
    new Date().toISOString(),
  );
}

export function createTaskInState(input: TaskInput, actorName: string, actorRole: string) {
  const state = loadDemoState();
  const nextId = Math.max(0, ...state.tasks.map((task) => task.id)) + 1;
  const nextTask: Task = {
    id: nextId,
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate,
    assignees: state.admins.filter((admin) => input.assigneeIds.includes(admin.id)),
    notes: input.notes,
    checklist: input.checklist,
    referenceLink: input.referenceLink,
    tags: state.tags.filter((tag) => input.tagIds.includes(tag.id)),
    comments: [],
    activity: [createActivity(nextId, actorName, actorRole, "Criou a tarefa")],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.tasks = [nextTask, ...state.tasks];
  saveDemoState(state);
  return state;
}

export function updateTaskInState(
  taskId: number,
  input: TaskInput,
  actorName: string,
  actorRole: string,
  action = "Atualizou a tarefa",
) {
  const state = loadDemoState();

  state.tasks = state.tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          dueDate: input.dueDate,
          assignees: state.admins.filter((admin) => input.assigneeIds.includes(admin.id)),
          notes: input.notes,
          checklist: input.checklist,
          referenceLink: input.referenceLink,
          tags: state.tags.filter((tag) => input.tagIds.includes(tag.id)),
          updatedAt: new Date().toISOString(),
          activity: [createActivity(taskId, actorName, actorRole, action), ...task.activity],
        }
      : task,
  );

  saveDemoState(state);
  return state;
}

export function deleteTaskInState(taskId: number) {
  const state = loadDemoState();
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  saveDemoState(state);
  return state;
}

export function addCommentInState(
  taskId: number,
  authorName: string,
  authorRole: string,
  body: string,
) {
  const state = loadDemoState();
  const commentId = Math.floor(Math.random() * 1_000_000_000);
  const createdAt = new Date().toISOString();

  state.tasks = state.tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          comments: [
            {
              id: commentId,
              taskId,
              authorName,
              authorRole,
              body,
              createdAt,
            },
            ...task.comments,
          ],
          activity: [
            createActivity(taskId, authorName, authorRole, "Adicionou um comentário"),
            ...task.activity,
          ],
          updatedAt: createdAt,
        }
      : task,
  );

  saveDemoState(state);
  return state;
}
