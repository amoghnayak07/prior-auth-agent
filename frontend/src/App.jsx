import { useState } from "react";
import UploadZone from "./components/UploadZone";
import LoadingState from "./components/LoadingState";
import LetterOutput from "./components/LetterOutput";

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center">
      <p className="text-white">No letter yet</p>
      <p className="mt-1 text-sm text-slate-400">
        Upload a clinical-note PDF and fill in the patient details to generate
        a prior authorization letter.
      </p>
    </div>
  );
}

function ErrorCard({ message }) {
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6">
      <p className="text-sm font-semibold text-red-200">
        Could not generate a letter
      </p>
      <p className="mt-2 text-sm text-red-100/90">{message}</p>
    </div>
  );
}

function extractErrorMessage(payload) {
  if (!payload) return "Unknown error.";
  const detail = payload.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    if (typeof detail.error === "string") return detail.error;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  }
  return "Unknown error.";
}

export default function App() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastPatientName, setLastPatientName] = useState("");

  const handleReset = () => {
    setStatus("idle");
    setResult(null);
    setErrorMessage("");
    setLastPatientName("");
  };

  const handleSubmit = async (formData) => {
    setStatus("loading");
    setErrorMessage("");
    setResult(null);
    setLastPatientName(formData.get("patient_name") || "");

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${API_BASE}/api/authorize`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let payload = null;
        try {
          payload = await res.json();
        } catch {
          // body wasn't JSON
        }
        setErrorMessage(extractErrorMessage(payload) || `HTTP ${res.status}`);
        setStatus("error");
        return;
      }

      const data = await res.json();
      setResult(data);
      setStatus("success");
    } catch (e) {
      setErrorMessage(e.message || "Network error.");
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-950 to-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Prior Auth Agent
          </h1>
          <p className="mt-2 text-slate-300">
            Turn clinical notes into a draft prior authorization letter in
            seconds.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <UploadZone
            disabled={status === "loading"}
            onSubmit={handleSubmit}
          />

          <div>
            {status === "idle" && <EmptyState />}
            {status === "loading" && <LoadingState />}
            {status === "error" && <ErrorCard message={errorMessage} />}
            {status === "success" && result && (
              <LetterOutput
                result={result}
                patientName={lastPatientName}
                onReset={handleReset}
              />
            )}
            {status === "error" && (
              <button
                type="button"
                onClick={handleReset}
                className="mt-3 w-full rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-700 hover:text-white"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
