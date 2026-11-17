import { Clock, Image as ImageIcon, Trash2 } from 'lucide-react';
import type { HistoryEntry } from '../types/analysis.ts';
import { formatRelativeTimeIt } from '../utils/historyStorage.ts';

interface HistorySectionProps {
  entries: HistoryEntry[];
  onSelectEntry: (entry: HistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
}

export function HistorySection({
  entries,
  onSelectEntry,
  onDeleteEntry,
  onClearAll,
}: HistorySectionProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Cronologia analisi recenti"
      className="mt-8 w-full rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] pb-3.5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#64748B]" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold text-[#0F172A]">
            Cronologia recente
          </h2>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-[#64748B] transition-colors hover:text-[#DC2626] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A] whitespace-nowrap shrink-0"
        >
          Svuota cronologia
        </button>
      </div>

      <ul className="mt-2 divide-y divide-[#E2E8F0]">
          {entries.map((entry) => {
            const relativeTime = formatRelativeTimeIt(entry.createdAt);
            return (
              <li key={entry.id} className="flex items-center justify-between gap-2 py-2.5">
                <button
                  type="button"
                  onClick={() => onSelectEntry(entry)}
                  className="group flex min-w-0 flex-1 items-center gap-3.5 rounded-xl p-1.5 text-left transition-colors hover:bg-[#F8FAFC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                    {entry.thumbnailDataUrl ? (
                      <img
                        src={entry.thumbnailDataUrl}
                        alt={entry.report.itemName}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-[#94A3B8]" aria-hidden="true" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#0F172A] group-hover:underline group-hover:decoration-[#CBD5E1] group-hover:underline-offset-4">
                      {entry.report.itemName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#64748B]">
                      <span className="font-mono font-medium text-[#0F172A] tabular-nums">
                        {entry.report.idealPrice}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>{entry.report.detectedCondition}</span>
                      {relativeTime && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span>{relativeTime}</span>
                        </>
                      )}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteEntry(entry.id)}
                  aria-label={`Rimuovi ${entry.report.itemName} dalla cronologia`}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DC2626]"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
    </section>
  );
}
