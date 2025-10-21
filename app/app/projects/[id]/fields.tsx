import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { persistProjectField } from "@/app/api";

function useFieldPersistence({
  projectId,
  field,
}: {
  projectId: string;
  field: string;
}) {
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  const saveChange = useMutation({
    mutationFn: persistProjectField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setEditing(false);
    },
  });

  function persist(value: string) {
    saveChange.mutate({ projectId, field, value });
  }

  return { editing, persist, setEditing };
}

export function Title({
  value,
  projectId,
}: {
  value?: string;
  projectId: string;
}) {
  const { editing, persist, setEditing } = useFieldPersistence({
    projectId,
    field: "title",
  });

  if (editing) {
    return (
      <input defaultValue={value} onBlur={(e) => persist(e.target.value)} />
    );
  }

  return <h1 onClick={() => setEditing(true)}>{value}</h1>;
}

export function Description({
  value,
  projectId,
}: {
  value?: string | null;
  projectId: string;
}) {
  const { editing, persist, setEditing } = useFieldPersistence({
    projectId,
    field: "title",
  });

  if (editing) {
    <textarea
      defaultValue={value || ""}
      onBlur={(e) => persist(e.target.value)}
    ></textarea>;
  }
  return <p onClick={() => setEditing(true)}>{value}</p>;
}
