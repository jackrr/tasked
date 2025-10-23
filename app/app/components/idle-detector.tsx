"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const IDLE_AFTER_SECS = 5;

export const IdleContext = createContext({ idle: false, visible: true });

export function useIdleContext() {
  return useContext(IdleContext);
}

export function useIsIdle() {
  const { idle } = useIdleContext();
  return idle;
}

export function useIsVisible() {
  const { visible } = useIdleContext();
  return visible;
}

export function IdleContextProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [idle, setIdle] = useState(true);

  const idleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onVisibleChange = useCallback(() => {
    setVisible(document.visibilityState === "visible");
  }, [setVisible]);

  const onInteraction = useCallback(() => {
    setIdle(false);
    idleTimeout.current && clearTimeout(idleTimeout.current);

    idleTimeout.current = setTimeout(() => {
      setIdle(true);
    }, IDLE_AFTER_SECS * 1000);
  }, [setIdle]);

  useEffect(() => {
    document.addEventListener("visibilitychange", onVisibleChange);
    document.addEventListener("keydown", onInteraction);
    document.addEventListener("mousemove", onInteraction);
    document.addEventListener("mousedown", onInteraction);

    return () => {
      document.removeEventListener("visibilitychange", onVisibleChange);
      document.removeEventListener("keydown", onInteraction);
      document.removeEventListener("mousemove", onInteraction);
      document.removeEventListener("mousedown", onInteraction);
    };
  }, []);

  return <IdleContext value={{ visible, idle }}>{children}</IdleContext>;
}
