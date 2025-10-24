"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Modal from "@/app/components/modal";
import { Title, Description, DueDate } from "@/app/components/field";
import {
  fetchTask,
  fetchTaskProjects,
  removeTaskFromProject,
  persistField,
  STATUS_ORDER,
  TASK_STATUS_SERVER_TO_USER,
  TaskStatusUser,
} from "@/app/api";
import Status from "@/app/components/status";
import Button from "@/app/components/button";
import TaskDeleteHandler from "./delete-task";
import { useState } from "react";

const statusToColor = {
  [TASK_STATUS_SERVER_TO_USER.todo]: "todo",
  [TASK_STATUS_SERVER_TO_USER.in_progress]: "in-progress",
  [TASK_STATUS_SERVER_TO_USER.complete]: "complete",
};
Object.freeze(statusToColor);

export default function TaskDetailModal({
  taskId,
  projectId,
  ...modalProps
}: Omit<React.ComponentProps<typeof Modal>, "toggleOpen" | "children"> & {
  taskId: string;
  projectId: string;
}) {
  const router = useRouter();
  const { data: task } = useQuery({
    queryKey: ["tasks", taskId],
    queryFn: () => fetchTask(taskId),
  });

  const { data: projects } = useQuery({
    queryKey: ["projects", "task", taskId],
    queryFn: () => fetchTaskProjects(taskId),
  });

  const removeProject = useMutation({
    mutationFn: removeTaskFromProject,
  });

  const setStatus = useMutation({
    mutationFn: (status: TaskStatusUser) =>
      task
        ? persistField({
            entityId: task.id,
            entityType: "tasks",
            field: "status",
            value: status,
          })
        : Promise.reject("No task loaded"),
  });

  const [deleteRequested, setDeleteRequested] = useState(false);

  function close() {
    router.push(`/projects/${projectId}`);
  }

  if (!task) return null;

  return (
    <Modal {...modalProps} toggleOpen={close} className="max-w-xl">
      <div className="flex flex-col h-full">
        <div className="flex justify-end content-center -mt-4 -mr-2">
          <button
            className="cursor-pointer text-2xl text-gray-600 pl-4"
            onClick={close}
          >
            x
          </button>
        </div>

        <div className="grid grid-cols-3 mb-2">
          {STATUS_ORDER.map((s) => {
            const current = task.status === s;
            return (
              <div
                key={s}
                className={`flex justify-start items-center cursor-pointer ${current ? "" : "opacity-50"}`}
                onClick={() => !current && setStatus.mutate(s)}
              >
                <Status status={s} />
                <p className="pl-2 pt-1">{s}</p>
              </div>
            );
          })}
        </div>
        <Title
          big
          entityId={task.id}
          entityType={"tasks"}
          value={task.title}
          onDelete={() => {}}
        />
        <Description
          entityId={task.id}
          entityType={"tasks"}
          value={task.description}
          className="border-none mt-2 grow"
        />
        <DueDate showEmpty taskId={task.id} value={task.dueDate} />
        <h3 className="mt-4 mb-1 pr-6 border-b w-fit">Projects</h3>
        <div className="flex flex-wrap flex-row gap-3 mt-4">
          {projects?.map((p) => {
            const currentProject = p.id === projectId;
            return (
              <div key={p.id} className="max-w-3xs">
                {!currentProject && (
                  <Button
                    onClick={() =>
                      removeProject.mutate({ taskId, projectId: p.id })
                    }
                    className="inline border-r-0"
                  >
                    X
                  </Button>
                )}
                <Link href={`/projects/${p.id}`}>
                  <Button
                    onClick={() => {}}
                    className={`inline ${currentProject ? "opacity-60" : ""} max-w-42 text-nowrap overflow-hidden text-ellipsis`}
                  >
                    {p.title}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
        <Button
          onClick={() => setDeleteRequested(true)}
          className="mt-6 w-full border-2 border-red-600 text-red-600 font-bold"
        >
          Delete this Task
        </Button>
      </div>
      <TaskDeleteHandler
        task={task}
        deleteRequested={deleteRequested}
        done={() => setDeleteRequested(false)}
      />
    </Modal>
  );
}
