"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VirtualTryOnModalProps = {
  isOpen: boolean;
  productId: string;
  variantSku: string;
  productName: string;
  onClose: () => void;
};

type GenerateTryOnResponse = {
  imageBase64: string;
  mimeType: string;
  message?: string;
};

type TryOnStatus =
  | "idle"
  | "starting-camera"
  | "loading-detector"
  | "detecting"
  | "capturing"
  | "generating"
  | "result"
  | "error";

type FaceValidation = {
  isValid: boolean;
  message: string;
};

type FaceLandmarks = Awaited<ReturnType<FaceLandmarker["detectForVideo"]>>["faceLandmarks"][number];

type SourceCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const CAPTURE_MIME_TYPE = "image/jpeg";
const CAPTURE_QUALITY = 0.82;
const MAX_CAPTURE_WIDTH = 768;
const HOLD_TO_CAPTURE_MS = 1200;
const CAPTURE_ASPECT_RATIO = 4 / 5;
const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const FACE_LANDMARKER_MODEL_URL = "/models/face_landmarker.task";

function stopStream(stream: MediaStream | null) {
  if (stream === null) {
    return;
  }

  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

function hasCancelled(cancellation: { current: boolean }) {
  return cancellation.current === true;
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return "Could not generate virtual try-on.";
}

async function readApiError(response: Response): Promise<string> {
  const fallbackMessage =
    response.statusText.trim() !== ""
      ? `Could not generate virtual try-on. (${response.status} ${response.statusText})`
      : `Could not generate virtual try-on. (${response.status})`;

  try {
    const responseText = await response.text();

    if (responseText.trim() === "") {
      return fallbackMessage;
    }

    const data = JSON.parse(responseText);
    const message = data?.error?.message ?? data?.message;

    if (typeof message === "string" && message.trim() !== "") {
      return message;
    }

    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function createFaceLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);

  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: FACE_LANDMARKER_MODEL_URL,
      delegate: "GPU",
    },
    numFaces: 1,
    runningMode: "VIDEO",
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function calculateFaceCrop(
  landmarks: FaceLandmarks | null,
  sourceWidth: number,
  sourceHeight: number,
): SourceCrop {
  if (landmarks === null || landmarks.length === 0) {
    return {
      x: 0,
      y: 0,
      width: sourceWidth,
      height: sourceHeight,
    };
  }

  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;

  landmarks.forEach((landmark) => {
    minX = Math.min(minX, landmark.x);
    minY = Math.min(minY, landmark.y);
    maxX = Math.max(maxX, landmark.x);
    maxY = Math.max(maxY, landmark.y);
  });

  const faceWidth = Math.max((maxX - minX) * sourceWidth, 1);
  const faceHeight = Math.max((maxY - minY) * sourceHeight, 1);
  const centerX = ((minX + maxX) / 2) * sourceWidth;
  const centerY = ((minY + maxY) / 2) * sourceHeight;
  let cropWidth = faceWidth * 2.25;
  let cropHeight = faceHeight * 2.05;

  if (cropWidth / cropHeight > CAPTURE_ASPECT_RATIO) {
    cropHeight = cropWidth / CAPTURE_ASPECT_RATIO;
  } else {
    cropWidth = cropHeight * CAPTURE_ASPECT_RATIO;
  }

  cropWidth = Math.min(cropWidth, sourceWidth);
  cropHeight = Math.min(cropHeight, sourceHeight);

  const cropX = clamp(centerX - cropWidth / 2, 0, sourceWidth - cropWidth);
  const cropY = clamp(centerY - cropHeight * 0.48, 0, sourceHeight - cropHeight);

  return {
    x: cropX,
    y: cropY,
    width: cropWidth,
    height: cropHeight,
  };
}

function captureVideoFrame(
  video: HTMLVideoElement,
  landmarks: FaceLandmarks | null,
): Promise<Blob> {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;

  if (sourceWidth === 0 || sourceHeight === 0) {
    throw new Error("Camera is not ready yet.");
  }

  const crop = calculateFaceCrop(landmarks, sourceWidth, sourceHeight);
  const scale = Math.min(1, MAX_CAPTURE_WIDTH / crop.width);
  const width = Math.round(crop.width * scale);
  const height = Math.round(crop.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (context === null) {
    throw new Error("Could not capture camera frame.");
  }

  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(
    video,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    width,
    height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob === null) {
          reject(new Error("Could not prepare camera frame."));
          return;
        }

        resolve(blob);
      },
      CAPTURE_MIME_TYPE,
      CAPTURE_QUALITY,
    );
  });
}

