export type StatsFilterPreset = "today" | "week" | "month" | "last6months" | "year" | "all";

export type StatsDateRange = {
  start: string;
  end: string;
};

const toIsoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const STATS_FILTER_PRESETS: StatsFilterPreset[] = [
  "today",
  "week",
  "month",
  "last6months",
  "year",
  "all",
];

export const resolveStatsDateRange = (preset: StatsFilterPreset): StatsDateRange => {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case "today":
      break;
    case "week":
      start.setDate(start.getDate() - 6);
      break;
    case "month":
      start.setDate(1);
      break;
    case "last6months":
      start.setMonth(start.getMonth() - 5);
      start.setDate(1);
      break;
    case "year":
      start.setMonth(0);
      start.setDate(1);
      break;
    case "all":
      return { start: "1970-01-01", end: "2999-12-31" };
    default:
      break;
  }

  return { start: toIsoDate(start), end: toIsoDate(end) };
};

export const isDateInStatsRange = (dateLike: string, preset: StatsFilterPreset) => {
  const { start, end } = resolveStatsDateRange(preset);
  const day = dateLike.slice(0, 10);
  return day >= start && day <= end;
};

export const isDateTimeInStatsRange = (isoDateTime: string, preset: StatsFilterPreset) => {
  const { start, end } = resolveStatsDateRange(preset);
  const startMs = new Date(`${start}T00:00:00`).getTime();
  const endMs = new Date(`${end}T23:59:59.999`).getTime();
  const value = new Date(isoDateTime).getTime();
  return value >= startMs && value <= endMs;
};

export const statsFilterLabelKey = (preset: StatsFilterPreset) => {
  switch (preset) {
    case "today":
      return "statsToday" as const;
    case "week":
      return "statsWeek" as const;
    case "month":
      return "statsMonth" as const;
    case "last6months":
      return "statsLast6Months" as const;
    case "year":
      return "statsYear" as const;
    case "all":
      return "statsAll" as const;
    default:
      return "statsMonth" as const;
  }
};

export const buildDailyBuckets = (preset: StatsFilterPreset) => {
  const { start, end } = resolveStatsDateRange(preset);
  const buckets: { iso: string; label: string }[] = [];
  const cursor = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  while (cursor <= endDate) {
    const iso = toIsoDate(cursor);
    buckets.push({
      iso,
      label: cursor.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  if (buckets.length > 31) {
    return buckets.filter((_, idx) => idx % Math.ceil(buckets.length / 14) === 0 || idx === buckets.length - 1);
  }

  return buckets;
};
