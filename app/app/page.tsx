"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchProjects, createProject } from "@/app/api";
import Modal from "@/app/components/modal";
import Button from "@/app/components/button";
import Input from "@/app/components/input";
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
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);

  if (isLoading) return null;

  return (
    <div className="px-4">
      <ul className="w-full">
        {projects &&
          projects.map((p) => (
            <li key={p.id} className="py-2 grid gap-x-2 grid-cols-[1fr_90px]">
              <ProjectTitle value={p.title} projectId={p.id} />
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
      <Button onClick={() => setPendingTitle("")}>+ Add project</Button>
      <Modal
        open={pendingTitle !== null}
        toggleOpen={(open) => setPendingTitle(open ? "" : null)}
      >
        <Input onChange={setPendingTitle} />
        <Button
          onClick={() => pendingTitle && submitProject.mutate(pendingTitle)}
        >
          Save
        </Button>
      </Modal>
    </div>
  );
}
