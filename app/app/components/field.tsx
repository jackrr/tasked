import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict } from "date-fns";

import { persistField } from "@/app/api";
import { useDebounce, useIsOverflowing } from "@/app/hooks";
import { useIdleContext } from "@/app/components/idle-detector";
import Modal from "./modal";

export const DELETE_KEYS = new Set(["Backspace", "Delete"]);
export const ENTER_KEYS = new Set(["Enter", "Return"]);

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
  onEnterKey,
  onDelete,
  onChange,
}: {
  entityId: string;
  entityType: "tasks" | "projects";
  value?: string;
  big?: boolean;
  focused?: boolean;
  onDelete?: () => void;
  onEnterKey?: () => void;
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
    if (onDelete && input.current?.value?.length === 0 && DELETE_KEYS.has(key))
      onDelete();
    if (onEnterKey && ENTER_KEYS.has(key)) onEnterKey();
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
      className={`w-full outline-none overflow-hidden text-ellipsis ${big ? "text-xl" : "text-md"}`}
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
  const [focused, setFocused] = useState(false);
  const { overflowing } = useIsOverflowing(input, input.current?.value);

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
    <div className={`relative h-fit ${className}`}>
      <textarea
        ref={input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="h-full w-full outline-none resize-none"
        placeholder="Add notes here..."
        defaultValue={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
      {!focused && overflowing && (
        <label className="absolute bottom-0 right-2 p-2 italic text-sm bg-background">
          scroll for more...
        </label>
      )}
    </div>
  );
}

export function DueDate({
  taskId,
  value,
  showEmpty,
  short,
}: {
  taskId: string;
  value?: Date;
  showEmpty?: boolean;
  short?: boolean;
}) {
  const { onChange } = useFieldPersistence({
    entityId: taskId,
    entityType: "tasks",
    field: "due_date",
    value,
  });

  const [editing, setEditing] = useState(false);

  if (!value && !showEmpty) return;

  return (
    <>
      <Modal open={editing} toggleOpen={setEditing} size="small">
        <input
          className="m-auto block"
          defaultValue={value ? format(value, "yyyy-MM-dd") : undefined}
          type="date"
          onChange={(e) => onChange(e.target.value)}
        />
      </Modal>
      <div
        className="cursor-pointer"
        role="button"
        onClick={() => setEditing(true)}
      >
        {value ? (
          <p
            className={
              short ? "text-xs text-nowrap rotate-315 translate-y-[50%]" : ""
            }
          >
            {!short && <span>Due on {format(value, "MMM do, yyyy")}</span>}
            <span className={short ? "" : "italic"}>
              {!short && " ("}in {formatDistanceToNowStrict(value)}
              {!short && ")"}
            </span>
          </p>
        ) : (
          <p className="italic">No due date</p>
        )}
      </div>
    </>
  );
}
