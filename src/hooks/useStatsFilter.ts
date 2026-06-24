import { useCallback, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import {
  isDateInStatsRange,
  isDateTimeInStatsRange,
  resolveStatsDateRange,
  type StatsFilterPreset,
} from "@/lib/statsFilter";

export const useStatsFilter = () => {
  const { statsFilterPreset, setStatsFilterPreset } = useApp();

  const range = useMemo(() => resolveStatsDateRange(statsFilterPreset), [statsFilterPreset]);

  const matchesDate = useCallback(
    (dateLike: string) => isDateInStatsRange(dateLike, statsFilterPreset),
    [statsFilterPreset],
  );

  const matchesDateTime = useCallback(
    (isoDateTime: string) => isDateTimeInStatsRange(isoDateTime, statsFilterPreset),
    [statsFilterPreset],
  );

  return {
    preset: statsFilterPreset,
    setPreset: setStatsFilterPreset,
    range,
    matchesDate,
    matchesDateTime,
  };
};

export type { StatsFilterPreset };
