import { ReactNode, useEffect, useRef } from "react";

export default function Button({
  onClick,
  children,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return <button onClick={onClick}>{children}</button>;
}
