"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Admin,
  DashboardSummary,
  SessionPayload,
  Tag,
  Task,
  TaskFilters,
  TaskInput,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";
import {
  addCommentInState,
  clearSession,
  createTagInState,
  createTaskInState,
  deleteTaskInState,
  loadDemoState,
  loadSession,
  resetDemoState,
  updateTaskInState,
} from "@/lib/demo-store";

const emptyForm: TaskInput = {
  title: "",
  description: "",
  status: "backlog",
  priority: "media",
  dueDate: null,
  assigneeIds: [],
  notes: "",
  checklist: "",
  referenceLink: "",
  tagIds: [],
};

const tagColors = ["blue", "cyan", "emerald", "amber", "rose", "violet"] as const;

const statusLabel: Record<TaskStatus, string> = {
  backlog: "Backlog",
  em_progresso: "Em progresso",
  concluida: "Concluída",
};

const priorityLabel: Record<TaskPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

const statusTone: Record<TaskStatus, string> = {
  backlog: "border-white/10 bg-white/6 text-slate-200",
  em_progresso: "border-sky-400/25 bg-sky-400/12 text-sky-100",
  concluida: "border-emerald-400/20 bg-emerald-400/12 text-emerald-100",
};

const priorityTone: Record<TaskPriority, string> = {
  baixa: "border-white/10 bg-white/6 text-slate-200",
  media: "border-amber-400/20 bg-amber-400/12 text-amber-100",
  alta: "border-rose-400/20 bg-rose-400/12 text-rose-100",
};

const tagTone: Record<string, string> = {
  blue: "border-blue-400/20 bg-blue-400/12 text-blue-100",
  cyan: "border-cyan-400/20 bg-cyan-400/12 text-cyan-100",
  emerald: "border-emerald-400/20 bg-emerald-400/12 text-emerald-100",
  amber: "border-amber-400/20 bg-amber-400/12 text-amber-100",
  rose: "border-rose-400/20 bg-rose-400/12 text-rose-100",
  violet: "border-violet-400/20 bg-violet-400/12 text-violet-100",
};

function formatDate(date: string | null) {
  if (!date) {
    return "Sem prazo";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));
}

