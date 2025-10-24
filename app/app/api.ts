import { parseISO } from "date-fns";

export const BASE_DOMAIN = "localhost:8000";
export const BASE_URL = `http://${BASE_DOMAIN}`;

type ProjectResponse = {
  id: string;
  title: string;
  description?: string;
  created_at: string;
};

type ProjectStatsResponse = {
  id: string;
  total: number;
  in_progress: number;
  todo: number;
  complete: number;
};

type TaskResponse = {
  id: string;
  title: string;
  status: string;
  description?: string;
  due_date?: string;
  created_at: string;
};

export const TASK_STATUS_SERVER_TO_USER = {
  todo: "Todo",
  in_progress: "In Progress",
  complete: "Complete",
} as const;
Object.freeze(TASK_STATUS_SERVER_TO_USER);
type TaskStatusServer = keyof typeof TASK_STATUS_SERVER_TO_USER;
export type TaskStatusUser =
  (typeof TASK_STATUS_SERVER_TO_USER)[TaskStatusServer];

export const STATUS_ORDER = [
  TASK_STATUS_SERVER_TO_USER.todo,
  TASK_STATUS_SERVER_TO_USER.in_progress,
  TASK_STATUS_SERVER_TO_USER.complete,
];

const TASK_STATUS_USER_TO_SERVER = Object.fromEntries(
  Object.entries(TASK_STATUS_SERVER_TO_USER).map(([key, value]) => [
    value,
    key,
  ]),
);
Object.freeze(TASK_STATUS_USER_TO_SERVER);

export type Project = {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
};

export type Task = {
  id: string;
  title: string;
  status: TaskStatusUser;
  description?: string;
  dueDate?: Date;
  createdAt: Date;
};

export type ProjectWithStats = Project & {
  total: number;
  complete: number;
  todo: number;
  inProgress: number;
};

function deserializeProject(p: ProjectResponse): Project {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    createdAt: parseISO(p.created_at),
  };
}

function deserializeTask(t: TaskResponse): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: TASK_STATUS_SERVER_TO_USER[t.status as TaskStatusServer],
    dueDate: t.due_date ? parseISO(t.due_date) : undefined,
    createdAt: parseISO(t.created_at),
  };
}

export async function fetchProjects(): Promise<ProjectWithStats[]> {
  const res = await fetch(`${BASE_URL}/projects`);
  const projects = ((await res.json()) as ProjectResponse[]).map(
    deserializeProject,
  );
  const idParams = projects.map((p) => `ids=${p.id}`);

  const statsRes = await fetch(
    `${BASE_URL}/projects/stats?${idParams.join("&")}`,
  );
  const stats = (await statsRes.json()) as ProjectStatsResponse[];

  return stats.map((s) => ({
    ...(projects.find((p) => p.id === s.id) as Project), // assume always have match
    total: s.total,
    complete: s.complete,
    todo: s.todo,
    inProgress: s.in_progress,
  }));
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`${BASE_URL}/projects/${id}`);
  return deserializeProject((await res.json()) as ProjectResponse);
}

export async function fetchTask(id: string): Promise<Task> {
  const res = await fetch(`${BASE_URL}/tasks/${id}`);
  return deserializeTask((await res.json()) as TaskResponse);
}

export async function deleteProject(id: string): Promise<null> {
  await fetch(`${BASE_URL}/projects/${id}`, { method: "delete" });
  return null;
}

export async function deleteTask(id: string): Promise<null> {
  await fetch(`${BASE_URL}/tasks/${id}`, { method: "delete" });
  return null;
}

export async function fetchTaskProjects(id: string): Promise<Project[]> {
  const res = await fetch(`${BASE_URL}/tasks/${id}/projects`);
  return ((await res.json()) as ProjectResponse[]).map(deserializeProject);
}

export async function fetchProjectTasks(id: string): Promise<Task[]> {
  const res = await fetch(`${BASE_URL}/projects/${id}/tasks`);
  return ((await res.json()) as TaskResponse[]).map(deserializeTask);
}

export async function searchTasks(search: string): Promise<Task[]> {
  const res = await fetch(`${BASE_URL}/tasks?search=${search}`);
  return ((await res.json()) as TaskResponse[]).map(deserializeTask);
}

export async function createTaskInProject({
  title,
  projectId,
}: {
  title: string;
  projectId: string;
}) {
  await fetch(`${BASE_URL}/projects/${projectId}/tasks`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });
}

export async function addTaskToProject({
  taskId,
  projectId,
}: {
  taskId: string;
  projectId: string;
}) {
  await fetch(`${BASE_URL}/projects/${projectId}/add_task?task_id=${taskId}`, {
    method: "post",
  });
}

export async function persistField<T>({
  entityId,
  entityType,
  field,
  value,
}: {
  entityId: string;
  entityType: "tasks" | "projects";
  field: string;
  value: T;
}) {
  const serverValue =
    field === "status"
      ? TASK_STATUS_USER_TO_SERVER[value as TaskStatusUser]
      : value;
  await fetch(`${BASE_URL}/${entityType}/${entityId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ [field]: serverValue }),
  });
}

export async function removeTaskFromProject({
  taskId,
  projectId,
}: {
  taskId: string;
  projectId: string;
}) {
  await fetch(
    `${BASE_URL}/projects/${projectId}/remove_task?task_id=${taskId}`,
    {
      method: "post",
    },
  );
}

export async function createProject(title: string) {
  await fetch(`${BASE_URL}/projects`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });
}