async function generateTryOn(
  productId: string,
  variantSku: string,
  faceImage: Blob,
): Promise<GenerateTryOnResponse> {
  const formData = new FormData();
  formData.append("productId", productId);
  formData.append("variantSku", variantSku);
  formData.append("faceImage", faceImage, "try-on-face.jpg");

  const response = await fetch("/api/try-on/generate", {
    method: "POST",
    body: formData,
  });

  if (response.ok === false) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as GenerateTryOnResponse;
}

function playShutterSound() {
  const audioWindow = window as AudioWindow;
  const AudioContextClass =
    window.AudioContext ?? audioWindow.webkitAudioContext;

  if (AudioContextClass === undefined) {
    return;
  }

  const audioContext = new AudioContextClass();
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(720, now);
  oscillator.frequency.exponentialRampToValueAtTime(260, now + 0.08);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.17);
}

function validateFace(landmarks: FaceLandmarks | undefined): FaceValidation {
  if (landmarks === undefined) {
    return {
      isValid: false,
      message: "Move your full face into the frame",
    };
  }

  const leftOuterEye = landmarks[33];
  const rightOuterEye = landmarks[263];
  const leftInnerEye = landmarks[133];
  const rightInnerEye = landmarks[362];
  const noseTip = landmarks[1];
  const chin = landmarks[152];
  const forehead = landmarks[10];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];

  if (
    leftOuterEye === undefined ||
    rightOuterEye === undefined ||
    leftInnerEye === undefined ||
    rightInnerEye === undefined ||
    noseTip === undefined ||
    chin === undefined ||
    forehead === undefined ||
    leftCheek === undefined ||
    rightCheek === undefined
  ) {
    return {
      isValid: false,
      message: "Make both eyes visible",
    };
  }

  const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
  const faceHeight = Math.abs(chin.y - forehead.y);
  const centerX = (leftCheek.x + rightCheek.x) / 2;
  const centerY = (forehead.y + chin.y) / 2;
  const eyeTilt = Math.abs(leftOuterEye.y - rightOuterEye.y);
  const eyeDistance = Math.abs(rightOuterEye.x - leftOuterEye.x);
  const leftNoseDistance = Math.abs(noseTip.x - leftOuterEye.x);
  const rightNoseDistance = Math.abs(rightOuterEye.x - noseTip.x);
  const yawBalance =
    Math.abs(leftNoseDistance - rightNoseDistance) /
    Math.max(leftNoseDistance + rightNoseDistance, 0.001);

  if (faceWidth > 0.58 || faceHeight > 0.68) {
    return {
      isValid: false,
      message: "Move slightly back",
    };
  }

  if (faceWidth < 0.18 || faceHeight < 0.23) {
    return {
      isValid: false,
      message: "Move closer so your full face is clear",
    };
  }

  if (
    leftCheek.x < 0.08 ||
    rightCheek.x > 0.92 ||
    forehead.y < 0.04 ||
    chin.y > 0.96 ||
    Math.abs(centerX - 0.5) > 0.17 ||
    Math.abs(centerY - 0.5) > 0.18
  ) {
    return {
      isValid: false,
      message: "Move your full face into the frame",
    };
  }

  if (eyeDistance < 0.12 || eyeTilt > 0.05) {
    return {
      isValid: false,
      message: "Keep your head level",
    };
  }

  if (yawBalance > 0.3) {
    return {
      isValid: false,
      message: "Look straight at the camera",
    };
  }

  return {
    isValid: true,
    message: "Hold still",
  };
}

