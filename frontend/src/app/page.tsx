"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FileText, History, LayoutDashboard, Settings, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";

type DocumentType = "discharge_summary" | "inpatient_document" | "census" | "junk";

type DocumentAnalysisResponse = {
  type: DocumentType;
  summary: string;
  text_length: number;
};

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<"uploading" | "analyzing" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentAnalysisResponse | null>(null);
  const [documents, setDocuments] = useState<DocumentAnalysisResponse[] | null>(
    null,
  );
  const [navCollapsed, setNavCollapsed] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchDocuments = async () => {
      try {
        const res = await fetch("http://localhost:8000/documents?limit=20");
        if (!res.ok) return;
        const data = (await res.json()) as any[];
        setDocuments(
          data.map((d) => ({
            type: d.doc_type as DocumentType,
            summary: d.summary,
            text_length: d.text_length,
          })),
        );
      } catch {
        // ignore listing errors for now
      }
    };

    fetchDocuments();
  }, [status]);

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

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round(
                (event.loaded / event.total) * 100,
              );
              setUploadProgress(percent);
            }
          };

          xhr.upload.onload = () => {
            // Upload finished; switch to analyzing phase and bump progress
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
                } catch (e) {
                  reject(new Error("Invalid response from server."));
                }
              } else {
                try {
                  const data = JSON.parse(xhr.responseText);
                  reject(
                    new Error(
                      data?.detail ?? "Failed to analyze document.",
                    ),
                  );
                } catch (e) {
                  reject(new Error("Failed to analyze document."));
                }
              }
            }
          };

          xhr.onerror = () => {
            reject(new Error("Network error"));
          };

          xhr.send(formData);
        },
      );

      setResult(response);
      // Refresh document list after successful upload
      try {
        const res = await fetch("http://localhost:8000/documents?limit=20");
        if (res.ok) {
          const docs = (await res.json()) as any[];
          setDocuments(
            docs.map((d) => ({
              type: d.doc_type as DocumentType,
              summary: d.summary,
              text_length: d.text_length,
            })),
          );
        }
      } catch {
        // ignore listing errors
      }
    } catch (err: any) {
      setError(err.message ?? "Unexpected error");
    } finally {
      setLoading(false);
      setUploadPhase(null);
      setUploadProgress(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading session…</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    // Redirect handled in useEffect; render nothing to avoid flicker
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex">
      <aside
        className={`relative hidden md:flex flex-col border-r border-zinc-200 bg-white/80 backdrop-blur-sm px-3 py-4 gap-4 transition-all duration-200 ${navCollapsed ? "w-16" : "w-64"}`}
      >
        <div className="flex items-center justify-between gap-2">
          {!navCollapsed && (
            <div className="space-y-1">
              <h1 className="text-sm font-semibold tracking-tight">
                Clinical Console
              </h1>
              <p className="text-[11px] text-zinc-500">
                Admin tools for document analysis.
              </p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 text-sm mt-1">
          <div className="flex items-center gap-2 rounded-md bg-zinc-900 text-zinc-50 px-3 py-2 font-medium text-xs">
            <LayoutDashboard className="h-4 w-4" />
            {!navCollapsed && <span>Dashboard</span>}
          </div>
          <button
            type="button"
            className="w-full text-left rounded-md px-3 py-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs flex items-center gap-2"
          >
            <FileText className="h-3.5 w-3.5" />
            {!navCollapsed && <span>Upload & summarize</span>}
          </button>
          <button
            type="button"
            className="w-full text-left rounded-md px-3 py-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs flex items-center gap-2"
          >
            <History className="h-3.5 w-3.5" />
            {!navCollapsed && <span>Recent documents</span>}
          </button>
          <button
            type="button"
            className="w-full text-left rounded-md px-3 py-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs flex items-center gap-2"
          >
            <Settings className="h-3.5 w-3.5" />
            {!navCollapsed && <span>Settings (coming soon)</span>}
          </button>
        </nav>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-auto inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          {!navCollapsed && <span className="ml-1.5">Sign out</span>}
        </button>

        <button
          type="button"
          onClick={() => setNavCollapsed((prev) => !prev)}
          className="absolute top-1/2 -right-3 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-300 bg-white text-[11px] text-zinc-700 shadow-sm hover:bg-zinc-50"
          aria-label={navCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {navCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </aside>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl rounded-xl bg-white shadow-sm border border-zinc-200 p-6 space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Clinical Document Analyzer
            </h1>
            <p className="text-sm text-zinc-500">
              Upload a PDF or TIFF discharge summary, inpatient note, or
              census file. The backend will classify the document type and
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
            <p className="text-xs text-zinc-500">
              Supported types: PDF, TIFF.
            </p>
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

        {documents && documents.length > 0 && (
          <section className="space-y-2 border-t border-zinc-200 pt-4">
            <h2 className="text-sm font-semibold text-zinc-800">
              Recent documents
            </h2>
            <ul className="space-y-1 text-sm text-zinc-700 max-h-40 overflow-y-auto">
              {documents.map((doc, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5"
                >
                  <span className="truncate max-w-xs">
                    {doc.type.replace("_", " ")}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {doc.text_length} chars
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
        </div>
      </div>
    </div>
  );
}
