import type { AnalysisReport } from '../types/analysis.ts';

export const DEMO_REPORT: AnalysisReport = {
  itemName: 'Apple iPhone 13 Pro · 128 GB',
  detectedCondition: 'Usato in ottime condizioni',
  mobileSummary:
    'Prezzo ideale € 430 (fascia € 410–455). Alta liquidità sul mercato italiano con probabilità di vendita del 78% entro 7 giorni.',
  idealPrice: '€ 430',
  priceRange: '€ 410 – € 455',
  bestTimeToSell: 'Entro i prossimi 7–10 giorni',
  timingReason:
    'La domanda prenatalizia per dispositivi ricondizionati di fascia alta è al picco prima delle promozioni di fine stagione.',
  priceRationale:
    'Gli annunci attivi su Subito ed eBay mostrano una media di € 440 per unità da 128 GB senza danni estetici. Posizionarsi a € 430 ti colloca nel primo quartile per convenienza mantenendo il margine massimo rispetto ai ritiri dei negozi.',
  keyFactors: [
    'Taglio da 128 GB con rotazione media inferiore a 6 giorni nei principali portali italiani.',
    'Assenza di segni visibili su scocca e fotocamere consente di evitare sconti per difetti.',
    'Presenza di scatola originale e cavo aumenta la fiducia degli acquirenti fino al 12%.',
  ],
  conversionProbability: 78,
  demandSummary:
    'Domanda sostenuta: circa 4 acquirenti su 5 concludono a questa cifra se la capacità batteria supera l’85%.',
  competitorPrices: [
    {
      platform: 'Subito.it',
      averagePrice: '€ 420',
      conditionNote: 'Privati, trattativa media -5%',
    },
    {
      platform: 'eBay Italia',
      averagePrice: '€ 449',
      conditionNote: 'Venduti reali con spedizione',
    },
    {
      platform: 'Vinted',
      averagePrice: '€ 415',
      conditionNote: 'Acquirenti attenti al prezzo',
    },
    {
      platform: 'Amazon Renewed',
      averagePrice: '€ 495',
      conditionNote: 'Ricondizionato con garanzia 12 mesi',
    },
  ],
  earnings: {
    grossEstimate: '€ 430',
    estimatedFees: '€ 0 – € 28',
    estimatedShipping: '€ 0 – € 10',
    netEarnings: '€ 392 – € 430',
    notes:
      'Vendendo con scambio a mano su Subito incassi il 100% (€ 430 netti). Su eBay o spedizione assicurata considera circa il 6–8% tra commissioni e corriere.',
  },
  risksAndPreventions: [
    {
      risk: 'Richieste di pagamento esterne o link di phishing finti corrieri',
      prevention:
        'Completa sempre il pagamento dentro TuttoSubito, eBay o in contanti/bonifico istantaneo verificato di persona.',
    },
    {
      risk: 'Contestazioni post-consegna sullo stato reale della batteria',
      prevention:
        'Includi nell’annuncio uno screenshot della sezione Stato Batteria e fotografa il numero seriale prima della spedizione.',
    },
    {
      risk: 'Svalutazione rapida in prossimità di nuove uscite o sconti retail',
      prevention:
        'Rispondi entro 2 ore ai primi contatti qualificati e imposta un prezzo leggermente trattabile solo oltre i 10 giorni.',
    },
  ],
  groundingSources: [
    {
      title: 'Subito.it — Annunci iPhone 13 Pro 128GB',
      url: 'https://www.subito.it',
    },
    {
      title: 'eBay Italia — Venduti recenti iPhone 13 Pro',
      url: 'https://www.ebay.it',
    },
  ],
};
