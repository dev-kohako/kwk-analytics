"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { GET_PIVOT_FIELD_VALUES } from "@/queries/explore.queries";

type PivotFieldValuesQueryData = {
  pivotFieldValues: string[];
};

type PivotFieldValuesQueryVars = {
  input: {
    field: string;
    search?: string;
    limit?: number;
  };
};

type RemoteOptions = {
  load: (search?: string) => Promise<void>;
  loading: boolean;
  options: string[];
};

export function useFilterOptions(field: string, initialLoad = true): RemoteOptions {
  const [options, setOptions] = useState<string[]>([]);

  const [run, { loading, data }] = useLazyQuery<
    PivotFieldValuesQueryData,
    PivotFieldValuesQueryVars
  >(GET_PIVOT_FIELD_VALUES, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (data?.pivotFieldValues) {
      setOptions(data.pivotFieldValues);
    }
  }, [data]);

  const timer = useRef<number | null>(null);

  const load = useCallback(
    async (search?: string) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(async () => {
        await run({
          variables: {
            input: { field, search, limit: 50 },
          },
        });
      }, 200);
    },
    [run, field]
  );

  useMemo(() => {
    if (initialLoad) load();
  }, [field]);

  return { load, loading, options };
}
