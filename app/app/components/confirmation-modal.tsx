import { ComponentProps } from "react";
import Modal from "./modal";
import Button from "./button";

export default function ConfirmationModal({
  header,
  confirm,
  toggleOpen,
  ...modalProps
}: Omit<ComponentProps<typeof Modal>, "children"> & {
  header: string;
  confirm: () => void;
}) {
  return (
    <Modal {...modalProps} toggleOpen={toggleOpen} className="max-w-xs !h-fit">
      <h1 className="mb-4 pr-4 border-b-2 w-fit">{header}</h1>
      <p>This action cannot be undone.</p>
      <div className="mt-4 mx-4 flex justify-between">
        <Button className="px-4 mr-6" onClick={() => toggleOpen(false)}>
          Nevermind
        </Button>
        <Button
          className="px-8 border-red-600 text-red-600 font-bold"
          onClick={confirm}
        >
          Do it!
        </Button>
      </div>
    </Modal>
  );
}
