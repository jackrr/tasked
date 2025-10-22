import { Task as TaskType } from "@/app/api";
import { formatRelative } from "date-fns";

export default function Task({
  task,
  openDetails,
  projectTaskIds,
}: {
  task: TaskType;
  openDetails: () => void;
  projectTaskIds: Set<string>;
}) {
  //   <AddTaskModal
  //   open={addingTask}
  //   toggleOpen={setAddingTask}
  //   projectId={id}
  //   projectTitle={project?.title}
  //
  // />
  // TODO: editing title shows autocomplete matches in floating list
  // TODO: click on autocomplete match adds to project
  // TODO: show status image on tasks
  // TODO: editing task status should invalidate projects index cache
  // TODO: click status image transitions to next status
  // TODO: click due date pops open picker
  // TODO: delete in task title deletes task (confirm if in other projects or has description) (also invalidate cache)
  return (
    <>
      <p>{task.title}</p>
      {task.dueDate && formatRelative(task.dueDate, new Date())}
      <div>{task.status}</div>
      <button onClick={openDetails}>...</button>
    </>
  );
}
