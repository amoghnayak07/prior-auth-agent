import { useRef, useState } from "react";

function Field({ label, value, onChange, disabled, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function isPdf(f) {
  if (!f) return false;
  if (f.type === "application/pdf" || f.type === "application/x-pdf") return true;
  return /\.pdf$/i.test(f.name);
}

export default function UploadZone({ disabled, onSubmit }) {
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [patientName, setPatientName] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const canSubmit =
    !disabled &&
    file &&
    !fileError &&
    patientName.trim() &&
    insuranceProvider.trim() &&
    diagnosis.trim();

  const handleFile = (f) => {
    if (!f) return;
    if (!isPdf(f)) {
      setFile(null);
      setFileError("That doesn't look like a PDF. Please upload a .pdf file.");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setFile(null);
      setFileError("PDF is larger than 10 MB. Please upload a smaller file.");
      return;
    }
    setFileError("");
    setFile(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const form = new FormData();
    form.append("pdf_file", file);
    form.append("patient_name", patientName.trim());
    form.append("insurance_provider", insuranceProvider.trim());
    form.append("diagnosis", diagnosis.trim());
    onSubmit(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5"
    >
      <div>
        <h2 className="text-lg font-semibold text-white">Clinical notes</h2>
        <p className="mt-1 text-sm text-slate-400">
          Upload a PDF of the patient's clinical notes and fill in the patient
          details below.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (disabled) return;
          const dropped = e.dataTransfer.files?.[0];
          handleFile(dropped);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
          isDragOver
            ? "border-violet-500 bg-violet-500/5"
            : "border-slate-700 hover:border-violet-500"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={disabled}
        />
        {file ? (
          <div className="text-sm">
            <p className="font-medium text-white">{file.name}</p>
            <p className="mt-1 text-slate-500">
              {(file.size / 1024).toFixed(1)} KB · click or drop to replace
            </p>
          </div>
        ) : (
          <div className="text-sm text-slate-400">
            <p className="text-white">Drop a PDF here, or click to browse</p>
            <p className="mt-1 text-slate-500">Clinical notes, max 10 MB</p>
          </div>
        )}
      </div>
      {fileError && (
        <p className="-mt-3 text-sm text-red-300">{fileError}</p>
      )}

      <div className="space-y-4">
        <Field
          label="Patient name"
          value={patientName}
          onChange={setPatientName}
          disabled={disabled}
          placeholder="Jane Doe"
        />
        <Field
          label="Insurance provider"
          value={insuranceProvider}
          onChange={setInsuranceProvider}
          disabled={disabled}
          placeholder="Aetna"
        />
        <Field
          label="Primary diagnosis"
          value={diagnosis}
          onChange={setDiagnosis}
          disabled={disabled}
          placeholder="Type 2 diabetes mellitus"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-violet-500 px-4 py-2.5 font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {disabled ? "Generating…" : "Generate Letter"}
      </button>
    </form>
  );
}
