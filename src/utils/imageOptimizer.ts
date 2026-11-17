const MAX_EDGE_PX = 1280;
const THUMB_MAX_EDGE_PX = 200;
const TARGET_MIME = 'image/jpeg';
const JPEG_QUALITY = 0.86;
const THUMB_JPEG_QUALITY = 0.72;

export async function optimizeImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Seleziona un file immagine valido (JPG, PNG o WebP).');
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  return resizeDataUrl(rawDataUrl, MAX_EDGE_PX, JPEG_QUALITY);
}

export async function createThumbnailDataUrl(dataUrl: string | null): Promise<string | null> {
  if (!dataUrl) {
    return null;
  }
  return resizeDataUrl(dataUrl, THUMB_MAX_EDGE_PX, THUMB_JPEG_QUALITY);
}

async function resizeDataUrl(
  dataUrl: string,
  maxEdge: number,
  quality: number,
): Promise<string> {
  if (typeof document === 'undefined') {
    return dataUrl;
  }

  try {
    const img = await loadImage(dataUrl);
    const { width, height } = img;
    if (!width || !height) {
      return dataUrl;
    }

    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return dataUrl;
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return canvas.toDataURL(TARGET_MIME, quality);
  } catch {
    return dataUrl;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Impossibile leggere il file selezionato.'));
      }
    };
    reader.onerror = () => reject(new Error('Errore durante la lettura dell’immagine.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Impossibile decodificare l’immagine.'));
    img.src = src;
  });
}
