"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import {
  fetchProject,
  fetchProjectTasks,
  createTaskInProject,
} from "@/app/api";
import { Title, Description } from "@/app/components/field";
import { usePageTitle } from "@/app/hooks";
import Button from "@/app/components/button";
import TaskDetailModal from "./task-detail-modal";
import Task from "./task";

export default function Project() {
  const { id } = useParams<{ id: string }>();

  const { data: project } = useQuery({
    queryKey: ["projects", id],
    queryFn: () => fetchProject(id),
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () => fetchProjectTasks(id),
    select: (tasks) =>
      tasks.sort((a, b) => {
        let bigger;
        if (a.status === b.status) {
          if (a.dueDate === b.dueDate) {
            bigger = a.createdAt > b.createdAt;
          } else {
            if (!b.dueDate) {
              bigger = true;
            } else if (!a.dueDate) {
              bigger = false;
            } else {
              bigger = a.dueDate > b.dueDate;
            }
          }
        } else {
          bigger = a.status > b.status;
        }

        return bigger ? -1 : 1;
      }),
  });

  const addTask = useMutation({
    mutationFn: createTaskInProject,
  });

  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const projectTaskIds = useMemo(
    () => new Set(tasks?.map((t) => t.id)),
    [tasks],
  );

  usePageTitle(project?.title);

  return (
    <>
      <div className="h-full w-full p-4 grid gap-4 grid-cols-1 md:grid-cols-2 overflow-hidden">
        <div className="h-full grid gap-4 grid-rows-[28px_1fr] overflow-y-scroll">
          <Title
            big
            onDelete={() => {}}
            value={project?.title}
            entityId={id}
            entityType="projects"
          />
          <Description
            value={project?.description}
            entityId={id}
            entityType="projects"
          />
        </div>
        <div className="overflow-y-scroll relative">
          <Button
            onClick={() => addTask.mutate({ title: "", projectId: id })}
            className="sticky top-0 bg-background"
          >
            + Add task
          </Button>
          <ul className="overflow-y-scroll">
            {tasks?.map((t, idx) => (
              <li key={t.id} role="button" className="py-2">
                <Task
                  focused={t.title === "" && idx === 0}
                  task={t}
                  projectId={id}
                  openDetails={() => setSelectedTask(t.id)}
                  projectTaskIds={projectTaskIds}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
      {selectedTask && (
        <TaskDetailModal
          open={!!selectedTask}
          toggleOpen={() => setSelectedTask(null)}
          projectId={id}
          taskId={selectedTask}
        />
      )}
    </>
  );
}