function formatDateInput(date: string | null) {
  return date ?? "";
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatChecklist(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function groupTasks(tasks: Task[]) {
  return {
    backlog: tasks.filter((task) => task.status === "backlog"),
    em_progresso: tasks.filter((task) => task.status === "em_progresso"),
    concluida: tasks.filter((task) => task.status === "concluida"),
  };
}

function getRandomTagColor() {
  return tagColors[Math.floor(Math.random() * tagColors.length)];
}

function toTaskInput(task: Task): TaskInput {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    assigneeIds: task.assignees.map((assignee) => assignee.id),
    notes: task.notes,
    checklist: task.checklist,
    referenceLink: task.referenceLink,
    tagIds: task.tags.map((tag) => tag.id),
  };
}

function getActor(session: SessionPayload | null) {
  return {
    actorName: session?.user.name ?? "Sistema",
    actorRole: session?.user.role ?? "Automação",
  };
}

const githubPagesUrl = process.env.NEXT_PUBLIC_GITHUB_PAGES_URL;
const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;

export function TaskflowApp() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>({
    status: "todas",
    priority: "todas",
    search: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const [createForm, setCreateForm] = useState<TaskInput>(emptyForm);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<TaskInput>(emptyForm);
  const [newTagName, setNewTagName] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFilters((current) => ({ ...current, search: deferredSearch }));
  }, [deferredSearch]);

  useEffect(() => {
    const sessionData = loadSession();

    if (!sessionData) {
      router.replace("/login");
      setIsSessionLoading(false);
      return;
    }

    setSession(sessionData);
    setIsSessionLoading(false);
  }, [router]);

  useEffect(() => {
    if (!session) {
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const state = loadDemoState();
      const filteredTasks = state.tasks.filter((task) => {
        const matchesStatus =
          !filters.status || filters.status === "todas" || task.status === filters.status;
        const matchesPriority =
          !filters.priority ||
          filters.priority === "todas" ||
          task.priority === filters.priority;
        const query = filters.search?.trim().toLowerCase() ?? "";
        const haystack = [
          task.title,
          task.description,
          task.notes,
          task.assignees.map((item) => item.name).join(" "),
          task.tags.map((item) => item.name).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        const matchesSearch = query.length === 0 || haystack.includes(query);

        return matchesStatus && matchesPriority && matchesSearch;
      });

      const total = state.tasks.length;
      const concluidas = state.tasks.filter((task) => task.status === "concluida").length;
      const emProgresso = state.tasks.filter((task) => task.status === "em_progresso").length;
      const backlog = state.tasks.filter((task) => task.status === "backlog").length;
      const altaPrioridade = state.tasks.filter((task) => task.priority === "alta").length;
      const vencendoHoje = state.tasks.filter(
        (task) => task.dueDate === new Date().toISOString().slice(0, 10),
      ).length;

      startTransition(() => {
        setTasks(filteredTasks);
        setTags(state.tags);
        setAdmins(state.admins);
        setSummary({
          total,
          concluidas,
          emProgresso,
          backlog,
          altaPrioridade,
          vencendoHoje,
          taxaConclusao: total === 0 ? 0 : Math.round((concluidas / total) * 100),
        });
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar os dados.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters, session]);

  const groupedTasks = useMemo(() => groupTasks(tasks), [tasks]);

  function openTaskDetails(task: Task) {
    setSelectedTask(task);
    setEditForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assigneeIds: task.assignees.map((assignee) => assignee.id),
      notes: task.notes,
      checklist: task.checklist,
      referenceLink: task.referenceLink,
      tagIds: task.tags.map((tag) => tag.id),
    });
    setFeedback(null);
    setError(null);
  }

  function closeTaskDetails() {
    setSelectedTask(null);
    setEditForm(emptyForm);
  }

  async function refreshTasks() {
    const state = loadDemoState();
    const filteredTasks = state.tasks.filter((task) => {
      const matchesStatus =
        !filters.status || filters.status === "todas" || task.status === filters.status;
      const matchesPriority =
        !filters.priority || filters.priority === "todas" || task.priority === filters.priority;
      const query = filters.search?.trim().toLowerCase() ?? "";
      const haystack = [
        task.title,
        task.description,
        task.notes,
        task.assignees.map((item) => item.name).join(" "),
        task.tags.map((item) => item.name).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = query.length === 0 || haystack.includes(query);

      return matchesStatus && matchesPriority && matchesSearch;
    });

    const total = state.tasks.length;
    const concluidas = state.tasks.filter((task) => task.status === "concluida").length;
    const emProgresso = state.tasks.filter((task) => task.status === "em_progresso").length;
    const backlog = state.tasks.filter((task) => task.status === "backlog").length;
    const altaPrioridade = state.tasks.filter((task) => task.priority === "alta").length;
    const vencendoHoje = state.tasks.filter(
      (task) => task.dueDate === new Date().toISOString().slice(0, 10),
    ).length;

    setTasks(filteredTasks);
    setSummary({
      total,
      concluidas,
      emProgresso,
      backlog,
      altaPrioridade,
      vencendoHoje,
      taxaConclusao: total === 0 ? 0 : Math.round((concluidas / total) * 100),
    });
    setTags(state.tags);
    setAdmins(state.admins);

    if (selectedTask) {
      const freshTask = state.tasks.find((task) => task.id === selectedTask.id) ?? null;
      setSelectedTask(freshTask);
    }
  }

  async function refreshTags() {
    const state = loadDemoState();
    setTags(state.tags);
    return state.tags;
  }

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const actor = getActor(session);
      createTaskInState(createForm, actor.actorName, actor.actorRole);
      await refreshTasks();
      setCreateForm(emptyForm);
      setFeedback("Tarefa criada com sucesso.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível criar a tarefa.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTask) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const actor = getActor(session);
      updateTaskInState(selectedTask.id, editForm, actor.actorName, actor.actorRole);
      await refreshTasks();
      setFeedback("Tarefa atualizada com sucesso.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível salvar a tarefa.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setIsSaving(true);
    setError(null);
    setFeedback(null);

    try {
      deleteTaskInState(id);
      await refreshTasks();
      closeTaskDetails();
      setFeedback("Tarefa removida com sucesso.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Não foi possível remover a tarefa.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateTag(target: "create" | "edit") {
    const cleanedName = newTagName.trim();

    if (!cleanedName) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const response = createTagInState(cleanedName, getRandomTagColor());
      const updatedTags = await refreshTags();
      const createdTag = response.tag;

      if (target === "create") {
        setCreateForm((current) => ({
          ...current,
          tagIds: Array.from(new Set([...current.tagIds, createdTag.id])),
        }));
      } else {
        setEditForm((current) => ({
          ...current,
          tagIds: Array.from(new Set([...current.tagIds, createdTag.id])),
        }));
      }

      setNewTagName("");
      setTags(updatedTags);
      setFeedback("Tag criada com sucesso.");
    } catch (tagError) {
      setError(
        tagError instanceof Error ? tagError.message : "Não foi possível criar a tag.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMoveTask(task: Task, nextStatus: TaskStatus) {
    if (task.status === nextStatus) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const actor = getActor(session);
      updateTaskInState(
        task.id,
        {
          ...toTaskInput(task),
          status: nextStatus,
        },
        actor.actorName,
        actor.actorRole,
        "Moveu a tarefa no board",
      );

      await refreshTasks();
      setFeedback("Tarefa movida com sucesso.");
    } catch (moveError) {
      setError(
        moveError instanceof Error
          ? moveError.message
          : "Não foi possível mover a tarefa.",
      );
    } finally {
      setIsSaving(false);
      setDraggedTaskId(null);
    }
  }

  async function handleAddComment() {
    if (!selectedTask || !commentDraft.trim()) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const actor = getActor(session);
      addCommentInState(selectedTask.id, actor.actorName, actor.actorRole, commentDraft.trim());
      setCommentDraft("");
      await refreshTasks();
      setFeedback("Comentário adicionado com sucesso.");
    } catch (commentError) {
      setError(
        commentError instanceof Error
          ? commentError.message
          : "Não foi possível publicar o comentário.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    clearSession();
    router.push("/login");
    router.refresh();
  }

  if (isSessionLoading || !session) {
    return (
      <main className="grid-overlay relative flex-1 overflow-hidden">
        <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
          <div className="panel rounded-[2rem] px-6 py-8">
            <p className="text-sm text-slate-300">Carregando workspace...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="grid-overlay relative flex-1 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.12),transparent_28%)]" />

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        <header className="panel grid gap-6 rounded-[2rem] px-5 py-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:px-6 lg:py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white shadow-[0_0_40px_rgba(59,130,246,0.4)]">
              TF
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.28em] text-accent">
                {session.workspace.name} • Plano {session.workspace.plan}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
                TaskFlow SaaS
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300 lg:max-w-xl">
                Dashboard em português com CRUD real, tags, detalhes de card e uma
                edição separada no estilo de produtos modernos de gestão.
              </p>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Workspace executivo</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {session.user.name} • {session.user.role}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              >
                Sair
              </button>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Acompanhe a operação, distribua responsabilidades e mantenha cada
              entrega com o contexto necessário para o time executar com clareza.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-sky-400/20 bg-sky-400/12 px-3 py-1.5 text-xs font-medium text-sky-100">
                Gestão de tarefas
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-slate-200">
                Múltiplos responsáveis
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-slate-200">
                Tags e checklist
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {githubPagesUrl ? (
                <a
                  href={githubPagesUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                >
                  Abrir versão GitHub Pages
                </a>
              ) : null}
              {vercelUrl ? (
                <a
                  href={vercelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-sky-400/20 bg-sky-400/12 px-4 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-400/18"
                >
                  Abrir versão Vercel
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  resetDemoState();
                  void refreshTasks();
                  setFeedback("Demo reiniciada com sucesso.");
                }}
                className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              >
                Reiniciar demo
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Tarefas totais"
            value={summary?.total ?? 0}
            detail="Volume atual do workspace"
          />
          <SummaryCard
            label="Concluídas"
            value={summary?.concluidas ?? 0}
            detail={`${summary?.taxaConclusao ?? 0}% do ciclo atual finalizado`}
          />
          <SummaryCard
            label="Em progresso"
            value={summary?.emProgresso ?? 0}
            detail="Itens ativos com responsáveis definidos"
          />
          <SummaryCard
            label="Alta prioridade"
            value={summary?.altaPrioridade ?? 0}
            detail={`${summary?.vencendoHoje ?? 0} demandas vencendo hoje`}
          />
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(340px,380px)]">
          <div className="space-y-6">
            <div className="panel rounded-[2rem] p-5 sm:p-6">
              <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
                <div className="max-w-2xl">
                  <p className="eyebrow text-xs text-accent">Central de tarefas</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
                    Dashboard operacional
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                    Abra os detalhes do card para editar tags, notas, checklist e links
                    de referência sem misturar o fluxo de criação com o de edição.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 2xl:min-w-[460px] 2xl:grid-cols-3">
                  <FilterField label="Status">
                    <select
                      value={filters.status ?? "todas"}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          status: event.target.value as TaskFilters["status"],
                        }))
                      }
                      className="input-base"
                    >
                      <option value="todas">Todas</option>
                      <option value="backlog">Backlog</option>
                      <option value="em_progresso">Em progresso</option>
                      <option value="concluida">Concluídas</option>
                    </select>
                  </FilterField>

                  <FilterField label="Prioridade">
                    <select
                      value={filters.priority ?? "todas"}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          priority: event.target.value as TaskFilters["priority"],
                        }))
                      }
                      className="input-base"
                    >
                      <option value="todas">Todas</option>
                      <option value="alta">Alta</option>
                      <option value="media">Média</option>
                      <option value="baixa">Baixa</option>
                    </select>
                  </FilterField>

                  <FilterField label="Buscar">
                    <input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Título, descrição, responsável ou tag"
                      className="input-base"
                    />
                  </FilterField>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                {(
                  [
                    ["backlog", "Backlog", groupedTasks.backlog],
                    ["em_progresso", "Em progresso", groupedTasks.em_progresso],
                    ["concluida", "Concluídas", groupedTasks.concluida],
                  ] as const
                ).map(([key, title, items]) => (
                  <div
                    key={key}
                    className="flex min-h-[320px] flex-col rounded-[1.6rem] border border-white/10 bg-white/4 p-4"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      const draggedTask = tasks.find((task) => task.id === draggedTaskId);
                      if (draggedTask) {
                        void handleMoveTask(draggedTask, key);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{title}</h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {items.length} tarefa(s) nesta etapa
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
                        {items.length.toString().padStart(2, "0")}
                      </span>
                    </div>

                    <div className="mt-4 flex-1 space-y-3">
                      {items.length === 0 ? (
                        <div className="flex min-h-[164px] items-center rounded-[1.25rem] border border-dashed border-white/10 bg-slate-950/30 p-4 text-sm leading-6 text-slate-400">
                          Nenhuma tarefa encontrada com os filtros atuais.
                        </div>
                      ) : (
                        items.map((task) => (
                          <article
                            key={task.id}
                            draggable
                            onDragStart={() => setDraggedTaskId(task.id)}
                            onDragEnd={() => setDraggedTaskId(null)}
                            className={`flex min-h-[220px] flex-col rounded-[1.25rem] border border-white/8 bg-slate-950/55 p-4 transition ${
                              draggedTaskId === task.id ? "opacity-60 ring-1 ring-sky-400/40" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold leading-6 text-white">
                                  {task.title}
                                </h4>
                                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">
                                  {task.description}
                                </p>
                              </div>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${priorityTone[task.priority]}`}
                              >
                                {priorityLabel[task.priority]}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusTone[task.status]}`}
                              >
                                {statusLabel[task.status]}
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] font-medium text-slate-200">
                                {task.assignees.length > 0
                                  ? task.assignees.map((assignee) => assignee.name).join(", ")
                                  : "Sem responsáveis"}
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] font-medium text-slate-200">
                                {formatDate(task.dueDate)}
                              </span>
                            </div>

                            {task.tags.length > 0 ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {task.tags.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${tagTone[tag.color] ?? tagTone.blue}`}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                              Arraste para outra coluna ou abra os detalhes
                            </div>

                            <div className="mt-auto pt-6">
                              <button
                                type="button"
                                onClick={() => openTaskDetails(task)}
                                className="w-full rounded-full border border-white/10 bg-white/6 px-3 py-2.5 text-xs font-medium text-white transition hover:bg-white/10"
                              >
                                Abrir detalhes
                              </button>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <InfoCard
                title="Base de produto real"
                description="O projeto já demonstra fluxo operacional, organização visual e visão de sistema."
              />
              <InfoCard
                title="UX de gestão moderna"
                description="A interface simula padrões encontrados em ferramentas profissionais usadas no mercado."
              />
              <InfoCard
                title="Arquitetura evolutiva"
                description="A base foi organizada para crescer com autenticação, times e automações futuras."
              />
            </div>

            <section className="panel rounded-[2rem] p-5 sm:p-6">
              <div className="max-w-2xl">
                <p className="eyebrow text-xs text-accent">Diferenciais do produto</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
                  Uma seção dedicada para explicar o valor do sistema
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Em vez de competir com o header, esses blocos ficam aqui embaixo,
                  onde ajudam a contextualizar melhor a proposta do projeto e sua
                  maturidade como produto.
                </p>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {[
                  {
                    title: "Operação centralizada",
                    description:
                      "Tarefas, responsáveis e contexto organizados em uma única visão.",
                  },
                  {
                    title: "Prioridade com clareza",
                    description:
                      "Destaque o que exige atenção agora e reduza gargalos do time.",
                  },
                  {
                    title: "Execução com contexto",
                    description:
                      "Cada tarefa reúne detalhes suficientes para o time agir com segurança.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex flex-col justify-between rounded-[1.6rem] border border-white/10 bg-white/5 px-5 py-5"
                  >
                    <p className="text-base font-semibold text-white">{item.title}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="panel rounded-[2rem] p-5 sm:p-6 xl:sticky xl:top-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow text-xs text-accent">Nova tarefa</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                  Criar item rápido
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              Use este painel para cadastrar tarefas novas e deixe os detalhes mais
              avançados para a lateral de edição.
            </p>

            <TaskForm
              form={createForm}
              setForm={setCreateForm}
              admins={admins}
              tags={tags}
              tagInputLabel="Criar tag"
              newTagName={newTagName}
              onTagNameChange={setNewTagName}
              onCreateTag={() => handleCreateTag("create")}
              onSubmit={handleCreateTask}
              submitLabel={isSaving ? "Salvando..." : "Criar tarefa"}
              isSaving={isSaving}
              compact
            />

            {error ? <Feedback kind="error">{error}</Feedback> : null}
            {feedback ? <Feedback kind="success">{feedback}</Feedback> : null}
          </aside>
        </section>

        {selectedTask ? (
          <EditTaskPanel
            task={selectedTask}
            form={editForm}
            setForm={setEditForm}
            admins={admins}
            tags={tags}
            newTagName={newTagName}
            onTagNameChange={setNewTagName}
            onCreateTag={() => handleCreateTag("edit")}
            onClose={closeTaskDetails}
            onSubmit={handleUpdateTask}
            onDelete={() => handleDelete(selectedTask.id)}
            commentDraft={commentDraft}
            onCommentDraftChange={setCommentDraft}
            onAddComment={() => void handleAddComment()}
            isSaving={isSaving}
          />
        ) : null}

        {isLoading ? (
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            Carregando tarefas...
          </div>
        ) : null}
      </section>
    </main>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 text-sm text-slate-300">
      <span className="block">{label}</span>
      {children}
    </div>
  );
}

function TaskForm({
  form,
  setForm,
  admins,
  tags,
  newTagName,
  onTagNameChange,
  onCreateTag,
  onSubmit,
  submitLabel,
  isSaving,
  compact = false,
  tagInputLabel,
}: {
  form: TaskInput;
  setForm: React.Dispatch<React.SetStateAction<TaskInput>>;
  admins: Admin[];
  tags: Tag[];
  newTagName: string;
  onTagNameChange: (value: string) => void;
  onCreateTag: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  isSaving: boolean;
  compact?: boolean;
  tagInputLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <FilterField label="Título">
        <input
          className="input-base"
          value={form.title}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
          placeholder="Ex.: Preparar sprint comercial"
        />
      </FilterField>

      <FilterField label="Descrição">
        <textarea
          className={`input-base resize-none ${compact ? "min-h-24" : "min-h-28"}`}
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="Descreva o contexto, a entrega e o objetivo da tarefa."
        />
      </FilterField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FilterField label="Status">
          <select
            className="input-base"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as TaskStatus,
              }))
            }
          >
            <option value="backlog">Backlog</option>
            <option value="em_progresso">Em progresso</option>
            <option value="concluida">Concluída</option>
          </select>
        </FilterField>

        <FilterField label="Prioridade">
          <select
            className="input-base"
            value={form.priority}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                priority: event.target.value as TaskPriority,
              }))
            }
          >
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </FilterField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FilterField label="Responsável">
          <div className="rounded-[1.2rem] border border-white/10 bg-white/4 p-3">
            <div className="flex flex-wrap gap-2">
              {admins.map((admin) => {
                const isSelected = form.assigneeIds.includes(admin.id);

                return (
                  <button
                    key={admin.id}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        assigneeIds: isSelected
                          ? current.assigneeIds.filter((id) => id !== admin.id)
                          : [...current.assigneeIds, admin.id],
                      }))
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      isSelected
                        ? "border-sky-400/25 bg-sky-400/12 text-sky-100"
                        : "border-white/10 bg-white/4 text-slate-200 hover:bg-white/8"
                    }`}
                  >
                    {admin.name} - {admin.role}
                  </button>
                );
              })}
            </div>
          </div>
        </FilterField>

        <FilterField label="Prazo">
          <input
            type="date"
            className="input-base"
            value={formatDateInput(form.dueDate)}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                dueDate: event.target.value || null,
              }))
            }
          />
        </FilterField>
      </div>

      <FilterField label="Tags">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = form.tagIds.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      tagIds: isSelected
                        ? current.tagIds.filter((id) => id !== tag.id)
                        : [...current.tagIds, tag.id],
                    }))
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isSelected
                      ? tagTone[tag.color] ?? tagTone.blue
                      : "border-white/10 bg-white/4 text-slate-200 hover:bg-white/8"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              className="input-base"
              value={newTagName}
              onChange={(event) => onTagNameChange(event.target.value)}
              placeholder={tagInputLabel}
            />
            <button
              type="button"
              onClick={onCreateTag}
              className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Criar
            </button>
          </div>
        </div>
      </FilterField>

      {!compact ? (
        <>
          <FilterField label="Notas internas">
            <textarea
              className="input-base min-h-24 resize-none"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Pontos importantes, decisões e próximos cuidados."
            />
          </FilterField>

          <FilterField label="Checklist simples">
            <textarea
              className="input-base min-h-24 resize-none"
              value={form.checklist}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  checklist: event.target.value,
                }))
              }
              placeholder={"Um item por linha\nEx.: Revisar copy\nValidar layout"}
            />
          </FilterField>

          <FilterField label="Link de referência">
            <input
              className="input-base"
              value={form.referenceLink}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  referenceLink: event.target.value,
                }))
              }
              placeholder="https://..."
            />
          </FilterField>
        </>
      ) : null}

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function EditTaskPanel({
  task,
  form,
  setForm,
  admins,
  tags,
  newTagName,
  onTagNameChange,
  onCreateTag,
  onClose,
  onSubmit,
  onDelete,
  commentDraft,
  onCommentDraftChange,
  onAddComment,
  isSaving,
}: {
  task: Task;
  form: TaskInput;
  setForm: React.Dispatch<React.SetStateAction<TaskInput>>;
  admins: Admin[];
  tags: Tag[];
  newTagName: string;
  onTagNameChange: (value: string) => void;
  onCreateTag: () => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  commentDraft: string;
  onCommentDraftChange: (value: string) => void;
  onAddComment: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/54 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        aria-label="Fechar painel de edição"
      />

      <aside className="panel relative z-10 h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 px-5 py-6 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-xs text-accent">Detalhes do card</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
              {task.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Edite o conteúdo principal e preencha informações adicionais como notas,
              checklist e link de referência.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Fechar
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <MiniInfo
            label="Responsáveis"
            value={
              task.assignees.length > 0
                ? task.assignees.map((assignee) => assignee.name).join(", ")
                : "Sem responsáveis"
            }
          />
          <MiniInfo label="Prazo" value={formatDate(task.dueDate)} />
          <MiniInfo label="Atualizado" value={formatDate(task.updatedAt.slice(0, 10))} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <TaskForm
              form={form}
              setForm={setForm}
              admins={admins}
              tags={tags}
              newTagName={newTagName}
              onTagNameChange={onTagNameChange}
              onCreateTag={onCreateTag}
              onSubmit={onSubmit}
              submitLabel={isSaving ? "Salvando..." : "Salvar alterações"}
              isSaving={isSaving}
              tagInputLabel="Nova tag"
            />
          </div>

          <div className="space-y-4">
            <SideCard title="Resumo do card">
              <p className="text-sm leading-7 text-slate-300">{task.description}</p>
            </SideCard>

            <SideCard title="Checklist">
              <div className="space-y-2">
                {formatChecklist(task.checklist).length > 0 ? (
                  formatChecklist(task.checklist).map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-sm text-slate-200"
                    >
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Nenhum item adicionado.</p>
                )}
              </div>
            </SideCard>

            <SideCard title="Comentários">
              <div className="space-y-3">
                <textarea
                  className="input-base min-h-24 resize-none"
                  value={commentDraft}
                  onChange={(event) => onCommentDraftChange(event.target.value)}
                  placeholder="Escreva uma atualização, decisão ou observação importante."
                />
                <button
                  type="button"
                  disabled={isSaving || !commentDraft.trim()}
                  onClick={onAddComment}
                  className="w-full rounded-full border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Publicar comentário
                </button>

                <div className="space-y-3">
                  {task.comments.length > 0 ? (
                    task.comments.slice(0, 4).map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-[1.1rem] border border-white/10 bg-white/4 px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-white">
                            {comment.authorName}
                          </p>
                          <span className="text-xs text-slate-400">
                            {formatDateTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                          {comment.authorRole}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-300">
                          {comment.body}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">
                      Nenhum comentário registrado até agora.
                    </p>
                  )}
                </div>
              </div>
            </SideCard>

            <SideCard title="Atividade recente">
              <div className="space-y-3">
                {task.activity.length > 0 ? (
                  task.activity.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-[1.1rem] border border-white/10 bg-white/4 px-3 py-3"
                    >
                      <p className="text-sm font-medium text-white">
                        {activity.actorName}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-slate-300">
                        {activity.action}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {activity.actorRole} • {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    A atividade recente aparecerá aqui conforme o time interagir com a tarefa.
                  </p>
                )}
              </div>
            </SideCard>

            <SideCard title="Ações">
              <button
                type="button"
                disabled={isSaving}
                onClick={onDelete}
                className="w-full rounded-full border border-rose-400/20 bg-rose-400/12 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/18 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Excluir tarefa
              </button>
            </SideCard>
          </div>
        </div>
      </aside>
    </div>
  );
}

function SideCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className="panel rounded-[1.75rem] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
        {value}
      </p>
      <p className="mt-3 text-sm text-sky-100">{detail}</p>
    </article>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
    </article>
  );
}

function Feedback({
  kind,
  children,
}: {
  kind: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        kind === "error"
          ? "mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"
          : "mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
      }
    >
      {children}
    </div>
  );
}
