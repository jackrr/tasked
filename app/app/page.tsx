"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";

import { fetchProjects, createProject } from "@/app/api";
import Modal from "@/app/components/modal";
import Button from "@/app/components/button";
import Input from "@/app/components/input";
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
    <>
      <h1>All projects</h1>
      <ul>
        {projects &&
          projects.map((p) => (
            <li key={p.id}>
              <Link href={`/projects/${p.id}`}>
                <div>{p.title}</div>
                <div>
                  {p.completedTasks}/{p.totalTasks}
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
    </>
  );
}
