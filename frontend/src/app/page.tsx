"use client";

import { useState } from "react";

type DocumentType = "discharge_summary" | "inpatient_document" | "census" | "junk";

type DocumentAnalysisResponse = {
  type: DocumentType;
  summary: string;
  text_length: number;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
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

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/documents/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail ?? "Failed to analyze document.");
      }

      const data: DocumentAnalysisResponse = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-sm border border-zinc-200 p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Clinical Document Analyzer
          </h1>
          <p className="text-sm text-zinc-500">
            Upload a PDF or TIFF discharge summary, inpatient note, or census
            file. The backend will classify the document type and generate a
            concise summary using a local LLM.
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
            <p className="text-xs text-zinc-500">
              Supported types: PDF, TIFF.
            </p>
          </div>

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
    </div>
  );
}
