import { ReactNode } from "react";

export default function Button({
  onClick,
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`cursor-pointer px-2 py-1 border border-(--color-foreground) rounded-xs ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