export function VirtualTryOnModal({
  isOpen,
  productId,
  variantSku,
  productName,
  onClose,
}: VirtualTryOnModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const captureStartedRef = useRef(false);
  const validSinceRef = useRef<number | null>(null);
  const lastValidLandmarksRef = useRef<FaceLandmarks | null>(null);
  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [guideMessage, setGuideMessage] = useState("Move your full face into the frame");
  const [holdProgress, setHoldProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [cameraRequestId, setCameraRequestId] = useState(0);

  useEffect(() => {
    if (isOpen === false) {
      return;
    }

    const cancellation: { current: boolean } = { current: false };

    const cleanup = () => {
      cancellation.current = true;

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      stopStream(streamRef.current);
      streamRef.current = null;

      if (faceLandmarkerRef.current !== null) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }

      lastVideoTimeRef.current = -1;
      captureStartedRef.current = false;
      validSinceRef.current = null;
      lastValidLandmarksRef.current = null;
    };

    const captureAndGenerate = async () => {
      const video = videoRef.current;

      if (video === null || captureStartedRef.current === true) {
        return;
      }

      if (variantSku.trim() === "") {
        setStatus("error");
        setErrorMessage("Product variant is unavailable for try-on.");
        return;
      }

      captureStartedRef.current = true;
      setStatus("capturing");
      setErrorMessage(null);
      setIsFlashing(true);
      playShutterSound();

      window.setTimeout(() => {
        setIsFlashing(false);
      }, 220);

      try {
        const faceImage = await captureVideoFrame(video, lastValidLandmarksRef.current);

        if (hasCancelled(cancellation)) {
          return;
        }

        setStatus("generating");
        setGuideMessage("Creating User Tryon Image");
        stopStream(streamRef.current);
        streamRef.current = null;

        const response = await generateTryOn(productId, variantSku, faceImage);
        const imageSrc = `data:${response.mimeType};base64,${response.imageBase64}`;

        if (hasCancelled(cancellation)) {
          return;
        }

        setResultImage(imageSrc);
        setStatus("result");
      } catch (error) {
        if (hasCancelled(cancellation)) {
          return;
        }

        setStatus("error");
        setErrorMessage(readErrorMessage(error));
        captureStartedRef.current = false;
      }
    };

    const renderDetectionFrame = () => {
      const video = videoRef.current;
      const faceLandmarker = faceLandmarkerRef.current;

      if (
        video === null ||
        faceLandmarker === null ||
        hasCancelled(cancellation) ||
        captureStartedRef.current === true
      ) {
        return;
      }

      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const result = faceLandmarker.detectForVideo(video, performance.now());
        const validation = validateFace(result.faceLandmarks[0]);
        const now = performance.now();

        setGuideMessage(validation.message);

        if (validation.isValid === true) {
          lastValidLandmarksRef.current = result.faceLandmarks[0] ?? null;

          if (validSinceRef.current === null) {
            validSinceRef.current = now;
          }

          const elapsed = now - validSinceRef.current;
          const nextProgress = Math.min(1, elapsed / HOLD_TO_CAPTURE_MS);
          setHoldProgress(nextProgress);

          if (elapsed >= HOLD_TO_CAPTURE_MS) {
            void captureAndGenerate();
            return;
          }
        } else {
          validSinceRef.current = null;
          lastValidLandmarksRef.current = null;
          setHoldProgress(0);
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(renderDetectionFrame);
    };

    const startTryOn = async () => {
      const video = videoRef.current;

      if (video === null) {
        setStatus("error");
        setErrorMessage("Virtual try-on camera is unavailable.");
        return;
      }

      setStatus("starting-camera");
      setErrorMessage(null);
      setResultImage(null);
      setHoldProgress(0);
      setGuideMessage("Move your full face into the frame");
      captureStartedRef.current = false;
      validSinceRef.current = null;
      lastValidLandmarksRef.current = null;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (hasCancelled(cancellation)) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();

        if (hasCancelled(cancellation)) {
          stopStream(stream);
          streamRef.current = null;
          return;
        }

        setStatus("loading-detector");
        const faceLandmarker = await createFaceLandmarker();

        if (hasCancelled(cancellation)) {
          faceLandmarker.close();
          return;
        }

        faceLandmarkerRef.current = faceLandmarker;
        setStatus("detecting");
        animationFrameRef.current = window.requestAnimationFrame(renderDetectionFrame);
      } catch (error) {
        cleanup();
        setStatus("error");
        setErrorMessage(
          error instanceof Error && error.message.includes("Failed to fetch")
            ? "Face detection is unavailable. Please try again later."
            : readErrorMessage(error),
        );
      }
    };

    void startTryOn();

    return cleanup;
  }, [cameraRequestId, isOpen, productId, variantSku]);

  const handleRetry = () => {
    setResultImage(null);
    setErrorMessage(null);
    setHoldProgress(0);
    setGuideMessage("Move your full face into the frame");
    setCameraRequestId((current) => current + 1);
  };

  if (isOpen === false) {
    return null;
  }

  const isGenerating = status === "generating" || status === "capturing";

  return (
    <div className="fixed inset-0 z-50 bg-black/72 px-4 py-5 backdrop-blur-sm md:px-8 md:py-8">
      <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden bg-[#f0f0f0] text-black shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 md:px-6">
          <div>
            <p className="font-afacad text-[11px] uppercase tracking-[0.24em] text-black/45">
              AI virtual try-on
            </p>
            <h2 className="font-seesans text-[18px] uppercase tracking-[-0.04em]">
              {productName}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-none hover:bg-black/5"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="relative min-h-0 flex-1 bg-black">
          {resultImage !== null ? (
            <Image
              src={resultImage}
              alt={`${productName} virtual try-on result`}
              fill
              unoptimized
              className="object-contain"
            />
          ) : isGenerating ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-[#111] px-6 text-center text-white">
              <div className="size-16 animate-spin rounded-full border border-white/20 border-t-white" />
              <div className="space-y-2">
                <p className="font-seesans text-2xl uppercase tracking-[-0.04em]">
                  Creating User Tryon Image
                </p>
                <p className="font-afacad text-sm uppercase tracking-[0.2em] text-white/55">
                  Please keep this window open
                </p>
              </div>
              <div className="h-1 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/2 animate-[tryon-progress_1.15s_ease-in-out_infinite] rounded-full bg-white" />
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-full w-full scale-x-[-1] object-contain"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className={cn(
                    "h-[58%] max-h-[28rem] w-[58%] max-w-[22rem] rounded-[48%] border shadow-[0_0_0_9999px_rgba(0,0,0,0.16)] transition-colors",
                    holdProgress > 0
                      ? "border-emerald-300/90"
                      : "border-white/70",
                  )}
                />
              </div>
            </>
          )}

          {status === "error" ? (
            <div className="absolute left-1/2 top-5 max-w-[calc(100%-2rem)] -translate-x-1/2 bg-white/92 px-4 py-3 text-center font-afacad text-sm text-red-700 shadow-lg">
              {errorMessage ?? "Virtual try-on is unavailable."}
            </div>
          ) : null}

          {status !== "error" && status !== "result" && isGenerating === false ? (
            <div className="absolute left-1/2 top-5 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 bg-white/92 px-4 py-3 text-center shadow-lg">
              <p className="font-afacad text-sm text-black/70">{guideMessage}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full bg-black transition-[width] duration-150"
                  style={{ width: `${Math.round(holdProgress * 100)}%` }}
                />
              </div>
            </div>
          ) : null}

          <div
            className={cn(
              "pointer-events-none absolute inset-0 bg-white opacity-0 transition-opacity duration-200",
              isFlashing ? "opacity-90" : "opacity-0",
            )}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-black/10 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
          <p className="font-afacad text-[12px] uppercase tracking-[0.18em] text-black/45">
            Look at the camera. Capture starts automatically when your full face
            is ready.
          </p>
          <div className="flex gap-3">
            {resultImage !== null || status === "error" ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-none border-black/20 bg-transparent"
                onClick={handleRetry}
              >
                <RefreshCw className="mr-2 size-4" />
                Retry
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="rounded-none border-black/20 bg-transparent"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes tryon-progress {
          0% {
            transform: translateX(-110%);
          }
          50% {
            transform: translateX(60%);
          }
          100% {
            transform: translateX(220%);
          }
        }
      `}</style>
    </div>
  );
}
