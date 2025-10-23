import { useState } from "react";
import { formatRelative } from "date-fns";
import Image from "next/image";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Title } from "@/app/components/field";
import {
  addTaskToProject,
  searchTasks,
  deleteTask,
  fetchTaskProjects,
  Task as TaskType,
  persistField,
  STATUS_ORDER,
} from "@/app/api";
import { useDebounce } from "@/app/hooks";
import ConfirmationModal from "@/app/components/confirmation-modal";
import Status from "@/app/components/status";

export default function Task({
  task,
  openDetails,
  projectId,
  projectTaskIds,
  focused,
}: {
  task: TaskType;
  openDetails: () => void;
  projectId: string;
  projectTaskIds: Set<string>;
  focused?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { value: debouncedQuery } = useDebounce(searchQuery, 200);
  const { data: tasks } = useQuery({
    queryKey: ["tasks", debouncedQuery],
    queryFn: () => searchTasks(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const selectTask = useMutation({
    mutationFn: addTaskToProject,
  });

  const { data: taskProjects } = useQuery({
    queryKey: ["projects", "task", task.id],
    queryFn: () => fetchTaskProjects(task.id),
  });

  const transitionStatus = useMutation({
    mutationFn: () =>
      persistField({
        entityId: task.id,
        entityType: "tasks",
        field: "status",
        value:
          STATUS_ORDER[
            (STATUS_ORDER.indexOf(task.status) + 1) % STATUS_ORDER.length
          ],
      }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
  });
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  function handleDeleteRequest() {
    if (
      (task.description && task.description.length > 0) ||
      (taskProjects && taskProjects?.length > 1) // is in other project
    ) {
      setConfirmingDelete(task.id);
    } else {
      deleteTaskMutation.mutate(task.id);
    }
  }

  const matchingTasksInOtherProject = tasks
    ? tasks.filter((t) => !projectTaskIds.has(t.id))
    : [];

  return (
    <div className="grid grid-cols-[24px_1fr_24px_24px] px-2 py-1 gap-x-4 border-b border-(--color-background) hover:border-(--color-foreground)">
      <div
        role="button"
        className="w-24px h-24px"
        onClick={() => {
          if (task.status === STATUS_ORDER[STATUS_ORDER.length - 1]) {
            // on terminal status, open detail modal instead of transitioning
            openDetails();
          } else {
            transitionStatus.mutate();
          }
        }}
      >
        <Status status={task.status} />
      </div>
      <Title
        entityId={task.id}
        entityType={"tasks"}
        focused={focused}
        value={task.title}
        onDelete={handleDeleteRequest}
        onChange={(value) => setSearchQuery(value)}
      />
      {matchingTasksInOtherProject.length > 0 && (
        // FIXME: is this looking right?
        <ul className="absolute top-full left-0 p-2">
          {matchingTasksInOtherProject.map((t, idx) => (
            <li
              className={`${idx < matchingTasksInOtherProject.length - 1 ? "border-b-0" : ""} border border-(--color-foreground) rounded-xs px-2 py-1 cursor-pointer`}
              role="button"
              key={t.id}
              onClick={() => selectTask.mutate({ taskId: t.id, projectId })}
            >
              + Add <em>{t.title}</em> to this project
            </li>
          ))}
        </ul>
      )}

      {task.dueDate && formatRelative(task.dueDate, new Date())}
      <button onClick={openDetails}>...</button>
      <ConfirmationModal
        open={!!confirmingDelete}
        toggleOpen={() => setConfirmingDelete(null)}
        confirm={() => {
          if (confirmingDelete) deleteTaskMutation.mutate(confirmingDelete);
          setConfirmingDelete(null);
        }}
        header="Delete this task?"
      />
    </div>
  );
}
