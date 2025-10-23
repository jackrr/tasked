import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { persistField } from "@/app/api";
import { useDebounce } from "../hooks";

export const DELETE_KEYS = new Set(["Backspace", "Delete"]);

export function useFieldPersistence<T>({
  entityId,
  entityType,
  field,
  value,
}: Parameters<typeof persistField>[0]) {
  const saveChange = useMutation({
    mutationFn: persistField<T>,
    onSuccess: () => {
      console.error("FIXME: ensure websocket handles invalidation");
    },
  });

  // TODO: verify this works to prevent value changes from server triggering reactive API requests
  const [persistedValue, setPersistedValue] = useState(value);
  const [editedValue, setEditedValue] = useState<T>(value as T);

  const debouncedValue = useDebounce(editedValue, 200);
  useEffect(() => {
    if (persistedValue !== debouncedValue) {
      saveChange.mutate({
        entityId,
        entityType,
        field,
        value: debouncedValue,
      });
      setPersistedValue(debouncedValue);
    }
  }, [value, debouncedValue, persistedValue]);

  return { onChange: setEditedValue };
}

export function Title({
  entityId,
  entityType,
  value,
  big,
  focused,
  onDelete,
  onChange,
}: {
  entityId: string;
  entityType: "tasks" | "projects";
  value?: string;
  big?: boolean;
  focused?: boolean;
  onDelete: () => void;
  onChange?: (value: string) => void;
}) {
  const { onChange: onPersistableChange } = useFieldPersistence({
    entityId,
    entityType,
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
      placeholder="Add a title here..."
      ref={input}
      defaultValue={value}
      onChange={(e) => {
        onPersistableChange(e.target.value);
        onChange && onChange(e.target.value);
      }}
      onKeyDown={(e) => handleKeyDown(e.key)}
    />
  );
}

export function Description({
  entityId,
  entityType,
  value,
}: {
  entityId: string;
  entityType: "tasks" | "projects";
  value?: string | null;
}) {
  const { onChange } = useFieldPersistence({
    entityId,
    entityType,
    field: "description",
    value,
  });

  // TODO: prevent resize
  return (
    <textarea
      className="w-full outline-none border-b-2"
      placeholder="Add a description here..."
      defaultValue={value || ""}
      onChange={(e) => onChange(e.target.value)}
    ></textarea>
  );
}
