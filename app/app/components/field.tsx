import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { persistProjectField } from "@/app/api";
import { useDebounce } from "../hooks";

function useProjectFieldPersistence<T>({
  projectId,
  field,
  value,
}: {
  projectId: string;
  field: string;
  value: T;
}) {
  const queryClient = useQueryClient();

  const saveChange = useMutation({
    mutationFn: persistProjectField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  // FIXME: if value changes from server DO NOT trigger debounced API request
  const [editedValue, setEditedValue] = useState<T>(value);

  // Save edits after 200ms without editing
  const debouncedValue = useDebounce(editedValue, 200);
  useEffect(() => {
    if (value !== debouncedValue) {
      saveChange.mutate({ projectId, field, value: debouncedValue });
    }
  }, [value, debouncedValue]);

  return { onChange: setEditedValue };
}

export function ProjectTitle({
  value,
  projectId,
}: {
  value?: string;
  projectId: string;
}) {
  const { onChange } = useProjectFieldPersistence({
    projectId,
    field: "title",
    value,
  });

  return (
    <input defaultValue={value} onChange={(e) => onChange(e.target.value)} />
  );
}

export function ProjectDescription({
  value,
  projectId,
}: {
  value?: string | null;
  projectId: string;
}) {
  const { onChange } = useProjectFieldPersistence({
    projectId,
    field: "title",
    value,
  });

  return (
    <textarea
      defaultValue={value || ""}
      onBlur={(e) => onChange(e.target.value)}
    ></textarea>
  );
}
