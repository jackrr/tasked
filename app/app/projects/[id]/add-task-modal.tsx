"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import Modal from "@/app/components/modal";
import Input from "@/app/components/input";
import Button from "@/app/components/button";
import { createTaskInProject, addTaskToProject, searchTasks } from "@/app/api";
import { useDebounce } from "@/app/hooks";

export default function AddTaskModal({
  projectId,
  projectTitle,
  toggleOpen,
  projectTaskIds,
  ...modalProps
}: Omit<React.ComponentProps<typeof Modal>, "children"> & {
  projectId: string;
  projectTitle?: string;
  projectTaskIds: Set<string>;
}) {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();

  const selectTask = useMutation({
    mutationFn: addTaskToProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toggleOpen(false);
    },
  });

  const debouncedTitle = useDebounce(title, 200);
  const { data: tasks } = useQuery({
    queryKey: ["task_search", debouncedTitle],
    queryFn: () => searchTasks(debouncedTitle),
    enabled: debouncedTitle.length >= 2,
  });

  return (
    <Modal {...modalProps} toggleOpen={toggleOpen}>
      <h1>Add task to '{projectTitle}'</h1>
      <Input onChange={setTitle} placeholder={"Task name..."} />

      {tasks?.map((t) =>
        projectTaskIds.has(t.id) ? (
          <div key={t.id}>
            {t.title} <em>(already in project)</em>
          </div>
        ) : (
          <div
            key={t.id}
            aria-role="button"
            onClick={() => selectTask.mutate({ taskId: t.id, projectId })}
          >
            {t.title}
          </div>
        ),
      )}
    </Modal>
  );
}
