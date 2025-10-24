import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Task, fetchTaskProjects, deleteTask } from "@/app/api";
import ConfirmationModal from "@/app/components/confirmation-modal";

export default function TaskDeleteHandler({
  deleteRequested,
  task,
  done,
}: {
  deleteRequested: boolean;
  task: Task;
  done: () => void;
}) {
  const { data: taskProjects } = useQuery({
    queryKey: ["projects", "task", task.id],
    queryFn: () => fetchTaskProjects(task.id),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!deleteRequested) return;

    if (
      (task.description && task.description.length > 0) ||
      (taskProjects && taskProjects?.length > 1) // is in other project
    ) {
      setConfirmingDelete(true);
    } else {
      deleteTaskMutation.mutate(task.id);
      done();
    }
  }, [deleteRequested]);

  return (
    <ConfirmationModal
      open={!!confirmingDelete}
      toggleOpen={() => {
        setConfirmingDelete(false);
        done();
      }}
      confirm={() => {
        deleteTaskMutation.mutate(task.id);
        setConfirmingDelete(false);
        done();
      }}
      header="Delete this task?"
    />
  );
}
