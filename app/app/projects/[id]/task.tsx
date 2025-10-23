import { useState } from "react";
import { formatRelative } from "date-fns";
import Image from "next/image";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Title } from "@/app/components/field";
import {
  addTaskToProject,
  searchTasks,
  Task as TaskType,
  TASK_STATUS_SERVER_TO_USER,
  persistField,
  STATUS_ORDER,
} from "@/app/api";
import { useDebounce } from "@/app/hooks";
import TodoImg from "@/public/todo.png";
import InProgressImg from "@/public/in-progress.png";
import CompleteImg from "@/public/done.png";

const statusToImage = {
  [TASK_STATUS_SERVER_TO_USER.todo]: TodoImg,
  [TASK_STATUS_SERVER_TO_USER.in_progress]: InProgressImg,
  [TASK_STATUS_SERVER_TO_USER.complete]: CompleteImg,
};

Object.freeze(statusToImage);

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
  const debouncedQuery = useDebounce(searchQuery, 200);
  const { data: tasks } = useQuery({
    queryKey: ["task_search", debouncedQuery],
    queryFn: () => searchTasks(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const selectTask = useMutation({
    mutationFn: addTaskToProject,
    onSuccess: () => {
      // FIXME: Websocket should cover cache invalidation
    },
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

  const matchingTasksInOtherProject = tasks
    ? tasks.filter((t) => !projectTaskIds.has(t.id))
    : [];

  // TODO: color code status
  // TODO: click due date pops open picker
  // TODO: delete in task title deletes task (confirm if in other projects or has description) (also invalidate cache)
  return (
    <div className="grid grid-cols-[24px_1fr_24px_24px] gap-x-4">
      <Image
        src={statusToImage[task.status]}
        width={24}
        height={24}
        alt={task.status}
        onClick={() => transitionStatus.mutate()}
      />
      <Title
        entityId={task.id}
        entityType={"tasks"}
        focused={focused}
        value={task.title}
        onDelete={() => {}}
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
    </div>
  );
}
