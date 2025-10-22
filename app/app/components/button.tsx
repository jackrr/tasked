import { ReactNode, useEffect, useRef } from "react";

export default function Button({
  onClick,
  children,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="cursor-pointer px-2 py-1 border border-(--color-foreground) rounded-xs"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
