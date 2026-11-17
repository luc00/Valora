import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  parseAnalysisResponse,
  parseDataUrl,
  validateAnalyzeRequest,
} from './src/utils/analysisParser.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    itemName: {
      type: Type.STRING,
      description: 'Nome chiaro e specifico dell’articolo o servizio identificato, in italiano.',
    },
    detectedCondition: {
      type: Type.STRING,
      description: 'Stato d’uso o qualità stimata (es. "Usato in ottime condizioni", "Nuovo sigillato", "Servizio professionale").',
    },
    mobileSummary: {
      type: Type.STRING,
      description: 'Sintesi ultra-compatta in 1-2 frasi per lettura rapida su mobile con prezzo ideale e velocità di vendita.',
    },
    idealPrice: {
      type: Type.STRING,
      description: 'Prezzo ideale di vendita singolo formattato in Euro (es. "€ 430" o "€ 85/ora").',
    },
    priceRange: {
      type: Type.STRING,
      description: 'Fascia di prezzo ottimale (es. "€ 410 – € 455").',
    },
    bestTimeToSell: {
      type: Type.STRING,
      description: 'Momento migliore per vendere (es. "Entro 7-10 giorni", "Fine settimana", "Settembre-Ottobre").',
    },
    timingReason: {
      type: Type.STRING,
      description: 'Breve spiegazione del perché questo è il momento migliore per vendere.',
    },
    priceRationale: {
      type: Type.STRING,
      description: 'Analisi chiara del prezzo basata su condizioni visive, domanda e posizionamento competitivo.',
    },
    keyFactors: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 fattori chiave che influenzano il valore dell’articolo o servizio.',
    },
    conversionProbability: {
      type: Type.INTEGER,
      description: 'Probabilità percentuale intera da 0 a 100 che un acquirente acquisti a questo prezzo ideale.',
    },
    demandSummary: {
      type: Type.STRING,
      description: 'Spiegazione sintetica della domanda attuale e liquidità sul mercato.',
    },
    competitorPrices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform: {
            type: Type.STRING,
            description: 'Nome marketplace o canale (es. Subito.it, eBay, Vinted, Amazon, Mercato Locale).',
          },
          averagePrice: {
            type: Type.STRING,
            description: 'Prezzo medio reale osservato (es. "€ 420").',
          },
          conditionNote: {
            type: Type.STRING,
            description: 'Nota sintetica su stato o formula di vendita.',
          },
        },
        required: ['platform', 'averagePrice', 'conditionNote'],
      },
      description: 'Elenco di 3-5 prezzi medi dei competitor sui principali marketplace.',
    },
    earnings: {
      type: Type.OBJECT,
      properties: {
        grossEstimate: {
          type: Type.STRING,
          description: 'Incasso lordo al prezzo ideale (es. "€ 430").',
        },
        estimatedFees: {
          type: Type.STRING,
          description: 'Commissioni tipiche delle piattaforme (es. "€ 0 – € 25").',
        },
        estimatedShipping: {
          type: Type.STRING,
          description: 'Costo stimato di spedizione o imballaggio (es. "€ 0 – € 10").',
        },
        netEarnings: {
          type: Type.STRING,
          description: 'Guadagno netto reale stimato in tasca al venditore (es. "€ 395 – € 430").',
        },
        notes: {
          type: Type.STRING,
          description: 'Consiglio pratico su come massimizzare il netto (es. consegna a mano vs spedizione).',
        },
      },
      required: ['grossEstimate', 'estimatedFees', 'estimatedShipping', 'netEarnings', 'notes'],
    },
    risksAndPreventions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          risk: {
            type: Type.STRING,
            description: 'Rischio specifico (truffe, cali di prezzo, difetti nascosti, stagionalità).',
          },
          prevention: {
            type: Type.STRING,
            description: 'Azione concreta per prevenire il rischio.',
          },
        },
        required: ['risk', 'prevention'],
      },
      description: '3 rischi concreti con relativa prevenzione.',
    },
  },
  required: [
    'itemName',
    'detectedCondition',
    'mobileSummary',
    'idealPrice',
    'priceRange',
    'bestTimeToSell',
    'timingReason',
    'priceRationale',
    'keyFactors',
    'conversionProbability',
    'demandSummary',
    'competitorPrices',
    'earnings',
    'risksAndPreventions',
  ],
};

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isRateLimitOrTransientError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('503') ||
    message.includes('UNAVAILABLE')
  );
}

