const BASE_URL = "http://localhost:8000";
import { parseISO } from "date-fns";

type ProjectResponse = {
  id: string;
  title: string;
  description?: string;
  created_at: string;
};

type ProjectStatsResponse = {
  id: string;
  total_tasks: number;
  completed_tasks: number;
};

type Project = {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
};

type TaskResponse = {
  id: string;
  title: string;
  status: string;
  description?: string;
  due_date?: string;
  created_at: string;
};

const TaskStatus = {
  todo: "Todo",
  in_progress: "In Progress",
  complete: "Complete",
} as const;
Object.freeze(TaskStatus);
type TaskStatusServer = keyof typeof TaskStatus;
type TaskStatusUser = (typeof TaskStatus)[TaskStatusServer];

type Task = {
  id: string;
  title: string;
  status: TaskStatusUser;
  description?: string;
  dueDate?: Date;
  createdAt: Date;
};

type ProjectWithStats = Project & {
  totalTasks: number;
  completedTasks: number;
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
    status: TaskStatus[t.status as TaskStatusServer],
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

  return stats
    .sort((a, b) => a.total_tasks - b.total_tasks)
    .map((s) => ({
      ...(projects.find((p) => p.id === s.id) as Project), // assume always have match
      totalTasks: s.total_tasks,
      completedTasks: s.completed_tasks,
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

export async function persistProjectField({
  projectId,
  field,
  value,
}: {
  projectId: string;
  field: string;
  value: string;
}) {
  console.log({ projectId, field, value });
  await fetch(`${BASE_URL}/projects/${projectId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ [field]: value }),
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
