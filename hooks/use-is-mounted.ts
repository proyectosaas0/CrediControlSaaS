"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function getMountedSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, getMountedSnapshot, getServerSnapshot);
}
