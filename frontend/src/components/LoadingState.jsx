import { useEffect, useState } from "react";

const STEPS = [
  "Parsing clinical notes…",
  "Identifying diagnosis codes…",
  "Drafting authorization letter…",
];

export default function LoadingState() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % STEPS.length);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-white">Working on it</h2>
      <ul className="mt-5 space-y-4">
        {STEPS.map((label, i) => {
          const isActive = i === active;
          return (
            <li key={label} className="flex items-center gap-3">
              <span
                className={`block h-2.5 w-2.5 rounded-full transition ${
                  isActive
                    ? "bg-violet-500 animate-pulse"
                    : i < active
                      ? "bg-violet-500/60"
                      : "bg-slate-700"
                }`}
              />
              <span
                className={`text-sm transition ${
                  isActive ? "text-white" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
