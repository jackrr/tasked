"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
		console.log("FETCHING!")
    async function loadProjects() {
      const res = await fetch("http://localhost:8000/projects");
      const projects = await res.json();
      setProjects(projects);
    }

    loadProjects();
  }, []);

  return (
    <ul>
      {projects.map((p) => (
        <li key={p.id}>
          <Link href={`/projects/${p.id}`}>{p.title}</Link>
        </li>
      ))}
    </ul>
  );
}
