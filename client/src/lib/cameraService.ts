export type CameraIssue = "unsupported" | "denied" | "unavailable";

export class CameraAccessError extends Error {
  issue: CameraIssue;

  constructor(issue: CameraIssue, message: string) {
    super(message);
    this.issue = issue;
  }
}

type CameraMediaDevices = Pick<MediaDevices, "getUserMedia">;

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
