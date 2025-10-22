"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatRelative } from "date-fns";
import { useParams } from "next/navigation";
import Link from "next/link";

import { fetchProject, fetchProjectTasks } from "@/app/api";
import { ProjectTitle, ProjectDescription } from "@/app/components/field";
import { usePageTitle } from "@/app/hooks";
import Button from "@/app/components/button";
import AddTaskModal from "./add-task-modal";
import TaskDetailModal from "./task-detail-modal";

export default function Project() {
  const { id } = useParams<{ id: string }>();

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
  });

  const { data: tasks } = useQuery({
    queryKey: ["project_tasks", id],
    queryFn: () => fetchProjectTasks(id),
    select: (tasks) =>
      tasks.sort((a, b) => {
        // TODO: verify this sort logic
        // TODO: hide this complexity
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

        return bigger ? 1 : -1;
      }),
  });

  const [addingTask, setAddingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  usePageTitle(project?.title);

  return (
    <>
      <Link href={"/"}>{"<-"}</Link>
      <ProjectTitle value={project?.title} projectId={id} />
      <ProjectDescription value={project?.description} projectId={id} />
      <p>{project?.description}</p>
      <Button onClick={() => setAddingTask(true)}>+ Add task</Button>
      <AddTaskModal
        open={addingTask}
        toggleOpen={setAddingTask}
        projectId={id}
        projectTitle={project?.title}
        projectTaskIds={new Set(tasks?.map((t) => t.id))}
      />
      {selectedTask && (
        <TaskDetailModal
          open={!!selectedTask}
          toggleOpen={() => setSelectedTask(null)}
          projectId={id}
          taskId={selectedTask}
        />
      )}
      <ul>
        {tasks?.map((t) => (
          <li key={t.id}>
            <div role="button" onClick={() => setSelectedTask(t.id)}>
              <p>{t.title}</p>
              {t.dueDate && formatRelative(t.dueDate, new Date())}
              <div>{t.status}</div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
