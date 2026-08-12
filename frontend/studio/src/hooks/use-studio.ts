import { useSyncExternalStore } from "react";
import { studio, type StudioState } from "@/lib/studio/store";

/** Subscribe a component to the studio store (SSR-safe). */
export function useStudio(): {
  state: StudioState;
  sim: typeof studio.sim;
  store: typeof studio;
  bridge: typeof studio.bridge;
} {
  const state = useSyncExternalStore(studio.subscribe, studio.getSnapshot, studio.getServerSnapshot);
  return { state, sim: studio.sim, store: studio, bridge: studio.bridge };
}
