import { calculateTryOnOverlay } from "./overlay";
import type { TryOnGlasses, TryOnModelFace } from "./types";

const CAPTURE_BACKGROUND = "#e8e8e6";
const CAPTURE_IMAGE_TYPE = "image/png";

function buildAbsoluteAssetUrl(assetUrl: string): string {
  if (
    assetUrl.startsWith("http://") === true ||
    assetUrl.startsWith("https://") === true ||
    assetUrl.startsWith("data:") === true ||
    assetUrl.startsWith("blob:") === true
  ) {
    return assetUrl;
  }

  return new URL(assetUrl, window.location.origin).toString();
}

function sanitizeFilenamePart(value: string): string {
  const normalized = value.trim().toLowerCase();
  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug === "" ? "try-on" : slug;
}

function buildCaptureFilename(
  modelFace: TryOnModelFace,
  glasses: TryOnGlasses,
): string {
  return `season-try-on-${sanitizeFilenamePart(modelFace.id)}-${sanitizeFilenamePart(glasses.id)}.png`;
}

function loadImage(assetUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject(new Error(`Could not load image: ${assetUrl}`));
    };
    image.src = buildAbsoluteAssetUrl(assetUrl);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob === null) {
        reject(new Error("Could not export try-on image."));
        return;
      }

      resolve(blob);
    }, CAPTURE_IMAGE_TYPE);
  });
}

export async function createTryOnCaptureBlob(
  modelFace: TryOnModelFace,
  glasses: TryOnGlasses,
): Promise<Blob> {
  const overlay = calculateTryOnOverlay(modelFace, glasses, {
    width: modelFace.imageWidth,
    height: modelFace.imageHeight,
  });

  if (overlay === null) {
    throw new Error("Try-on overlay is not ready.");
  }

  const [modelImage, glassesImage] = await Promise.all([
    loadImage(modelFace.imageUrl),
    loadImage(glasses.imageUrl),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = modelFace.imageWidth;
  canvas.height = modelFace.imageHeight;

  const context = canvas.getContext("2d");

  if (context === null) {
    throw new Error("Canvas is not available in this browser.");
  }

  context.fillStyle = CAPTURE_BACKGROUND;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(modelImage, 0, 0, modelFace.imageWidth, modelFace.imageHeight);

  context.save();
  context.translate(overlay.left + overlay.width / 2, overlay.top + overlay.height / 2);
  context.rotate(overlay.angle);
  context.drawImage(
    glassesImage,
    -overlay.width / 2,
    -overlay.height / 2,
    overlay.width,
    overlay.height,
  );
  context.restore();

  return canvasToBlob(canvas);
}

export async function downloadTryOnCapture(
  modelFace: TryOnModelFace,
  glasses: TryOnGlasses,
): Promise<string> {
  const blob = await createTryOnCaptureBlob(modelFace, glasses);
  const filename = buildCaptureFilename(modelFace, glasses);
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 1000);

  return filename;
}
