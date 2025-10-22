"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  fetchProjects,
  createProject,
  deleteProject,
  ProjectWithStats,
} from "@/app/api";
import Button from "@/app/components/button";
import ConfirmationModal from "@/app/components/confirmation-modal";
import { ProjectTitle } from "@/app/components/field";
import { usePageTitle } from "./hooks";

export default function Home() {
  usePageTitle("All Projects");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const queryClient = useQueryClient();
  const submitProject = useMutation({
    mutationFn: createProject,
    // TODO: centralize cache invalidation keys
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  // TODO: extract for use in project detail page
  const deleteProjectMutation = useMutation({
    mutationFn: deleteProject,
    // TODO: centralize cache invalidation keys
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  function handleDeleteRequest(project: ProjectWithStats) {
    if (
      (project.description && project.description.length > 0) ||
      project.total > 0
    ) {
      setConfirmingDelete(project.id);
    } else {
      deleteProjectMutation.mutate(project.id);
    }
  }

  if (isLoading) return null;

  return (
    <div className="px-4">
      <ul className="w-full">
        {projects &&
          projects.map((p, idx) => (
            <li key={p.id} className="py-2 grid gap-x-2 grid-cols-[1fr_90px]">
              <ProjectTitle
                value={p.title}
                projectId={p.id}
                focused={p.title === "" && idx === projects.length - 1}
                onDelete={() => handleDeleteRequest(p)}
              />
              <Link href={`/projects/${p.id}`}>
                <div className="grid grid-cols-2 gap-x-2">
                  <div className="grid gap-x-1 grid-cols-3">
                    <span className="text-(--color-todo)">{p.todo}</span>
                    <span className="text-(--color-in-progress)">
                      {p.inProgress}
                    </span>
                    <span className="text-(--color-complete)">
                      {p.complete}
                    </span>
                  </div>

                  <em>more...</em>
                </div>
              </Link>
            </li>
          ))}
      </ul>
      <div className="py-2">
        <Button onClick={() => submitProject.mutate("")}>+ Add project</Button>
      </div>
      <ConfirmationModal
        open={!!confirmingDelete}
        toggleOpen={() => setConfirmingDelete(null)}
        confirm={() => {
          if (confirmingDelete) deleteProjectMutation.mutate(confirmingDelete);
          setConfirmingDelete(null);
        }}
        header="Delete this project?"
      />
    </div>
  );
}
