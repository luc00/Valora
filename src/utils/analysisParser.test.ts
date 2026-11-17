import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractGroundingSources,
  formatReportForClipboard,
  parseAnalysisResponse,
  parseDataUrl,
  validateAnalyzeRequest,
} from './analysisParser.ts';

test('validateAnalyzeRequest rejects empty payload', () => {
  const res = validateAnalyzeRequest({ description: '   ', imageDataUrl: '' });
  assert.equal(res.valid, false);
  assert.ok(res.error && res.error.length > 0);
});

test('validateAnalyzeRequest accepts valid description only', () => {
  const res = validateAnalyzeRequest({ description: '  iPhone 13 Pro 128GB  ' });
  assert.equal(res.valid, true);
  assert.equal(res.description, 'iPhone 13 Pro 128GB');
});

test('validateAnalyzeRequest rejects malformed image data URL', () => {
  const res = validateAnalyzeRequest({ imageDataUrl: 'https://example.com/photo.jpg' });
  assert.equal(res.valid, false);
});

test('parseDataUrl extracts mime type and base64 payload', () => {
  const parsed = parseDataUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg==');
  assert.equal(parsed.mimeType, 'image/jpeg');
  assert.equal(parsed.base64Data, '/9j/4AAQSkZJRg==');
});

test('parseAnalysisResponse parses markdown-fenced JSON and clamps probability', () => {
  const raw = [
    '```json',
    JSON.stringify({
      itemName: 'iPhone 13 Pro 128GB',
      detectedCondition: 'Ottime condizioni',
      mobileSummary: 'Richiesta alta tra 410 e 450 euro.',
      idealPrice: '€ 430',
      priceRange: '€ 410 – € 455',
      bestTimeToSell: 'Entro i prossimi 10 giorni',
      timingReason: 'Prima del calo stagionale post-festività.',
      priceRationale: 'Batteria integra e scocca senza graffi evidenti.',
      keyFactors: ['Memoria 128GB molto richiesta', 'Colore grafite facile da rivendere'],
      conversionProbability: 128,
      demandSummary: 'Vendita rapida prevista entro una settimana.',
      competitorPrices: [
        { platform: 'Subito', averagePrice: '€ 425', conditionNote: 'Ritiro a mano' },
        { platform: 'eBay', averagePrice: '€ 450', conditionNote: 'Inclusa protezione' },
      ],
      earnings: {
        grossEstimate: '€ 430',
        estimatedFees: '€ 0 – € 25',
        estimatedShipping: '€ 9',
        netEarnings: '€ 396 – € 430',
        notes: 'Consegna a mano senza commissioni.',
      },
      risksAndPreventions: [
        {
          risk: 'Richieste di pagamento fuori piattaforma',
          prevention: 'Accetta solo TuttoSubito o contanti dal vivo.',
        },
      ],
    }),
    '```',
  ].join('\n');

  const chunks = [
    { web: { uri: 'https://www.subito.it/annunci-italia/vendita/iphone-13-pro', title: 'Subito.it' } },
    { web: { uri: 'https://www.subito.it/annunci-italia/vendita/iphone-13-pro', title: 'Duplicate' } },
    { web: { uri: 'javascript:alert(1)', title: 'Unsafe' } },
  ];

  const report = parseAnalysisResponse(raw, chunks);
  assert.equal(report.itemName, 'iPhone 13 Pro 128GB');
  assert.equal(report.conversionProbability, 100);
  assert.equal(report.competitorPrices.length, 2);
  assert.equal(report.groundingSources.length, 1);
  assert.equal(report.groundingSources[0].title, 'Subito.it');

  const clipboardText = formatReportForClipboard(report);
  assert.match(clipboardText, /Prezzo ideale: € 430/);
  assert.match(clipboardText, /100%/);
});

test('extractGroundingSources skips invalid entries and deduplicates URLs', () => {
  const sources = extractGroundingSources([
    { web: { uri: 'https://www.ebay.it/sch/iphone', title: 'eBay Italia' } },
    { web: { uri: 'https://www.ebay.it/sch/iphone', title: 'eBay Duplicate' } },
    { web: { uri: 'https://www.vinted.it/catalog' } },
  ]);
  assert.equal(sources.length, 2);
  assert.equal(sources[1].title, 'vinted.it');
});
