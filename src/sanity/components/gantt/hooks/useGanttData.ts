/**
 * Hook: GROQ query + transform pipeline for Gantt chart data.
 *
 * Fetches project data with resolved contractor references from Sanity,
 * transforms it into SVAR Gantt tasks via the pure transform functions.
 * Re-fetches when the document revision changes (useEffect dependency on rev).
 */

import { useEffect, useState, useCallback } from "react";
import { useClient } from "sanity";
import { transformProjectToGanttTasks } from "../lib/ganttTransforms";
import type {
  GanttTask,
  ResolvedContractor,
  SanityProjectData,
} from "../lib/ganttTypes";

const GANTT_QUERY = `*[_id == $docId || _id == "drafts." + $docId] | order(_id desc)[0]{
  contractors[]{ ..., contractor->{_id, name, company, trades} },
  milestones,
  procurementItems,
  customEvents,
  engagementType,
  isCommercial
}`;

interface UseGanttDataResult {
  tasks: GanttTask[];
  contractors: ResolvedContractor[];
  loading: boolean;
  error: string | null;
}

export function useGanttData(
  documentId: string,
  rev: string | undefined,
): UseGanttDataResult {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [contractors, setContractors] = useState<ResolvedContractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await client.fetch<SanityProjectData | null>(GANTT_QUERY, {
        docId: documentId,
      });

      if (!data) {
        setTasks([]);
        setContractors([]);
        return;
      }

      const transformedTasks = transformProjectToGanttTasks(data);
      setTasks(transformedTasks);
      setContractors(data.contractors || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load schedule data";
      setError(message);
      setTasks([]);
      setContractors([]);
    } finally {
      setLoading(false);
    }
  }, [client, documentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, rev]);

  return { tasks, contractors, loading, error };
}
