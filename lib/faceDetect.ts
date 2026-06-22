// Lightweight, in-browser face-presence check for the identity selfie.
// Uses MediaPipe's BlazeFace (short-range) model via @mediapipe/tasks-vision.
// The WASM runtime and model are loaded lazily from a CDN on first use, so they
// add nothing to the initial bundle and only download when a respondent reaches
// the selfie step.

import type { FaceDetector } from "@mediapipe/tasks-vision";

// Pin the CDN WASM version to the installed package version to avoid mismatches.
const TASKS_VERSION = "0.10.35";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

let detectorPromise: Promise<FaceDetector> | null = null;

// MediaPipe's WASM runtime and the bundled TensorFlow Lite print harmless
// startup notices (XNNPACK delegate, GL context, feedback manager) through
// console.error/info. In Next.js dev these surface as a "Console Error" overlay.
// Drop only these known-benign lines; real errors don't match the patterns.
type LogFn = (...args: unknown[]) => void;
let logFilterInstalled = false;
function installBenignLogFilter() {
  if (logFilterInstalled || typeof window === "undefined") return;
  logFilterInstalled = true;
  const BENIGN = [
    /XNNPACK/i,
    /TensorFlow Lite/i,
    /Feedback manager/i,
    /OpenGL error checking/i,
    /gl_context/i,
    /inference_feedback_manager/i,
    /Graph successfully started running/i,
    /GL version/i,
    /^INFO:/,
    /^[WIE]\d{4}\s/, // glog prefixes like "W0620 10:48:55 ..."
  ];
  const isBenign = (args: unknown[]) =>
    typeof args[0] === "string" && BENIGN.some((re) => re.test(args[0] as string));
  const wrap = (original: LogFn): LogFn => (...args) => {
    if (isBenign(args)) return;
    original(...args);
  };
  console.error = wrap(console.error.bind(console) as LogFn) as typeof console.error;
  console.warn = wrap(console.warn.bind(console) as LogFn) as typeof console.warn;
  console.info = wrap(console.info.bind(console) as LogFn) as typeof console.info;
  console.log = wrap(console.log.bind(console) as LogFn) as typeof console.log;
}

async function getDetector(): Promise<FaceDetector> {
  if (!detectorPromise) {
    installBenignLogFilter();
    detectorPromise = (async () => {
      const { FilesetResolver, FaceDetector } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      return FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: "IMAGE",
        minDetectionConfidence: 0.80,
      });
    })();
  }
  return detectorPromise;
}

// BlazeFace returns 6 normalised key points in this order:
//   0 right eye · 1 left eye · 2 nose tip · 3 mouth centre
//   4 right ear · 5 left ear
// A real, unobstructed face satisfies all these geometric constraints:
//   – eyes are at roughly the same height (Δy < 6 % of image height)
//   – nose tip is below both eyes
//   – mouth centre is below nose tip
//   – eye-to-mouth span is meaningfully larger than eye-to-nose span
//     (if a hand covers the mouth the model may place the "mouth" keypoint
//      near the nose, collapsing the ratio)
// Falls back to true when key points are unavailable so we don't over-reject.
function hasValidFaceGeometry(kps: Array<{ x: number; y: number }>): boolean {
  if (kps.length < 4) return true;
  const [rEye, lEye, nose, mouth] = kps;
  if (Math.abs(rEye.y - lEye.y) > 0.06) return false;           // eyes unaligned
  const eyeAvgY = (rEye.y + lEye.y) / 2;
  if (nose.y <= eyeAvgY) return false;                            // nose above eyes
  if (mouth.y <= nose.y) return false;                            // mouth above nose
  const eyeToNose = nose.y - eyeAvgY;
  const eyeToMouth = mouth.y - eyeAvgY;
  if (eyeToMouth < eyeToNose * 1.4) return false;                // mouth too close to nose
  return true;
}

function countValidFaces(detections: Array<{ keypoints?: Array<{ x: number; y: number }> }>): number {
  return detections.filter((d) => hasValidFaceGeometry(d.keypoints ?? [])).length;
}

// Returns the number of faces in a live video frame (for camera preview loop).
// Uses createImageBitmap on the video element — works on Chrome/Firefox/Safari.
export async function detectFaceInFrame(video: HTMLVideoElement): Promise<number> {
  if (video.readyState < 2 || video.videoWidth === 0) return -1;
  let detector;
  try {
    detector = await getDetector();
  } catch {
    return -1;
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(video);
  } catch {
    return -1;
  }
  try {
    return countValidFaces(detector.detect(bitmap).detections);
  } catch {
    return -1;
  } finally {
    bitmap.close();
  }
}

// Returns the number of faces detected in the image file.
//  - >= 1 : that many faces found
//  -   0  : a valid image with no face, OR an image that couldn't be decoded
//           (a corrupt/unreadable file is not a usable selfie, so we reject it)
//  -  -1  : the detector itself couldn't load (model/CDN down) — callers can
//           fail open so an infrastructure outage never blocks a respondent.
export async function detectFaceCount(file: File): Promise<number> {
  let detector;
  try {
    detector = await getDetector();
  } catch (err) {
    console.warn("Face detector unavailable (model/CDN):", err);
    return -1;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (err) {
    console.warn("Selfie image could not be decoded:", err);
    return 0;
  }

  try {
    return countValidFaces(detector.detect(bitmap).detections);
  } catch (err) {
    console.warn("Face detection failed:", err);
    return -1;
  } finally {
    bitmap.close();
  }
}
