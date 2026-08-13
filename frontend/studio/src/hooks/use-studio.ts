import { useEffect, useRef } from "react";
import { useStudioStore } from "../store/studio-store";

export function useStudio() {
  const store = useStudioStore();
  const initializeSession = useStudioStore((state) => state.initializeSession);
  const sessionId = useStudioStore((state) => state.sessionId);
  const transportState = useStudioStore((state) => state.transportState);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    if (sessionId) {
      booted.current = true;
      return;
    }
    booted.current = true;
    void initializeSession();
  }, [initializeSession, sessionId, transportState]);

  return store;
}
