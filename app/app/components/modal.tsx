import { ReactNode, useEffect, useRef } from "react";

export default function Modal({
  children,
  open,
  toggleOpen,
  className,
  size = "regular",
}: {
  open: boolean;
  toggleOpen: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  size?: "small" | "regular";
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      if (dialog.current && !dialog.current.open) dialog.current?.showModal();
    } else {
      dialog.current?.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      onClick={(e) => {
        if (e.target === dialog.current) toggleOpen(false);
      }}
      className={`${className} backdrop:bg-foreground/40 backdrop:backdrop-blur-xs fixed top-0 left-0 md:w-auto md:h-auto md:top-[50%] md:left-[50%] md:translate-[-50%] md:rounded-md ${size === "small" ? "max-w-xs !h-fit" : "h-full"}`}
    >
      <div className="p-4 h-full w-full overflow-auto">{children}</div>
    </dialog>
  );
}
