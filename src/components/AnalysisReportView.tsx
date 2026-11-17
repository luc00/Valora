import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, ExternalLink, RotateCcw } from 'lucide-react';
import type { AnalysisReport } from '../types/analysis.ts';
import { formatReportForClipboard } from '../utils/analysisParser.ts';

interface AnalysisReportViewProps {
  report: AnalysisReport;
  uploadedImageUrl: string | null;
  onReset: () => void;
}

export function AnalysisReportView({
  report,
  uploadedImageUrl,
  onReset,
}: AnalysisReportViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(formatReportForClipboard(report));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-6"
    >
      {/* Item Header & Quick Mobile Summary */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#64748B]">
              Articolo rilevato · {report.detectedCondition}
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl text-balance">
              {report.itemName}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-[#475569]">
              {report.mobileSummary}
            </p>
          </div>
          {uploadedImageUrl && (
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white p-1">
              <img
                src={uploadedImageUrl}
                alt={report.itemName}
                referrerPolicy="no-referrer"
                className="h-full w-full rounded-lg object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* Hero Card: Prezzo Ideale di Vendita & Momento Migliore */}
      <section
        aria-label="Prezzo ideale di vendita"
        className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8"
      >
        <div className="grid gap-6 sm:grid-cols-2 sm:items-end">
          <div>
            <p className="text-sm font-medium text-[#64748B]">Prezzo Ideale di Vendita</p>
            <p
              data-testid="ideal-price-value"
              className="mt-2 font-mono text-4xl font-semibold tracking-tight text-[#0F172A] tabular-nums sm:text-5xl"
            >
              {report.idealPrice}
            </p>
            <p className="mt-2 font-mono text-xs font-medium text-[#475569] tabular-nums">
              Fascia ottimale: {report.priceRange}
            </p>
          </div>

          <div className="border-t border-[#E2E8F0] pt-5 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
            <p className="text-sm font-medium text-[#64748B]">Momento Migliore per Vendere</p>
            <p className="mt-1.5 text-base font-semibold text-[#0F172A]">
              {report.bestTimeToSell}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[#475569]">
              {report.timingReason}
            </p>
          </div>
        </div>
      </section>

      {/* Tasso di Conversione / Domanda */}
      <section
        aria-label="Tasso di conversione e domanda di mercato"
        className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#0F172A]">
            Probabilità di vendita / Domanda di mercato
          </h3>
          <span
            data-testid="conversion-probability"
            className="font-mono text-2xl font-semibold text-[#0F172A] tabular-nums"
          >
            {report.conversionProbability}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={report.conversionProbability}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Probabilità di vendita"
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]"
        >
          <div
            className="h-full rounded-full bg-[#0F172A] transition-[width] duration-500 ease-out"
            style={{ width: `${report.conversionProbability}%` }}
          />
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[#475569]">
          {report.demandSummary}
        </p>
      </section>

      {/* Perché questo prezzo */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
        <h3 className="text-base font-semibold text-[#0F172A]">
          Perché questo prezzo
        </h3>
        <p className="mt-2.5 text-[15px] leading-relaxed text-[#334155]">
          {report.priceRationale}
        </p>
        {report.keyFactors.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-[#E2E8F0] pt-4 text-sm text-[#475569]">
            {report.keyFactors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0F172A]" aria-hidden="true" />
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Prezzi dei Competitor */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
        <h3 className="text-base font-semibold text-[#0F172A]">
          Prezzi dei Competitor
        </h3>
        <div className="mt-4 -mx-1 overflow-x-auto px-1">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-xs font-medium text-[#64748B]">
                <th className="py-2.5 pr-3 font-medium sm:pr-4">Piattaforma</th>
                <th className="py-2.5 px-2.5 text-right font-medium whitespace-nowrap sm:px-4">
                  Prezzo Medio
                </th>
                <th className="py-2.5 pl-3 font-medium sm:pl-4">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {report.competitorPrices.map((row, idx) => (
                <tr key={`${row.platform}-${idx}`} className="transition-colors hover:bg-[#F8FAFC]">
                  <td className="py-3 pr-3 font-medium text-[#0F172A] whitespace-nowrap sm:pr-4">
                    {row.platform}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono font-semibold text-[#0F172A] tabular-nums whitespace-nowrap sm:px-4">
                    {row.averagePrice}
                  </td>
                  <td className="py-3 pl-3 text-[13px] leading-snug text-[#475569] sm:pl-4 sm:text-sm">
                    {row.conditionNote}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {report.groundingSources.length > 0 && (
          <div className="mt-4 border-t border-[#E2E8F0] pt-3">
            <p className="text-xs font-medium text-[#64748B]">Fonti web consultate</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
              {report.groundingSources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#334155] underline decoration-[#CBD5E1] underline-offset-4 hover:text-[#0F172A] hover:decoration-[#0F172A]"
                >
                  <span className="max-w-[240px] truncate">{source.title}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Guadagni Stimati vs Costi */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6">
        <h3 className="text-base font-semibold text-[#0F172A]">
          Guadagni Stimati vs Costi
        </h3>

        <dl className="mt-4 divide-y divide-[#E2E8F0] text-sm">
          <div className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-[#475569]">Incasso lordo stimato</dt>
            <dd className="font-mono font-medium text-[#0F172A] tabular-nums whitespace-nowrap shrink-0">
              {report.earnings.grossEstimate}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-[#475569]">Commissioni piattaforma stimate</dt>
            <dd className="font-mono font-medium text-[#475569] tabular-nums whitespace-nowrap shrink-0">
              {report.earnings.estimatedFees}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-[#475569]">Spedizione e imballaggio</dt>
            <dd className="font-mono font-medium text-[#475569] tabular-nums whitespace-nowrap shrink-0">
              {report.earnings.estimatedShipping}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 pt-3.5 pb-1">
            <dt className="font-semibold text-[#0F172A]">Guadagno netto stimato</dt>
            <dd className="font-mono text-base font-semibold text-[#16A34A] tabular-nums whitespace-nowrap shrink-0 sm:text-lg">
              {report.earnings.netEarnings}
            </dd>
          </div>
        </dl>

        <p className="mt-3 border-t border-[#E2E8F0] pt-3 text-xs leading-relaxed text-[#475569]">
          {report.earnings.notes}
        </p>
      </section>

      {/* Prevenzioni e Rischi */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
        <h3 className="text-base font-semibold text-[#0F172A]">
          Prevenzioni e Rischi
        </h3>
        <ul className="mt-4 space-y-4">
          {report.risksAndPreventions.map((item, idx) => (
            <li
              key={idx}
              className="border-b border-[#E2E8F0] pb-4 last:border-b-0 last:pb-0"
            >
              <p className="text-sm font-semibold text-[#0F172A]">{item.risk}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#475569]">
                <span className="font-medium text-[#334155]">Come prevenirlo: </span>
                {item.prevention}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Bottom Action Bar */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleCopySummary}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A] whitespace-nowrap"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-[#16A34A]" aria-hidden="true" />
              <span>Riepilogo copiato</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden="true" />
              <span>Copia Riepilogo</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A] whitespace-nowrap"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Nuova Analisi</span>
        </button>
      </div>
    </motion.div>
  );
}
