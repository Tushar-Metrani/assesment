
import { MicVAD } from "@ricky0123/vad-web";
import { VAD, VAD_ASSETS, CHUNK } from "../config";
import { useSessionStore } from "../store/sessionStore";

let vad = null;

const SAMPLES_PER_MS = 16; // 16 kHz

function concat(chunks) {
  const out = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

export async function startCapture(onSegment) {
  const { setMic } = useSessionStore.getState();

  if (!vad) {
    let frames = []; // our own copy of the current utterance
    let samples = 0;
    let speaking = false;
    let flushedEarly = false;

    const reset = () => {
      frames = [];
      samples = 0;
    };

    vad = await MicVAD.new({
      model: "v5",
      ...VAD,
      ...VAD_ASSETS,

      onSpeechStart: () => {
        speaking = true;
        flushedEarly = false;
        reset();
        setMic("speaking");
      },

      // Runs for every ~32 ms frame.
      onFrameProcessed: (probs, frame) => {
        if (!speaking) return;
        frames.push(frame.slice()); // copy: the VAD may reuse its buffer
        samples += frame.length;

        const ms = samples / SAMPLES_PER_MS;
        const atDip = probs.isSpeech < 0.6;
        if (ms >= CHUNK.hardMs || (ms >= CHUNK.softMs && atDip)) {
          onSegment(concat(frames));
          reset();
          flushedEarly = true;
        }
      },

      onSpeechEnd: (audio) => {
        speaking = false;
        setMic("listening");
        // Never flushed early: use the VAD's audio (includes pre-speech padding).
        // Flushed early: VAD's audio is the whole utterance, so send only our remainder.
        const tail = flushedEarly ? concat(frames) : audio;
        reset();
        flushedEarly = false;
        if (tail.length) onSegment(tail);
      },

      onVADMisfire: () => {
        speaking = false;
        reset();
        setMic("listening");
      },
    });
  }
  await vad.start();
  setMic("listening");
}

export async function stopCapture() {
  await vad?.pause(); // pending speech is flushed via onSpeechEnd
  useSessionStore.getState().setMic("idle");
}