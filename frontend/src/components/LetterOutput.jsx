import { useEffect, useState } from "react";

export default function LetterOutput({ result, patientName, onReset }) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable; ignore silently
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result.letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (patientName || "patient").replace(/[^a-z0-9]+/gi, "-");
    a.href = url;
    a.download = `prior-auth-${safeName.toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`space-y-5 transition-opacity duration-500 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
          Clinical summary
        </p>
        <p className="mt-2 text-sm text-emerald-50">{result.summary}</p>
      </div>

      {result.icd_codes?.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            ICD-10 codes
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.icd_codes.map((code) => (
              <span
                key={code}
                className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-medium text-violet-300"
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-200">
          {result.letter}
        </pre>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-violet-500"
        >
          {copied ? "Copied!" : "Copy Letter"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400"
        >
          Download .txt
        </button>
      </div>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-700 hover:text-white"
        >
          New letter
        </button>
      )}
    </div>
  );
}
