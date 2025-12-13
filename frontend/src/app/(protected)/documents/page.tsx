"use client";

import { useEffect, useState } from "react";

type DocumentType = "discharge_summary" | "inpatient_document" | "census" | "junk";

interface DocumentRecord {
  id: number;
  filename: string;
  doc_type: DocumentType;
  summary: string;
  text_length: number;
  created_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:8000/documents?limit=50");
        if (!res.ok) {
          setError("Failed to load documents.");
          return;
        }
        const data = (await res.json()) as DocumentRecord[];
        setDocuments(data);
      } catch (err: any) {
        setError(err.message ?? "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  return (
    <div className="w-full max-w-4xl rounded-xl bg-white shadow-sm border border-zinc-200 p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Recent documents</h1>
        <p className="text-sm text-zinc-500">
          List of recently analyzed documents stored in the backend database.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !documents.length && !error && (
        <p className="text-sm text-zinc-500">Loading documents…</p>
      )}

      {!loading && !error && documents.length === 0 && (
        <p className="text-sm text-zinc-500">
          No documents found yet. Upload and analyze a document on the dashboard
          to see it appear here.
        </p>
      )}

      {documents.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-zinc-700">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2">Filename</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Characters</th>
                <th className="px-3 py-2">Created at</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-zinc-100 last:border-0">
                  <td
                    className="px-3 py-2 max-w-xs truncate"
                    title={doc.filename}
                  >
                    {doc.filename}
                  </td>
                  <td className="px-3 py-2 capitalize">
                    {doc.doc_type.replace("_", " ")}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{doc.text_length}</td>
                  <td className="px-3 py-2 text-zinc-500">
                    {new Date(doc.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
