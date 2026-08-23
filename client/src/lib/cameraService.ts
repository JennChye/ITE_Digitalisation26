export type CameraIssue = "unsupported" | "denied" | "unavailable";

export class CameraAccessError extends Error {
  issue: CameraIssue;

  constructor(issue: CameraIssue, message: string) {
    super(message);
    this.issue = issue;
  }
}

type CameraMediaDevices = Pick<MediaDevices, "getUserMedia">;

export const MAX_MEAL_UPLOAD_SOURCE_BYTES = 12_000_000;
const SUPPORTED_MEAL_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_ANALYSIS_IMAGE_SIDE = 1280;

export type PreparedMealPhoto = {
  photoUrl: string;
  imageDataUrl: string;
};

export function cameraIsSupported(mediaDevices?: CameraMediaDevices | null): boolean {
  const target = mediaDevices ?? (typeof navigator === "undefined" ? null : navigator.mediaDevices);
  return Boolean(target?.getUserMedia);
}

export async function requestCameraPreview(mediaDevices?: CameraMediaDevices | null): Promise<MediaStream> {
  const target = mediaDevices ?? (typeof navigator === "undefined" ? null : navigator.mediaDevices);
  if (!target?.getUserMedia) {
    throw new CameraAccessError("unsupported", "Camera access is not supported in this browser. You can upload a photo or enter the meal manually.");
  }

  try {
    return await target.getUserMedia({ video: { facingMode: "environment" }, audio: false });
  } catch (error) {
    if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError")) {
      throw new CameraAccessError("denied", "Camera permission was not allowed. You can upload a photo or enter the meal manually.");
    }
    throw new CameraAccessError("unavailable", "We could not start the camera. Please upload a photo or enter the meal manually.");
  }
}

export function stopCameraPreview(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export function deleteTemporaryPhoto(photoUrl: string | null): void {
  if (photoUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(photoUrl);
  }
}

export function getMealPhotoFileError(file: Pick<File, "type" | "size">): string | null {
  if (!SUPPORTED_MEAL_IMAGE_TYPES.includes(file.type.toLocaleLowerCase())) {
    return "Please use a JPG, PNG, or WebP photo of your meal.";
  }
  if (file.size > MAX_MEAL_UPLOAD_SOURCE_BYTES) {
    return "Please choose a photo below 12 MB so it can be prepared safely.";
  }
  return null;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be prepared."));
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The image could not be prepared.")), "image/jpeg", 0.84);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The image could not be prepared."));
    reader.onerror = () => reject(new Error("The image could not be prepared."));
    reader.readAsDataURL(blob);
  });
}

export async function prepareMealPhoto(file: Blob): Promise<PreparedMealPhoto> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(sourceUrl);
    const scale = Math.min(1, MAX_ANALYSIS_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The image could not be prepared.");
    context.drawImage(image, 0, 0, width, height);
    const preparedBlob = await canvasToBlob(canvas);
    const imageDataUrl = await blobToDataUrl(preparedBlob);
    return { photoUrl: URL.createObjectURL(preparedBlob), imageDataUrl };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
