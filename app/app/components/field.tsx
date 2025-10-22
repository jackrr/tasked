import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { persistProjectField } from "@/app/api";
import { useDebounce } from "../hooks";

const DELETE_KEYS = new Set(["Backspace", "Delete"]);

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
  big,
  value,
  projectId,
  focused,
  onDelete,
}: {
  big?: boolean;
  value?: string;
  projectId: string;
  focused?: boolean;
  onDelete: () => void;
}) {
  const { onChange } = useProjectFieldPersistence({
    projectId,
    field: "title",
    value,
  });
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focused) input.current?.focus();
  }, [focused]);

  function handleKeyDown(key: string) {
    if (input.current?.value?.length === 0 && DELETE_KEYS.has(key)) onDelete();
  }

  return (
    <input
      className={`w-full outline-none ${big ? "text-xl" : "text-md"}`}
      ref={input}
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => handleKeyDown(e.key)}
    />
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
    field: "description",
    value,
  });

  // TODO: prevent resize
  return (
    <textarea
      className="w-full outline-none border-b-2"
      placeholder="Description for your project..."
      defaultValue={value || ""}
      onChange={(e) => onChange(e.target.value)}
    ></textarea>
  );
}
