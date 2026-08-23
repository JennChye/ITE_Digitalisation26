import { CameraAccessError, cameraIsSupported, deleteTemporaryPhoto, requestCameraPreview } from "./cameraService";
import { describe, expect, it, vi } from "vitest";

describe("camera service", () => {
  it("requests camera permission only when the camera request function is called", async () => {
    const getUserMedia = vi.fn().mockResolvedValue({ id: "stream" });
    const mediaDevices = { getUserMedia } as unknown as MediaDevices;

    expect(getUserMedia).not.toHaveBeenCalled();
    await requestCameraPreview(mediaDevices);
    expect(getUserMedia).toHaveBeenCalledOnce();
  });

  it("reports denied camera access while keeping another entry path possible", async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
    const mediaDevices = { getUserMedia } as unknown as MediaDevices;

    await expect(requestCameraPreview(mediaDevices)).rejects.toMatchObject<Partial<CameraAccessError>>({ issue: "denied" });
  });

  it("handles unsupported camera browsers safely", async () => {
    expect(cameraIsSupported(null)).toBe(false);
    await expect(requestCameraPreview(null)).rejects.toMatchObject<Partial<CameraAccessError>>({ issue: "unsupported" });
  });

  it("releases a temporary photo when it is deleted", () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    deleteTemporaryPhoto("blob:temporary-photo");

    expect(revoke).toHaveBeenCalledWith("blob:temporary-photo");
    revoke.mockRestore();
  });
});
