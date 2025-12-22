"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

type DocumentType = "discharge_summary" | "inpatient_document" | "census" | "junk_fax";

const documentTypeLabels: Record<DocumentType, string> = {
  discharge_summary: "Discharge Summary",
  inpatient_document: "Inpatient Document",
  census: "Census",
  junk_fax: "Junk Fax",
};

interface DocumentRecord {
  id: number;
  filename: string;
  doc_type: DocumentType;
  summary: string;
  text_length: number;
  classification_reason?: string | null;
  review_note?: string | null;
  auto_approved?: boolean;
  created_at: string;
}

interface DocumentDetail extends DocumentRecord {
  raw_text: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocumentRecord | null>(null);
  const [activeDetail, setActiveDetail] = useState<DocumentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const handleViewSummary = async (doc: DocumentRecord) => {
    setActiveDoc(doc);
    setActiveDetail(null);
    setDetailError(null);
    setSummaryOpen(true);

    // Fetch full text + classification reason on demand.
    setDetailLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/documents/${doc.id}`);
      if (!res.ok) {
        let detail = "Failed to load document details.";
        try {
          const data = await res.json();
          detail = data?.detail ?? detail;
        } catch {
          // ignore
        }
        setDetailError(detail);
        return;
      }
      const data = (await res.json()) as DocumentDetail;
      setActiveDetail(data);
    } catch (err: any) {
      setDetailError(err?.message ?? "Unexpected error");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAskDelete = (doc: DocumentRecord) => {
    setActiveDoc(doc);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!activeDoc) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/documents/${activeDoc.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        let detail = "Failed to delete document.";
        try {
          const data = await res.json();
          detail = data?.detail ?? detail;
        } catch {
          // ignore
        }
        toast.error(detail);
        return;
      }

      setDocuments((prev) => prev.filter((d) => d.id !== activeDoc.id));
      toast.success("Document deleted.");
      setDeleteOpen(false);
      setActiveDoc(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Unexpected error");
    }
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:8000/api/v1/documents?limit=50");
        if (!res.ok) {
          setError("Failed to load documents.");
          return;
        }
        const data = (await res.json()) as DocumentRecord[];
        // Ensure newest-first ordering (created_at descending)
        data.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
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
          No documents found yet. Upload and analyze a document 
          to see it appear here.
        </p>
      )}

      {documents.length > 0 && (
        <div className="overflow-x-auto">
          <TooltipProvider>
          <table className="min-w-full text-sm text-left text-zinc-700">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2">Filename</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Characters</th>
                <th className="px-3 py-2">Created at</th>
                <th className="px-3 py-2 text-right">Actions</th>
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
                  <td className="px-3 py-2">
                    {documentTypeLabels[doc.doc_type] || doc.doc_type}
                  </td>
                  <td className="px-3 py-2">
                    {doc.auto_approved ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                        Auto Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline">Manual</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{doc.text_length}</td>
                  <td className="px-3 py-2 text-zinc-500">
                    {new Date(doc.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon-sm"
                            aria-label="View summary"
                            onClick={() => handleViewSummary(doc)}
                          >
                            <Eye />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">View summary</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            aria-label="Delete document"
                            onClick={() => handleAskDelete(doc)}
                          >
                            <Trash2 />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </TooltipProvider>
        </div>
      )}

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Summary</DialogTitle>
            <DialogDescription className="mb-2">
              {activeDoc?.filename ?? "Selected document"}
            </DialogDescription>
          </DialogHeader>

          <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
            {activeDoc?.summary ?? ""}
          </pre>

          {(activeDetail?.classification_reason || detailError || detailLoading) && (
            <section className="mt-3 rounded-md border bg-muted/30 p-3 text-sm">
              <div className="font-medium">Classification reason</div>
              {detailLoading && (
                <div className="text-muted-foreground">Loading…</div>
              )}
              {detailError && (
                <div className="text-destructive">{detailError}</div>
              )}
              {activeDetail?.classification_reason && (
                <div className="text-muted-foreground">
                  {activeDetail.classification_reason}
                </div>
              )}
            </section>
          )}

          {(activeDoc?.review_note || activeDetail?.review_note) && (
            <section className="mt-3 rounded-md border bg-blue-50 p-3 text-sm">
              <div className="font-medium text-blue-900">Review Note</div>
              <div className="text-blue-700 mt-1">
                {activeDetail?.review_note || activeDoc?.review_note}
              </div>
            </section>
          )}

          {activeDetail?.raw_text && (
            <details className="mt-3 rounded-md border bg-muted/30 p-3 text-sm">
              <summary className="cursor-pointer font-medium">Extracted text</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-sm">
                {activeDetail.raw_text}
              </pre>
            </details>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setSummaryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              This will permanently remove the selected document analysis from the database.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm">
            <div className="font-medium">{activeDoc?.filename ?? ""}</div>
            <div className="text-muted-foreground">ID: {activeDoc?.id ?? ""}</div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
