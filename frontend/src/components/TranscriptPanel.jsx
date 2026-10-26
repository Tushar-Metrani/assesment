import { useSessionStore, selectTranscript } from "../store/sessionStore";
import * as ws from "../services/wsClient";
import { startCapture, stopCapture } from "../services/audioCapture";
import { summarize } from "../services/api";

export default function TranscriptPanel() {
  const store = useSessionStore();
  const { segments, mic, connection, error, editedText, summaryStatus } = store;
  const transcript = useSessionStore(selectTranscript);

  const pending = segments.filter((s) => s.status === "pending").length;
  const words = transcript.split(/\s+/).filter(Boolean).length;
  const recording = mic !== "idle";
  const canEdit = !recording && pending === 0 && segments.length > 0;
  const canProcess = !recording && pending === 0 && transcript.trim() && summaryStatus !== "loading";

  async function handleStart() {
    store.setError(null);
    try {
      await ws.connect();
      await startCapture(ws.sendSegment);
    } catch (e) {
      if (!useSessionStore.getState().error) {
        store.setError(e?.name === "NotAllowedError" ? "Microphone permission denied." : String(e.message || e));
      }
    }
  }

  async function handleStop() {
    await stopCapture();
    await ws.endSession(); // wait for the last chunk
  }

  function handleClear() {
    store.clear();
    ws.resetContext();
  }

  async function handleProcess() {
    store.setSummaryLoading();
    try {
      store.setSummary(await summarize(transcript));
    } catch (e) {
      store.setSummaryError(e.message);
    }
  }

  return (
    <section className="panel">
      <h2>Live Medical Transcription</h2>

      <div className="controls">
        <button className="btn primary" onClick={handleStart} disabled={recording}>Start Mic</button>
        <button className="btn danger" onClick={handleStop} disabled={!recording}>Stop</button>
        <button className="btn" onClick={handleClear} disabled={recording}>Clear</button>
      </div>

      <div className="chips">
        <span className="chip">WORDS: {words}</span>
        <span className="chip">CHUNKS: {segments.length}</span>
        {pending > 0 && <span className="chip warn">PENDING: {pending}</span>}
        <span className="chip">{connection}</span>
      </div>

      <div className="status">
        {mic === "speaking" && "● Listening…"}
        {mic === "listening" && "Ready — speak naturally. Silence is not sent."}
        {mic === "idle" && (canEdit ? "Recording stopped. You can edit the transcript before processing." : "Click Start Mic to begin.")}
      </div>

      {canEdit ? (
        <textarea
          className="transcript editable"
          value={transcript}
          onChange={(e) => store.setEditedText(e.target.value)}
        />
      ) : (
        <div className="transcript">
          {segments.length === 0 && <span className="muted">Transcript will appear here…</span>}
          {editedText !== null && <span>{editedText} </span>}
          {segments.map((s) =>
            s.status === "pending" ? (
              <span key={s.id} className="muted"> transcribing… </span>
            ) : editedText !== null ? null : (
              <span key={s.id} className={s.lowConfidence ? "low" : ""}>{ !s.lowConfidence ? s.text : ""} </span>
            )
          )}
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <button className="btn primary wide" onClick={handleProcess} disabled={!canProcess}>
        {summaryStatus === "loading" ? "Processing…" : "Process Transcript with AI"}
      </button>
    </section>
  );
}