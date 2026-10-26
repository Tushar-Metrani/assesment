import TranscriptPanel from "./components/TranscriptPanel";
import SummaryPanel from "./components/SummaryPanel";

export default function App() {
  return (
    <main className="layout">
      <TranscriptPanel />
      <SummaryPanel />
    </main>
  );
}