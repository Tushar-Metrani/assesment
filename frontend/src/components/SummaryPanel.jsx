import { useState } from "react";
import { useSessionStore } from "../store/sessionStore";
import SummarySection, { Val } from "./SummarySection";
import { buildSections } from "./summarySections";

export default function SummaryPanel() {
  const { summary, summaryStatus, summaryError, clearSummary } = useSessionStore();
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(summary.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>AI Medical Summary</h2>
        {summary && <button className="btn" onClick={clearSummary}>Clear</button>}
      </div>

      {summaryStatus === "loading" && <div className="muted">Analysing transcript…</div>}
      {summaryStatus === "error" && <div className="error">{summaryError}</div>}
      {summaryStatus === "idle" && (
        <div className="muted">Stop the recording, review the transcript, then click “Process Transcript with AI”.</div>
      )}

      {summary && (
        <>
          <h3 className="sum-title">Clinical Summary</h3>
          <div className="summary-text">
            {summary.summary.split("\n").map((line, i) => <div key={i}><Val text={line} /></div>)}
          </div>
          {buildSections(summary.data).map((s) => (
            <SummarySection key={s.title} title={s.title} rows={s.rows} />
          ))}
          <button className="btn primary wide" onClick={copy}>
            {copied ? "Copied" : "Copy to Prescription"}
          </button>
        </>
      )}
    </section>
  );
}