function isSchemaWithToolsError(err: unknown): boolean {
  const message = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    message.includes('400') &&
    (message.includes('schema') ||
      message.includes('mime') ||
      message.includes('json') ||
      message.includes('tool') ||
      message.includes('controlled'))
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiAttempt(params: {
  ai: GoogleGenAI;
  model: string;
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
  systemInstruction: string;
  useSearch: boolean;
  useSchema: boolean;
  thinkingLevel?: ThinkingLevel;
}) {
  const { ai, model, parts, systemInstruction, useSearch, useSchema, thinkingLevel } = params;
  const fallbackInstruction = `${systemInstruction}\n\nRESTITUISCI ESCLUSIVAMENTE UN OGGETTO JSON VALIDO (senza testo prima o dopo) CON LE CHIAVI: itemName, detectedCondition, mobileSummary, idealPrice, priceRange, bestTimeToSell, timingReason, priceRationale, keyFactors (array di stringhe), conversionProbability (numero intero 0-100), demandSummary, competitorPrices (array di {platform, averagePrice, conditionNote}), earnings ({grossEstimate, estimatedFees, estimatedShipping, netEarnings, notes}), risksAndPreventions (array di {risk, prevention}).`;

  return await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: useSchema ? systemInstruction : fallbackInstruction,
      ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
      ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
      ...(useSchema
        ? { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA }
        : {}),
    },
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`TIMEOUT_${label}`)), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function generateMarketAnalysis(description: string, imageDataUrl?: string) {
  const ai = createGeminiClient();
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  if (imageDataUrl) {
    const parsedImage = parseDataUrl(imageDataUrl);
    parts.push({
      inlineData: {
        mimeType: parsedImage.mimeType,
        data: parsedImage.base64Data,
      },
    });
  }

  const promptText = [
    'Analizza questo oggetto o servizio che l’utente vuole vendere in Italia/Europa.',
    description
      ? `Descrizione fornita dall’utente: "${description}".`
      : 'L’utente ha caricato solo la foto: identifica con precisione marca, modello, caratteristiche visibili e condizioni estetiche dall’immagine.',
    'Usa Google Search quando disponibile per verificare i prezzi reali attuali di mercato su portali come Subito.it, eBay Italia, Vinted, Amazon, Chrono24, Autoscout o tariffe di mercato per servizi analoghi.',
    'Rispondi esclusivamente in italiano naturale, preciso e orientato al venditore privato o professionista.',
  ].join('\n\n');

  parts.push({ text: promptText });

  const systemInstruction =
    'Sei un analista senior di mercato e pricing per l’e-commerce e l’usato in Italia. Valuti foto e descrizioni con rigore visivo e prezzi reali in Euro (€). Restituisci sempre un JSON valido conforme allo schema richiesto, senza testo extra o commenti.';

  const attempts: Array<{
    model: string;
    useSearch: boolean;
    thinkingLevel?: ThinkingLevel;
    timeoutMs: number;
  }> = [
    { model: 'gemini-4-hydrogen', useSearch: true, thinkingLevel: ThinkingLevel.LOW, timeoutMs: 13000 },
    { model: 'gemini-3.1-flash-lite', useSearch: true, timeoutMs: 11000 },
    { model: 'gemini-4-hydrogen', useSearch: false, thinkingLevel: ThinkingLevel.LOW, timeoutMs: 10000 },
  ];

  let lastError: unknown;
  let sawRateLimit = false;
  const totalDeadlineMs = Date.now() + 22000;

  for (const attempt of attempts) {
    const remainingMs = totalDeadlineMs - Date.now();
    if (remainingMs <= 1500) {
      break;
    }
    const effectiveTimeoutMs = Math.min(attempt.timeoutMs, remainingMs);

    try {
      return await withTimeout(
        callGeminiAttempt({
          ai,
          model: attempt.model,
          parts,
          systemInstruction,
          useSearch: attempt.useSearch,
          useSchema: true,
          thinkingLevel: attempt.thinkingLevel,
        }),
        effectiveTimeoutMs,
        attempt.model,
      );
    } catch (err: unknown) {
      lastError = err;
      if (isRateLimitOrTransientError(err)) {
        sawRateLimit = true;
      }
      if (isSchemaWithToolsError(err)) {
        const schemaRemainingMs = totalDeadlineMs - Date.now();
        if (schemaRemainingMs <= 1500) {
          break;
        }
        try {
          return await withTimeout(
            callGeminiAttempt({
              ai,
              model: attempt.model,
              parts,
              systemInstruction,
              useSearch: attempt.useSearch,
              useSchema: false,
              thinkingLevel: attempt.thinkingLevel,
            }),
            Math.min(attempt.timeoutMs, schemaRemainingMs),
            `${attempt.model}_noschema`,
          );
        } catch (schemaFallbackErr: unknown) {
          lastError = schemaFallbackErr;
          if (isRateLimitOrTransientError(schemaFallbackErr)) {
            sawRateLimit = true;
          }
          const schemaMsg =
            schemaFallbackErr instanceof Error
              ? schemaFallbackErr.message
              : String(schemaFallbackErr);
          if (!isRateLimitOrTransientError(schemaFallbackErr) && !schemaMsg.startsWith('TIMEOUT_')) {
            throw schemaFallbackErr;
          }
          await delay(200);
          continue;
        }
      }
      const msg = err instanceof Error ? err.message : String(err);
      if (!isRateLimitOrTransientError(err) && !msg.startsWith('TIMEOUT_')) {
        throw err;
      }
      console.warn(
        `Tentativo ${attempt.model} (search=${attempt.useSearch}) fallito/limitato:`,
        msg,
      );
      await delay(200);
    }
  }

  if (sawRateLimit) {
    throw new Error('RESOURCE_EXHAUSTED_429');
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.post('/api/analyze', async (req, res) => {
    const validation = validateAnalyzeRequest(req.body ?? {});
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    try {
      const response = await generateMarketAnalysis(
        validation.description,
        validation.imageDataUrl,
      );
      const rawText = response.text ?? '';
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const report = parseAnalysisResponse(rawText, groundingChunks);
      res.json({ report });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore imprevisto durante l’analisi.';
      console.error('Errore /api/analyze:', err);
      if (message === 'MISSING_API_KEY') {
        res.status(500).json({
          error:
            'Chiave API Gemini non configurata sul server. Verifica la configurazione in Settings > Secrets.',
        });
        return;
      }
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        res.status(429).json({
          error:
            'Quota API temporaneamente esaurita. Attendi qualche secondo e riprova, oppure verifica il piano della chiave API in Settings > Secrets.',
        });
        return;
      }
      if (message.includes('403') || message.includes('PERMISSION_DENIED') || message.includes('API_KEY_INVALID')) {
        res.status(403).json({
          error:
            'Chiave API Gemini non valida o senza permessi sufficienti. Controlla Settings > Secrets.',
        });
        return;
      }
      if (message.startsWith('TIMEOUT_')) {
        res.status(504).json({
          error:
            'La ricerca di mercato ha impiegato troppo tempo. Riprova tra qualche istante.',
        });
        return;
      }
      res.status(502).json({
        error: 'Non è stato possibile completare l’analisi di mercato. Riprova tra poco.',
        code: message.slice(0, 120),
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build non trovata.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Valora server in ascolto su http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Avvio server fallito:', err);
  process.exit(1);
});
