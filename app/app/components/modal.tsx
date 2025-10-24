import { ReactNode, useEffect, useRef } from "react";

export default function Modal({
  children,
  open,
  toggleOpen,
}: {
  open: boolean;
  toggleOpen: (open: boolean) => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
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
      className="backdrop:bg-foreground/40 backdrop:backdrop-blur-xs fixed top-[50%] left-[50%] translate-[-50%] rounded-md p-4"
    >
      {children}
    </dialog>
  );
}
