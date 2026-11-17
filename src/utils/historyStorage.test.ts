import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_HISTORY_ITEMS,
  addHistoryEntry,
  createHistoryEntry,
  formatRelativeTimeIt,
  parseStoredHistory,
  removeHistoryEntry,
} from './historyStorage.ts';
import type { AnalysisReport } from '../types/analysis.ts';

const SAMPLE_REPORT: AnalysisReport = {
  itemName: 'Fotocamera Fujifilm X100V',
  detectedCondition: 'Usato come nuovo',
  mobileSummary: 'Prezzo ideale € 1.250.',
  idealPrice: '€ 1.250',
  priceRange: '€ 1.200 – € 1.320',
  bestTimeToSell: 'Subito',
  timingReason: 'Domanda elevata.',
  priceRationale: 'Molto richiesta sul mercato usato.',
  keyFactors: ['Pochi scatti'],
  conversionProbability: 82,
  demandSummary: 'Vendita rapida.',
  competitorPrices: [{ platform: 'Subito', averagePrice: '€ 1.240', conditionNote: 'Privati' }],
  earnings: {
    grossEstimate: '€ 1.250',
    estimatedFees: '€ 0',
    estimatedShipping: '€ 10',
    netEarnings: '€ 1.240',
    notes: 'Scambio a mano consigliato.',
  },
  risksAndPreventions: [{ risk: 'Phishing', prevention: 'Solo pagamento sicuro' }],
  groundingSources: [],
};

test('addHistoryEntry prepends newest item and caps list at 5', () => {
  let list = [] as ReturnType<typeof createHistoryEntry>[];
  for (let i = 1; i <= 7; i++) {
    const entry = createHistoryEntry({
      report: { ...SAMPLE_REPORT, itemName: `Oggetto ${i}` },
      thumbnailDataUrl: `data:image/jpeg;base64,abc${i}`,
      description: `Descrizione ${i}`,
      now: new Date(1700000000000 + i * 1000),
    });
    list = addHistoryEntry(list, entry);
  }

  assert.equal(list.length, MAX_HISTORY_ITEMS);
  assert.equal(list[0].report.itemName, 'Oggetto 7');
  assert.equal(list[4].report.itemName, 'Oggetto 3');
});

test('removeHistoryEntry removes target id only', () => {
  const first = createHistoryEntry({
    report: { ...SAMPLE_REPORT, itemName: 'Primo' },
    thumbnailDataUrl: null,
    description: 'd1',
  });
  const second = createHistoryEntry({
    report: { ...SAMPLE_REPORT, itemName: 'Secondo' },
    thumbnailDataUrl: null,
    description: 'd2',
  });

  const combined = addHistoryEntry([first], second);
  const afterRemove = removeHistoryEntry(combined, first.id);
  assert.equal(afterRemove.length, 1);
  assert.equal(afterRemove[0].report.itemName, 'Secondo');
});

test('parseStoredHistory ignores invalid JSON and corrupted records', () => {
  assert.deepEqual(parseStoredHistory('{invalid'), []);
  const validEntry = createHistoryEntry({
    report: SAMPLE_REPORT,
    thumbnailDataUrl: null,
    description: 'test',
  });
  const raw = JSON.stringify([validEntry, { id: 'bad', broken: true }]);
  const parsed = parseStoredHistory(raw);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].report.itemName, 'Fotocamera Fujifilm X100V');
});

test('formatRelativeTimeIt formats Italian relative intervals', () => {
  const now = Date.parse('2026-11-17T12:00:00.000Z');
  assert.equal(formatRelativeTimeIt('2026-11-17T11:59:30.000Z', now), 'Adesso');
  assert.equal(formatRelativeTimeIt('2026-11-17T11:45:00.000Z', now), '15 min fa');
  assert.equal(formatRelativeTimeIt('2026-11-17T10:00:00.000Z', now), '2 ore fa');
  assert.equal(formatRelativeTimeIt('2026-11-16T12:00:00.000Z', now), 'Ieri');
});
