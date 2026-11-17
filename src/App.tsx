import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Info } from 'lucide-react';
import { InputCard } from './components/InputCard.tsx';
import { WarpTunnelLoader } from './components/WarpTunnelLoader.tsx';
import { AnalysisReportView } from './components/AnalysisReportView.tsx';
import { HistorySection } from './components/HistorySection.tsx';
import { InfoModal } from './components/InfoModal.tsx';
import { DEMO_REPORT } from './data/demoReport.ts';
import type { AnalysisReport, HistoryEntry } from './types/analysis.ts';
import { validateAnalyzeRequest } from './utils/analysisParser.ts';
import {
  addHistoryEntry,
  clearHistoryInStorage,
  createHistoryEntry,
  loadHistoryFromStorage,
  removeHistoryEntry,
  saveHistoryToStorage,
} from './utils/historyStorage.ts';
import { createThumbnailDataUrl } from './utils/imageOptimizer.ts';

type ViewState = 'input' | 'loading' | 'results';

export default function App() {
  const [viewState, setViewState] = useState<ViewState>('input');
  const [description, setDescription] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistoryFromStorage());
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.body.dataset.view = viewState;
  }, [viewState]);

  const recordAnalysisInHistory = async (
    nextReport: AnalysisReport,
    sourceImageUrl: string | null,
    itemDescription: string,
  ) => {
    const thumbnailDataUrl = await createThumbnailDataUrl(sourceImageUrl);
    const entry = createHistoryEntry({
      report: nextReport,
      thumbnailDataUrl,
      description: itemDescription,
    });
    setHistory((prev) => {
      const updated = addHistoryEntry(prev, entry);
      saveHistoryToStorage(updated);
      return updated;
    });
  };

  const handleCancelLoading = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setViewState('input');
  };

  const handleSubmit = async () => {
    const validation = validateAnalyzeRequest({
      description,
      imageDataUrl: imagePreviewUrl ?? undefined,
    });

    if (!validation.valid) {
      setErrorMessage(validation.error ?? 'Inserisci una foto o una descrizione.');
      return;
    }

    setErrorMessage(null);
    setViewState('loading');

    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timer = window.setTimeout(() => {
        if (!controller.signal.aborted) {
          const demoResult: AnalysisReport = validation.description
            ? {
                ...DEMO_REPORT,
                itemName:
                  validation.description.length > 48
                    ? `${validation.description.slice(0, 48)}...`
                    : validation.description,
              }
            : DEMO_REPORT;
          setReport(demoResult);
          setViewState('results');
          void recordAnalysisInHistory(
            demoResult,
            validation.imageDataUrl ?? null,
            validation.description,
          );
          abortControllerRef.current = null;
        }
      }, 950);
      controller.signal.addEventListener('abort', () => window.clearTimeout(timer));
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: validation.description,
          imageDataUrl: validation.imageDataUrl,
        }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => ({}))) as {
        report?: AnalysisReport;
        error?: string;
      };

      if (!response.ok || !data.report) {
        let fallbackError = 'Impossibile completare l’analisi di mercato. Riprova.';
        if (response.status === 413) {
          fallbackError = 'L’immagine caricata supera la dimensione consentita. Prova con una foto più leggera.';
        } else if (response.status === 429) {
          fallbackError = 'Quota API temporaneamente esaurita. Attendi qualche secondo e riprova.';
        } else if (response.status === 504) {
          fallbackError = 'La richiesta ha impiegato troppo tempo. Riprova tra qualche istante.';
        }
        throw new Error(data.error || fallbackError);
      }

      setReport(data.report);
      setViewState('results');
      void recordAnalysisInHistory(
        data.report,
        validation.imageDataUrl ?? null,
        validation.description,
      );
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Errore di connessione durante l’analisi. Riprova.',
      );
      setViewState('input');
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleSelectHistoryEntry = (entry: HistoryEntry) => {
    setErrorMessage(null);
    setDescription(entry.description);
    setImagePreviewUrl(entry.thumbnailDataUrl);
    setImageName(entry.report.itemName);
    setReport(entry.report);
    setViewState('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistoryEntry = (id: string) => {
    setHistory((prev) => {
      const updated = removeHistoryEntry(prev, id);
      saveHistoryToStorage(updated);
      return updated;
    });
  };

  const handleClearHistory = () => {
    clearHistoryInStorage();
    setHistory([]);
  };

  const handleReset = () => {
    setReport(null);
    setDescription('');
    setImagePreviewUrl(null);
    setImageName(null);
    setErrorMessage(null);
    setViewState('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isCenteredInput = viewState !== 'results' && history.length === 0;

  return (
    <div
      className={`min-h-screen bg-white text-[#0F172A] ${
        isCenteredInput ? 'flex flex-col justify-center' : ''
      }`}
    >
      <main
        className={`mx-auto w-full max-w-[720px] px-4 sm:px-6 ${
          isCenteredInput ? 'py-10 sm:py-14' : 'py-10 sm:py-16'
        }`}
      >
        <header className="relative mb-8 text-center">
          <button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            aria-label="Informazioni su cosa fa il sito"
            aria-expanded={isInfoOpen}
            title="Come funziona Valora"
            className="absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] transition-colors hover:border-[#CBD5E1] hover:bg-white hover:text-[#0F172A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
          >
            <Info className="h-4 w-4" aria-hidden="true" />
          </button>

          <h1 className="font-display text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl text-balance px-12">
            Valora
          </h1>
          <p className="mx-auto mt-2.5 max-w-lg text-[15px] leading-relaxed text-[#475569]">
            {viewState === 'results'
              ? 'Report completo di valutazione, prezzo ideale e confronto sui principali marketplace.'
              : 'Carica una foto o descrivi ciò che vuoi vendere per scoprire subito il prezzo ideale e la domanda reale.'}
          </p>
        </header>

        {viewState !== 'results' && (
          <>
            <InputCard
              description={description}
              imagePreviewUrl={imagePreviewUrl}
              imageName={imageName}
              errorMessage={errorMessage}
              onDescriptionChange={(value) => {
                setDescription(value);
                if (errorMessage) setErrorMessage(null);
              }}
              onImageSelected={(dataUrl, name) => {
                setImagePreviewUrl(dataUrl);
                setImageName(name);
                if (errorMessage) setErrorMessage(null);
              }}
              onImageRemoved={() => {
                setImagePreviewUrl(null);
                setImageName(null);
              }}
              onSubmit={() => {
                void handleSubmit();
              }}
            />

            <HistorySection
              entries={history}
              onSelectEntry={handleSelectHistoryEntry}
              onDeleteEntry={handleDeleteHistoryEntry}
              onClearAll={handleClearHistory}
            />
          </>
        )}

        {viewState === 'results' && report && (
          <AnalysisReportView
            report={report}
            uploadedImageUrl={imagePreviewUrl}
            onReset={handleReset}
          />
        )}
      </main>

      <AnimatePresence>
        {viewState === 'loading' && (
          <WarpTunnelLoader onCancel={handleCancelLoading} />
        )}
      </AnimatePresence>

      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </div>
  );
}
