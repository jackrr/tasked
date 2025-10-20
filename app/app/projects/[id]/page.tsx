"use client";

import { useEffect, useState } from "react";

export default async function Project({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // const [projects, setProjects] = useState([]);

  useEffect(() => {
    console.log("FETCHING!");
    async function loadProject() {
      console.error("TODO: implement project fetch by id");
    }

    loadProject();
  }, []);

  return <div>Project id {id}</div>;
}
