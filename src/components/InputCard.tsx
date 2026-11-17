import { useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent, type KeyboardEvent } from 'react';
import { ArrowRight, Camera, ImagePlus, Trash2 } from 'lucide-react';
import { optimizeImageFile } from '../utils/imageOptimizer.ts';

interface InputCardProps {
  description: string;
  imagePreviewUrl: string | null;
  imageName: string | null;
  errorMessage: string | null;
  onDescriptionChange: (value: string) => void;
  onImageSelected: (dataUrl: string, fileName: string) => void;
  onImageRemoved: () => void;
  onSubmit: () => void;
}

const EXAMPLE_PROMPTS = [
  'iPhone 13 Pro 128GB usato in ottime condizioni',
  'Bici da corsa Bianchi Via Nirone 7 taglia 54',
  'Consulenza SEO tecnica per e-commerce',
];

export function InputCard({
  description,
  imagePreviewUrl,
  imageName,
  errorMessage,
  onDescriptionChange,
  onImageSelected,
  onImageRemoved,
  onSubmit,
}: InputCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const handleFile = async (file: File) => {
    setLocalError(null);
    setIsProcessingImage(true);
    try {
      const optimizedDataUrl = await optimizeImageFile(file);
      onImageSelected(optimizedDataUrl, file.name || 'foto-caricata.jpg');
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Errore nel caricamento della foto.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          void handleFile(file);
          return;
        }
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const visibleError = localError || errorMessage;

  return (
    <section
      aria-label="Inserisci foto o descrizione"
      className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 sm:p-8"
    >
      <input
        ref={fileInputRef}
        id="photo-upload-input"
        type="file"
        accept="image/*"
        aria-label="Carica foto da dispositivo"
        onChange={handleFileInputChange}
        className="sr-only"
      />
      <input
        ref={cameraInputRef}
        id="camera-upload-input"
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Scatta foto con fotocamera"
        onChange={handleFileInputChange}
        className="sr-only"
      />

      {!imagePreviewUrl ? (
        <div className="space-y-3">
          <label
            htmlFor="photo-upload-input"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex min-h-[184px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors duration-150 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0F172A] ${
              isDragging
                ? 'border-[#0F172A] bg-white'
                : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8]'
            }`}
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]">
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-[#0F172A]">
              {isProcessingImage
                ? 'Ottimizzazione immagine in corso...'
                : 'Trascina una foto qui o clicca per selezionarla'}
            </p>
            <p className="mt-1 text-xs text-[#64748B]">
              Scansione visiva automatica di modello, marca e stato d’uso · JPG, PNG, WebP o incolla (Ctrl+V)
            </p>
          </label>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-medium text-[#334155] transition-colors hover:border-[#CBD5E1] hover:text-[#0F172A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A] whitespace-nowrap shrink-0"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              Scatta con fotocamera
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          <div className="relative flex max-h-64 items-center justify-center bg-[#F8FAFC] p-3">
            <img
              src={imagePreviewUrl}
              alt={imageName ? `Anteprima di ${imageName}` : 'Anteprima articolo da vendere'}
              referrerPolicy="no-referrer"
              className="max-h-56 w-auto rounded-lg object-contain"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] px-4 py-3">
            <span className="truncate text-xs font-medium text-[#475569] max-w-[260px]">
              {imageName || 'Immagine caricata'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[36px] items-center rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A] whitespace-nowrap shrink-0"
              >
                Cambia foto
              </button>
              <button
                type="button"
                onClick={onImageRemoved}
                aria-label="Rimuovi immagine"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#DC2626] transition-colors hover:bg-[#FEF2F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DC2626] whitespace-nowrap shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Rimuovi
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5">
        <label
          htmlFor="item-description"
          className="block text-sm font-medium text-[#0F172A]"
        >
          Descrizione dell’oggetto o servizio
        </label>
        <textarea
          id="item-description"
          rows={2}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Es. iPhone 13 Pro 128GB usato in ottime condizioni, batteria 89%, con scatola originale..."
          className="mt-2 w-full resize-none rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[15px] leading-relaxed text-[#0F172A] placeholder:text-[#94A3B8] transition-colors focus:border-[#0F172A] focus:outline-none"
        />

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#64748B]">
          <span>Esempi rapidi:</span>
          {EXAMPLE_PROMPTS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => onDescriptionChange(sample)}
              className="text-left text-[#475569] underline decoration-[#CBD5E1] underline-offset-4 transition-colors hover:text-[#0F172A] hover:decoration-[#0F172A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {visibleError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
        >
          {visibleError}
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isProcessingImage}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#1E293B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
        >
          <span>Analizza e Calcola Prezzo</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
