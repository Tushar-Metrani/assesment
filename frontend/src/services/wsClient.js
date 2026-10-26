// Plain JS WebSocket client. No React in here; it pushes into the store.
import { WS_URL } from "../config";
import { useSessionStore } from "../store/sessionStore";

let socket = null;
let drainResolvers = [];

const store = () => useSessionStore.getState();

export function connect() {
  if (socket && socket.readyState <= WebSocket.OPEN) return Promise.resolve();

  store().setConnection("connecting");
  return new Promise((resolve, reject) => {
    socket = new WebSocket(WS_URL);

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case "session.ready":
          store().setConnection("connected");
          resolve();
          break;
        case "transcript.segment":
          store().applySegmentResult(msg.segment_id, {
            text: msg.text,
            rawText: msg.text,
            status: msg.status,
            lowConfidence: msg.low_confidence,
          });
          break;
        case "segment.error":
          store().applySegmentResult(msg.segment_id, { status: "error" });
          store().setError(`Transcription failed: ${msg.message}`);
          break;
        case "session.drained":
          drainResolvers.forEach((r) => r());
          drainResolvers = [];
          break;
        case "error":
          store().setError(msg.message);
          break;
      }
    };

    socket.onerror = () => {
      store().setError("Cannot reach the server.");
      reject(new Error("socket error"));
    };

    socket.onclose = () => {
      store().setConnection("disconnected");
      socket = null;
    };
  });
}

function sendJson(obj) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(obj));
}

// Float32 [-1,1] @16kHz -> int16 PCM bytes
function toPcm16(float32) {
  const pcm = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const v = Math.max(-1, Math.min(1, float32[i]));
    pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  return pcm.buffer;
}

export function sendSegment(float32Audio) {
  const { id, seq } = store().addPendingSegment();
  sendJson({
    type: "segment.meta",
    segment_id: id,
    seq,
    duration_ms: Math.round((float32Audio.length / 16000) * 1000),
  });
  socket?.send(toPcm16(float32Audio));
}

// Resolves once the server has finished every queued segment.
export function endSession() {
  return new Promise((resolve) => {
    drainResolvers.push(resolve);
    sendJson({ type: "session.end" });
  });
}

export function resetContext() {
  sendJson({ type: "context.reset" });
}

export function disconnect() {
  socket?.close();
}
