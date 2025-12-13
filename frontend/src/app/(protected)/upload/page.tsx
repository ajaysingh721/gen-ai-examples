"use client";

import { useState } from "react";

type DocumentType = "discharge_summary" | "inpatient_document" | "census" | "junk";

type DocumentAnalysisResponse = {
  type: DocumentType;
  summary: string;
  text_length: number;
};

export default function UploadSummarizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<
    "uploading" | "analyzing" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentAnalysisResponse | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError("Please select a PDF or TIFF file.");
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);
      setUploadPhase("uploading");

      const formData = new FormData();
      formData.append("file", file);

      const response: DocumentAnalysisResponse = await new Promise(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "http://localhost:8000/documents/analyze");

          xhr.upload.onprogress = (progressEvent) => {
            if (progressEvent.lengthComputable) {
              const percent = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100,
              );
              setUploadProgress(percent);
            }
          };

          xhr.upload.onload = () => {
            setUploadPhase("analyzing");
            setUploadProgress((prev) => {
              if (prev === null) return 90;
              return prev < 90 ? 90 : prev;
            });
          };

          xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const data = JSON.parse(xhr.responseText);
                  resolve(data as DocumentAnalysisResponse);
                } catch {
                  reject(new Error("Invalid response from server."));
                }
              } else {
                try {
                  const data = JSON.parse(xhr.responseText);
                  reject(
                    new Error(data?.detail ?? "Failed to analyze document."),
                  );
                } catch {
                  reject(new Error("Failed to analyze document."));
                }
              }
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));

          xhr.send(formData);
        },
      );

      setResult(response);
    } catch (err: any) {
      setError(err.message ?? "Unexpected error");
    } finally {
      setLoading(false);
      setUploadPhase(null);
      setUploadProgress(null);
    }
  };

  return (
    <div className="w-full max-w-2xl rounded-xl bg-white shadow-sm border border-zinc-200 p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Upload & summarize
        </h1>
        <p className="text-sm text-zinc-500">
          Upload a PDF or TIFF. The backend will classify the document type and
          generate a concise summary using a local LLM.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700">
            Document file
          </label>
          <input
            type="file"
            accept=".pdf,.tif,.tiff,application/pdf,image/tiff"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setFile(selected);
              setResult(null);
              setError(null);
            }}
            className="block w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          <p className="text-xs text-zinc-500">Supported types: PDF, TIFF.</p>
        </div>

        {uploadProgress !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-600">
              <span>
                {uploadPhase === "analyzing"
                  ? "Analyzing document"
                  : "Upload progress"}
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full bg-black transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {loading ? "Analyzing…" : "Analyze document"}
        </button>
      </form>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <section className="space-y-2 border-t border-zinc-200 pt-4">
          <div className="flex items-center justify-between text-sm text-zinc-600">
            <span>
              <span className="font-medium text-zinc-800">Type: </span>
              {result.type.replace("_", " ")}
            </span>
            <span>
              <span className="font-medium text-zinc-800">Characters: </span>
              {result.text_length}
            </span>
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-zinc-800">Summary</h2>
            <pre className="whitespace-pre-wrap rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">
              {result.summary}
            </pre>
          </div>
        </section>
      )}
    </div>
  );
}
