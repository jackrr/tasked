import { useState } from "react";
import { formatRelative } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Title, DueDate } from "@/app/components/field";
import {
  addTaskToProject,
  searchTasks,
  Task as TaskType,
  persistField,
  STATUS_ORDER,
} from "@/app/api";
import { useDebounce } from "@/app/hooks";
import TaskDeleteHandler from "./delete-task";

import Status from "@/app/components/status";

export default function Task({
  task,
  projectId,
  projectTaskIds,
  focused,
  addTask,
}: {
  task: TaskType;
  projectId: string;
  projectTaskIds: Set<string>;
  focused?: boolean;
  addTask: () => void;
}) {
  const router = useRouter();
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

  const [deletingTask, setDeletingTask] = useState(false);

  const matchingTasksInOtherProject = tasks
    ? tasks.filter((t) => !projectTaskIds.has(t.id))
    : [];

  return (
    <div className="relative grid grid-cols-[24px_1fr_24px_24px] px-2 py-1 gap-x-4 border-b border-(--color-background) hover:border-(--color-foreground)">
      <div
        role="button"
        className="w-24px h-24px"
        onClick={() => {
          if (task.status === STATUS_ORDER[STATUS_ORDER.length - 1]) {
            // on terminal status, open detail modal instead of transitioning
            router.push(`/projects/${projectId}?task_id=${task.id}`);
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
        onDelete={() => setDeletingTask(true)}
        onChange={(value) => setSearchQuery(value)}
        onEnterKey={addTask}
      />
      {matchingTasksInOtherProject.length > 0 && (
        <ul className="absolute top-full left-0 p-2 z-100 bg-background max-w-sm">
          {matchingTasksInOtherProject.map((t, idx) => (
            <li
              className={`${idx < matchingTasksInOtherProject.length - 1 ? "border-b-0" : ""} border border-(--color-foreground) rounded-xs px-2 py-1 cursor-pointer`}
              role="button"
              key={t.id}
              onClick={() => selectTask.mutate({ taskId: t.id, projectId })}
            >
              + Add task <em>"{t.title}"</em> to this project
            </li>
          ))}
        </ul>
      )}
      <DueDate short taskId={task.id} value={task.dueDate} />
      <Link href={`/projects/${projectId}?task_id=${task.id}`}>...</Link>
      <TaskDeleteHandler
        done={() => setDeletingTask(false)}
        task={task}
        deleteRequested={deletingTask}
      />
    </div>
  );
}
