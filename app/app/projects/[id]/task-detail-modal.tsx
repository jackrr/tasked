"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatRelative } from "date-fns";

import Modal from "@/app/components/modal";
import { Title, Description } from "@/app/components/field";
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
      // FIXME: replace these with webhook system
      queryClient.invalidateQueries({ queryKey: ["project_tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  if (!task) return null;

  // TODO: styling to match design
  // TODO: datepicker, status stuff
  // TODO: button to delete task w/ confirm prompt

  return (
    <Modal {...modalProps}>
      <Title big entityId={task.id} entityType={"tasks"} onDelete={() => {}} />

      <Description entityId={task.id} entityType={"tasks"} />
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
