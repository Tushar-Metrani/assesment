// All tunables in one place.
export const API_URL = "http://localhost:8000";
export const WS_URL = "ws://localhost:8000/ws/session";

// VAD: slightly favours clean sentences over speed.
export const VAD = {
  positiveSpeechThreshold: 0.5,
  negativeSpeechThreshold: 0.35,
  redemptionMs: 300,   // silence needed before a chunk is closed
  preSpeechPadMs: 300, // audio kept from before speech started
  minSpeechMs: 50,    // drop coughs / clicks shorter than this
};

// Chunk cap for long, uninterrupted speech.
export const CHUNK = {
  softMs: 4000, // after this, flush at the next small dip in speech probability
  hardMs: 8000, // flush no matter what
};

// Model + WASM files are loaded from a CDN (versions must match package.json).
export const VAD_ASSETS = {
  baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.31/dist/",
  onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
};