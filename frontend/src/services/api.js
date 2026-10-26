import { API_URL } from "../config";

export async function summarize(transcript) {
  const res = await fetch(`${API_URL}/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });
  if (!res.ok) {
    if (res.status === 422) throw new Error("Transcript is too short to summarize.");
    let detail = "";
    try { detail = (await res.json()).detail; } catch { /* ignore */ }
    throw new Error(typeof detail === "string" && detail ? detail : `Request failed (${res.status})`);
  }
  return res.json(); // { data, summary }
}
