"use client";

import { useCallback } from "react";

export function usePagination(defaultPageSize = 20) {
  const buildParams = useCallback(
    (page: number, pageSize?: number) => {
      const size = pageSize ?? defaultPageSize;
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(size),
      });
      return params.toString();
    },
    [defaultPageSize],
  );

  return { buildParams };
}
