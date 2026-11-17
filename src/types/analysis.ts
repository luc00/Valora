export interface CompetitorPrice {
  platform: string;
  averagePrice: string;
  conditionNote: string;
}

export interface RiskPrevention {
  risk: string;
  prevention: string;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface EarningsBreakdown {
  grossEstimate: string;
  estimatedFees: string;
  estimatedShipping: string;
  netEarnings: string;
  notes: string;
}

export interface AnalysisReport {
  itemName: string;
  detectedCondition: string;
  mobileSummary: string;
  idealPrice: string;
  priceRange: string;
  bestTimeToSell: string;
  timingReason: string;
  priceRationale: string;
  keyFactors: string[];
  conversionProbability: number;
  demandSummary: string;
  competitorPrices: CompetitorPrice[];
  earnings: EarningsBreakdown;
  risksAndPreventions: RiskPrevention[];
  groundingSources: GroundingSource[];
}

export interface AnalyzeRequestPayload {
  description?: string;
  imageDataUrl?: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  thumbnailDataUrl: string | null;
  description: string;
  report: AnalysisReport;
}
