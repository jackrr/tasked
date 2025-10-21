"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatRelative } from "date-fns";

import Modal from "@/app/components/modal";
import { fetchTask, fetchTaskProjects, removeTaskFromProject } from "@/app/api";

export default function TaskDetailModal({
  taskId,
  projectId,
  ...modalProps
}: Omit<React.ComponentProps<typeof Modal>, "children"> & {
  taskId: string;
  projectId: string;
}) {
  const { data: task } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask(taskId),
  });

  const { data: projects } = useQuery({
    queryKey: ["task_projects", taskId],
    queryFn: () => fetchTaskProjects(taskId),
  });

  const queryClient = useQueryClient();

  const removeProject = useMutation({
    mutationFn: removeTaskFromProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_tasks", projectId] });
    },
  });

  if (!task) return null;

  return (
    <Modal {...modalProps}>
      <h1>{task.title}</h1>
      <p>{task.description}</p>
      <p>
        {task.dueDate
          ? formatRelative(task.dueDate, new Date())
          : "No due date"}
      </p>
      <p>{task.status}</p>
      {projects?.map((p) => (
        <div
          key={p.id}
          role="button"
          onClick={() => removeProject.mutate({ taskId, projectId: p.id })}
        >
          {p.title}
        </div>
      ))}
    </Modal>
  );
}
