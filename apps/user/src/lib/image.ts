// Client-only image helpers. Used to shrink an uploaded receipt before storing
// it (as a data URL) on the order document, so Mongo docs stay small.

/** Load a File into an HTMLImageElement via an object URL (revoked after use). */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không đọc được ảnh"));
    };
    img.src = url;
  });
}

/**
 * Compress an image File to a JPEG data URL. The longest side is clamped to
 * `maxDim` (keeping aspect ratio) and encoded at `quality` (0–1). Returns the
 * `data:image/jpeg;base64,...` string.
 */
export async function compressToDataUrl(
  file: File,
  maxDim = 1000,
  quality = 0.7,
): Promise<string> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không xử lý được ảnh");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
