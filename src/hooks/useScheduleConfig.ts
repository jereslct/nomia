import { useEffect, useMemo, useState } from "react";

export type ScheduleConfig = {
  entryHour: number;
  entryMinute: number;
  exitHour: number;
  exitMinute: number;
  toleranceMinutes: number;
};

const STORAGE_KEY = "nomia:schedule_config";

const DEFAULT_CONFIG: ScheduleConfig = {
  entryHour: 9,
  entryMinute: 0,
  exitHour: 18,
  exitMinute: 0,
  toleranceMinutes: 5,
};

const clampInt = (value: unknown, min: number, max: number, fallback: number) => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

const normalizeConfig = (raw: any): ScheduleConfig => {
  return {
    entryHour: clampInt(raw?.entryHour, 0, 23, DEFAULT_CONFIG.entryHour),
    entryMinute: clampInt(raw?.entryMinute, 0, 59, DEFAULT_CONFIG.entryMinute),
    exitHour: clampInt(raw?.exitHour, 0, 23, DEFAULT_CONFIG.exitHour),
    exitMinute: clampInt(raw?.exitMinute, 0, 59, DEFAULT_CONFIG.exitMinute),
    toleranceMinutes: clampInt(raw?.toleranceMinutes, 0, 60, DEFAULT_CONFIG.toleranceMinutes),
  };
};

export function useScheduleConfig() {
  const [config, setConfig] = useState<ScheduleConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_CONFIG;
      return normalizeConfig(JSON.parse(raw));
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  const formatted = useMemo(() => {
    const entry = `${String(config.entryHour).padStart(2, "0")}:${String(config.entryMinute).padStart(2, "0")}`;
    const exit = `${String(config.exitHour).padStart(2, "0")}:${String(config.exitMinute).padStart(2, "0")}`;
    return { entry, exit };
  }, [config]);

  return { config, setConfig, formatted, defaults: DEFAULT_CONFIG };
}
