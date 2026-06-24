import { CalendarRange } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { STATS_FILTER_PRESETS, statsFilterLabelKey } from "@/lib/statsFilter";

type Props = {
  compact?: boolean;
};

const StatsDateFilter = ({ compact = false }: Props) => {
  const { language, statsFilterPreset, setStatsFilterPreset } = useApp();
  const tr = t[language];

  return (
    <label
      className={`inline-flex items-center gap-2 border border-input bg-background text-xs font-semibold text-foreground ${
        compact ? "px-2.5 py-1.5 rounded-lg" : "px-3 py-2 rounded-xl"
      }`}
    >
      <CalendarRange className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      {!compact && <span className="text-muted-foreground">{tr.statsFilter}</span>}
      <select
        value={statsFilterPreset}
        onChange={(e) => setStatsFilterPreset(e.target.value as typeof statsFilterPreset)}
        className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
        aria-label={tr.statsFilter}
      >
        {STATS_FILTER_PRESETS.map((preset) => (
          <option key={preset} value={preset}>
            {tr[statsFilterLabelKey(preset)]}
          </option>
        ))}
      </select>
    </label>
  );
};

export default StatsDateFilter;
