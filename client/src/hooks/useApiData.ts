import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

export function useApiData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void apiRequest<T>(path)
      .then((value) => { if (active) setData(value); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load the requested data.");
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [path, revision]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);
  return { data, error, loading, reload };
}
