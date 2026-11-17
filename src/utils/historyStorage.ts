import type { AnalysisReport, HistoryEntry } from '../types/analysis.ts';

export const HISTORY_STORAGE_KEY = 'valora_analysis_history_v1';
export const MAX_HISTORY_ITEMS = 5;

function isValidReportShape(value: unknown): value is AnalysisReport {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const r = value as Record<string, unknown>;
  return (
    typeof r.itemName === 'string' &&
    r.itemName.trim().length > 0 &&
    typeof r.idealPrice === 'string' &&
    typeof r.conversionProbability === 'number' &&
    Array.isArray(r.competitorPrices) &&
    Array.isArray(r.risksAndPreventions)
  );
}

export function parseStoredHistory(rawJson: string | null): HistoryEntry[] {
  if (!rawJson || typeof rawJson !== 'string') {
    return [];
  }
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is HistoryEntry => {
        if (!item || typeof item !== 'object') return false;
        const entry = item as Record<string, unknown>;
        return (
          typeof entry.id === 'string' &&
          entry.id.length > 0 &&
          typeof entry.createdAt === 'string' &&
          (entry.thumbnailDataUrl === null || typeof entry.thumbnailDataUrl === 'string') &&
          typeof entry.description === 'string' &&
          isValidReportShape(entry.report)
        );
      })
      .slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

export function addHistoryEntry(
  existing: HistoryEntry[],
  newEntry: HistoryEntry,
): HistoryEntry[] {
  const filtered = existing.filter((item) => item.id !== newEntry.id);
  return [newEntry, ...filtered].slice(0, MAX_HISTORY_ITEMS);
}

export function removeHistoryEntry(
  existing: HistoryEntry[],
  id: string,
): HistoryEntry[] {
  return existing.filter((item) => item.id !== id);
}

export function createHistoryEntry(params: {
  report: AnalysisReport;
  thumbnailDataUrl: string | null;
  description: string;
  now?: Date;
}): HistoryEntry {
  const date = params.now ?? new Date();
  const uniqueSuffix = Math.random().toString(36).slice(2, 8);
  return {
    id: `${date.getTime()}-${uniqueSuffix}`,
    createdAt: date.toISOString(),
    thumbnailDataUrl: params.thumbnailDataUrl,
    description: params.description,
    report: params.report,
  };
}

export function formatRelativeTimeIt(isoDate: string, nowMs = Date.now()): string {
  const parsed = Date.parse(isoDate);
  if (!Number.isFinite(parsed)) {
    return '';
  }
  const diffSeconds = Math.max(0, Math.floor((nowMs - parsed) / 1000));
  if (diffSeconds < 60) {
    return 'Adesso';
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} min fa`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? '1 ora fa' : `${diffHours} ore fa`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'Ieri';
  }
  if (diffDays < 7) {
    return `${diffDays} giorni fa`;
  }
  return new Date(parsed).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });
}

export function loadHistoryFromStorage(): HistoryEntry[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    return parseStoredHistory(window.localStorage.getItem(HISTORY_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveHistoryToStorage(entries: HistoryEntry[]): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  const bounded = entries.slice(0, MAX_HISTORY_ITEMS);
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(bounded));
  } catch {
    // Fallback if quota exceeded: drop thumbnails from older entries first
    try {
      const stripped = bounded.map((entry, idx) =>
        idx === 0 ? entry : { ...entry, thumbnailDataUrl: null },
      );
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(stripped));
    } catch {
      // Ignore storage errors in restricted browsing modes
    }
  }
}

export function clearHistoryInStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
