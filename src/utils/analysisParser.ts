import type {
  AnalysisReport,
  AnalyzeRequestPayload,
  CompetitorPrice,
  GroundingSource,
  RiskPrevention,
} from '../types/analysis.ts';

export interface ParsedDataUrl {
  mimeType: string;
  base64Data: string;
}

export interface RawGroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  description: string;
  imageDataUrl?: string;
}

const DATA_URL_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/;

export function validateAnalyzeRequest(payload: AnalyzeRequestPayload): ValidationResult {
  const description = typeof payload.description === 'string' ? payload.description.trim() : '';
  const imageDataUrl =
    typeof payload.imageDataUrl === 'string' && payload.imageDataUrl.trim().length > 0
      ? payload.imageDataUrl.trim()
      : undefined;

  if (!description && !imageDataUrl) {
    return {
      valid: false,
      error: 'Carica una foto oppure descrivi brevemente ciò che vuoi vendere.',
      description: '',
    };
  }

  if (description.length > 2000) {
    return {
      valid: false,
      error: 'La descrizione è troppo lunga (massimo 2000 caratteri).',
      description,
    };
  }

  if (imageDataUrl && !DATA_URL_REGEX.test(imageDataUrl)) {
    return {
      valid: false,
      error: 'Formato immagine non valido. Carica un file JPG, PNG o WebP.',
      description,
    };
  }

  return {
    valid: true,
    description,
    imageDataUrl,
  };
}

export function parseDataUrl(dataUrl: string): ParsedDataUrl {
  const match = DATA_URL_REGEX.exec(dataUrl.trim());
  if (!match) {
    throw new Error('Formato Data URL immagine non valido.');
  }
  return {
    mimeType: match[1],
    base64Data: match[2],
  };
}

function clampProbability(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return 50;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function asNonEmptyString(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function stripMarkdownJsonFence(raw: string): string {
  const trimmed = raw.trim();
  const fencedMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

export function extractGroundingSources(chunks: unknown): GroundingSource[] {
  if (!Array.isArray(chunks)) {
    return [];
  }
  const seen = new Set<string>();
  const sources: GroundingSource[] = [];

  for (const item of chunks) {
    const chunk = item as RawGroundingChunk | null | undefined;
    const url = chunk?.web?.uri?.trim();
    if (!url || (!url.startsWith('https://') && !url.startsWith('http://'))) {
      continue;
    }
    if (seen.has(url)) {
      continue;
    }
    seen.add(url);
    const title = chunk?.web?.title?.trim() || new URL(url).hostname.replace(/^www\./, '');
    sources.push({ title, url });
    if (sources.length >= 6) {
      break;
    }
  }

  return sources;
}

export function parseAnalysisResponse(
  rawText: string,
  groundingChunks?: unknown,
): AnalysisReport {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Risposta vuota dal servizio di analisi.');
  }

  const cleaned = stripMarkdownJsonFence(rawText);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    throw new Error('Impossibile interpretare il report strutturato ricevuto.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Il formato della risposta non è valido.');
  }

  const rawCompetitors = Array.isArray(parsed.competitorPrices) ? parsed.competitorPrices : [];
  const competitorPrices: CompetitorPrice[] = rawCompetitors
    .map((entry) => {
      const row = entry as Record<string, unknown>;
      return {
        platform: asNonEmptyString(row?.platform, ''),
        averagePrice: asNonEmptyString(row?.averagePrice, ''),
        conditionNote: asNonEmptyString(row?.conditionNote, 'Media di mercato'),
      };
    })
    .filter((row) => row.platform.length > 0 && row.averagePrice.length > 0);

  const rawRisks = Array.isArray(parsed.risksAndPreventions) ? parsed.risksAndPreventions : [];
  const risksAndPreventions: RiskPrevention[] = rawRisks
    .map((entry) => {
      const row = entry as Record<string, unknown>;
      return {
        risk: asNonEmptyString(row?.risk, ''),
        prevention: asNonEmptyString(row?.prevention, ''),
      };
    })
    .filter((row) => row.risk.length > 0 && row.prevention.length > 0);

  const rawFactors = Array.isArray(parsed.keyFactors) ? parsed.keyFactors : [];
  const keyFactors = rawFactors
    .map((f) => (typeof f === 'string' ? f.trim() : ''))
    .filter((f) => f.length > 0);

  const rawEarnings = (parsed.earnings && typeof parsed.earnings === 'object'
    ? parsed.earnings
    : {}) as Record<string, unknown>;

  return {
    itemName: asNonEmptyString(parsed.itemName, 'Articolo analizzato'),
    detectedCondition: asNonEmptyString(parsed.detectedCondition, 'Stato valutato'),
    mobileSummary: asNonEmptyString(
      parsed.mobileSummary,
      'Valutazione completata in base ai prezzi correnti di mercato.',
    ),
    idealPrice: asNonEmptyString(parsed.idealPrice, 'N/D'),
    priceRange: asNonEmptyString(parsed.priceRange, 'Fascia non disponibile'),
    bestTimeToSell: asNonEmptyString(parsed.bestTimeToSell, 'Subito'),
    timingReason: asNonEmptyString(
      parsed.timingReason,
      'Domanda stabile nei principali marketplace italiani.',
    ),
    priceRationale: asNonEmptyString(
      parsed.priceRationale,
      'Prezzo calcolato confrontando annunci attivi e venduti recenti.',
    ),
    keyFactors,
    conversionProbability: clampProbability(parsed.conversionProbability),
    demandSummary: asNonEmptyString(
      parsed.demandSummary,
      'Interesse costante da parte degli acquirenti a questa fascia di prezzo.',
    ),
    competitorPrices,
    earnings: {
      grossEstimate: asNonEmptyString(rawEarnings.grossEstimate, asNonEmptyString(parsed.idealPrice, 'N/D')),
      estimatedFees: asNonEmptyString(rawEarnings.estimatedFees, '€ 0 – € 15'),
      estimatedShipping: asNonEmptyString(rawEarnings.estimatedShipping, '€ 7 – € 12'),
      netEarnings: asNonEmptyString(rawEarnings.netEarnings, asNonEmptyString(parsed.idealPrice, 'N/D')),
      notes: asNonEmptyString(
        rawEarnings.notes,
        'La consegna a mano su piattaforme locali azzera commissioni e costi di spedizione.',
      ),
    },
    risksAndPreventions,
    groundingSources: extractGroundingSources(groundingChunks),
  };
}

export function formatReportForClipboard(report: AnalysisReport): string {
  const lines = [
    `${report.itemName} (${report.detectedCondition})`,
    `Prezzo ideale: ${report.idealPrice} (${report.priceRange})`,
    `Momento migliore: ${report.bestTimeToSell} — ${report.timingReason}`,
    `Probabilità di vendita: ${report.conversionProbability}%`,
    `Guadagno netto stimato: ${report.earnings.netEarnings}`,
    '',
    `Sintesi: ${report.mobileSummary}`,
  ];
  return lines.join('\n');
}
