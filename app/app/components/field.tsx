import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { persistField } from "@/app/api";
import { useDebounce } from "@/app/hooks";
import { useIdleContext } from "@/app/components/idle-detector";

export const DELETE_KEYS = new Set(["Backspace", "Delete"]);

export function useFieldPersistence<T>({
  entityId,
  entityType,
  field,
  value,
}: Parameters<typeof persistField>[0]) {
  const saveChange = useMutation({
    mutationFn: persistField<T>,
  });

  const [persistedValue, setPersistedValue] = useState(value);
  const [editedValue, setEditedValue] = useState<T>(value as T);

  const { value: debouncedValue, reset: resetDebounce } = useDebounce(
    editedValue,
    200,
  );
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
  }, [debouncedValue, persistedValue]);

  // when value changes (change from outside this component), reset state around updated value
  useEffect(() => {
    setPersistedValue(value);
    resetDebounce(value as T);
  }, [value]);

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

  const { visible, idle } = useIdleContext();
  useEffect(() => {
    if (
      input.current &&
      (!visible || idle || document.activeElement !== input.current)
    ) {
      input.current.value = value || "";
    }
  }, [value]);

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
  className,
}: {
  entityId: string;
  entityType: "tasks" | "projects";
  value?: string | null;
  className?: string;
}) {
  const { onChange } = useFieldPersistence({
    entityId,
    entityType,
    field: "description",
    value,
  });
  const input = useRef<HTMLTextAreaElement>(null);

  const { visible, idle } = useIdleContext();
  useEffect(() => {
    if (
      input.current &&
      (!visible || idle || document.activeElement !== input.current)
    ) {
      input.current.value = value || "";
    }
  }, [value]);

  return (
    <textarea
      ref={input}
      className={`w-full outline-none border-b-2 resize-none ${className}`}
      placeholder="Add a description here..."
      defaultValue={value || ""}
      onChange={(e) => onChange(e.target.value)}
    ></textarea>
  );
}
