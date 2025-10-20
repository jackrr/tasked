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

export async function createProject(title: string) {
  await fetch(`${BASE_URL}/projects`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });
}
