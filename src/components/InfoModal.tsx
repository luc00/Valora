import { useEffect } from 'react';
import { X } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0F172A]/40 px-4 py-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 text-left shadow-xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <h2
              id="info-dialog-title"
              className="font-display text-lg font-bold tracking-tight text-[#0F172A]"
            >
              Come funziona Valora
            </h2>
            <p className="mt-0.5 text-xs text-[#64748B]">
              Valutazione intelligente per vendere al miglior prezzo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi informazioni"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#475569]">
          <p>
            <strong className="font-semibold text-[#0F172A]">Valora</strong> ti aiuta a
            stabilire il prezzo giusto prima di pubblicare un annuncio, analizzando foto e
            descrizione dell’oggetto o del servizio che vuoi vendere.
          </p>

          <ol className="space-y-2.5 border-t border-[#E2E8F0] pt-4">
            <li>
              <span className="font-semibold text-[#0F172A]">1. Scansione visiva e testo: </span>
              identifica modello, stato d’uso e dettagli chiave direttamente dall’immagine o dalla
              descrizione.
            </li>
            <li>
              <span className="font-semibold text-[#0F172A]">2. Confronto di mercato: </span>
              verifica i prezzi medi su piattaforme come Subito.it, eBay, Vinted e Amazon.
            </li>
            <li>
              <span className="font-semibold text-[#0F172A]">3. Report completo: </span>
              stima prezzo ideale, momento migliore per vendere, probabilità di vendita, guadagno
              netto al netto di commissioni e rischi da prevenire.
            </li>
          </ol>

          <p className="border-t border-[#E2E8F0] pt-3 text-xs text-[#64748B]">
            Le ultime 5 analisi restano salvate nella cronologia locale del tuo browser e possono
            essere consultate o eliminate in qualsiasi momento.
          </p>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
          >
            Ho capito
          </button>
        </div>
      </div>
    </div>
  );
}
