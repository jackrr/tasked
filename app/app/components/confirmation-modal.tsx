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
  // TODO: style me!
  return (
    <Modal {...modalProps} toggleOpen={toggleOpen}>
      <h1>{header}</h1>
      <p>This action cannot be undone.</p>
      <div className="flex space-beteween">
        <Button onClick={() => toggleOpen(false)}>Nevermind</Button>
        <Button onClick={confirm}>Do it!</Button>
      </div>
    </Modal>
  );
}
