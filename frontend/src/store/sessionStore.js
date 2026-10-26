import { create } from "zustand";

const joinSegments = (segments) =>
  segments.map((s) => s.text.trim()).filter(Boolean).join(" ");

export const useSessionStore = create((set) => ({
  connection: "disconnected", // disconnected | connecting | connected
  mic: "idle",                // idle | listening | speaking
  segments: [],               // { id, seq, text, rawText, status, lowConfidence }
  seq: 0,
  editedText: null,           // doctor's edited transcript (null = use segments)
  error: null,

  summary: null,              // { data, summary }
  summaryStatus: "idle",      // idle | loading | done | error
  summaryError: null,

  setConnection: (connection) => set({ connection }),
  setMic: (mic) => set({ mic }),
  setError: (error) => set({ error }),
  setEditedText: (editedText) => set({ editedText }),

  addPendingSegment: () => {
    let created;
    set((s) => {
      created = { id: `s${s.seq}`, seq: s.seq };
      return {
        seq: s.seq + 1,
        segments: [
          ...s.segments,
          { ...created, text: "", rawText: "", status: "pending", lowConfidence: false },
        ],
      };
    });
    return created;
  },

  // transcript.segment / segment.error from the server
  applySegmentResult: (id, patch) =>
    set((s) => ({
      segments: s.segments.map((seg) => (seg.id === id ? { ...seg, ...patch } : seg)),
      // text that arrives after the doctor edited gets appended to the edit
      editedText:
        s.editedText !== null && patch.status === "ok" && patch.text
          ? `${s.editedText} ${patch.text}`.trim()
          : s.editedText,
    })),

  setSummaryLoading: () => set({ summaryStatus: "loading", summaryError: null }),
  setSummary: (summary) => set({ summary, summaryStatus: "done" }),
  setSummaryError: (summaryError) => set({ summaryStatus: "error", summaryError }),
  clearSummary: () => set({ summary: null, summaryStatus: "idle", summaryError: null }),

  clear: () => set({ segments: [], seq: 0, editedText: null, error: null }),
}));

// The text that gets summarised: the edit if there is one, else the ASR output.
export const selectTranscript = (s) => s.editedText ?? joinSegments(s.segments);