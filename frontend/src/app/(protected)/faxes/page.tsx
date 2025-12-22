"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Eye,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Play,
  Square,
  Upload,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Types
type FaxStatus = "pending" | "categorized" | "approved" | "overridden" | "processed";
type FaxCategory =
  | "medical_records"
  | "lab_results"
  | "prescriptions"
  | "referrals"
  | "insurance"
  | "billing"
  | "patient_correspondence"
  | "administrative"
  | "urgent"
  | "unknown";

interface FaxRecord {
  id: number;
  filename: string;
  status: FaxStatus;
  ai_category: FaxCategory | null;
  ai_confidence: number | null;
  ai_reason: string | null;
  final_category: FaxCategory | null;
  was_overridden: boolean;
  is_urgent: boolean;
  priority_score: number;
  text_length: number;
  page_count: number;
  summary: string | null;
  received_at: string;
  processed_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

interface FaxDetail extends FaxRecord {
  raw_text: string | null;
  original_path: string;
  override_reason: string | null;
}

interface QueueSummary {
  pending_review: number;
  urgent_count: number;
  today_received: number;
  today_processed: number;
  avg_processing_time_minutes: number | null;
}

interface WatcherStatus {
  is_running: boolean;
  watch_folder: string;
  files_in_queue: number;
  last_scan_at: string | null;
  errors: string[];
}

interface CategoryInfo {
  value: string;
  label: string;
  description: string;
}

const API_BASE = "http://localhost:8000/api/v1/faxes";

const categoryLabels: Record<FaxCategory, string> = {
  medical_records: "Medical Records",
  lab_results: "Lab Results",
  prescriptions: "Prescriptions",
  referrals: "Referrals",
  insurance: "Insurance",
  billing: "Billing",
  patient_correspondence: "Patient Correspondence",
  administrative: "Administrative",
  urgent: "Urgent",
  unknown: "Unknown",
};

const categoryColors: Record<FaxCategory, string> = {
  medical_records: "bg-blue-100 text-blue-700 border border-blue-200",
  lab_results: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  prescriptions: "bg-purple-100 text-purple-700 border border-purple-200",
  referrals: "bg-orange-100 text-orange-700 border border-orange-200",
  insurance: "bg-cyan-100 text-cyan-700 border border-cyan-200",
  billing: "bg-amber-100 text-amber-700 border border-amber-200",
  patient_correspondence: "bg-pink-100 text-pink-700 border border-pink-200",
  administrative: "bg-slate-100 text-slate-700 border border-slate-200",
  urgent: "bg-red-100 text-red-700 border border-red-200",
  unknown: "bg-zinc-100 text-zinc-600 border border-zinc-200",
};

const statusColors: Record<FaxStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  categorized: "bg-blue-100 text-blue-700 border border-blue-200",
  approved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  overridden: "bg-orange-100 text-orange-700 border border-orange-200",
  processed: "bg-slate-100 text-slate-600 border border-slate-200",
};

export default function FaxQueuePage() {
  const [faxes, setFaxes] = useState<FaxRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [watcherStatus, setWatcherStatus] = useState<WatcherStatus | null>(null);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<FaxStatus | "all">("categorized");
  const [urgentOnly, setUrgentOnly] = useState(false);

  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeFax, setActiveFax] = useState<FaxRecord | null>(null);
  const [activeDetail, setActiveDetail] = useState<FaxDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Review dialog state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewFax, setReviewFax] = useState<FaxRecord | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "override">("approve");
  const [overrideCategory, setOverrideCategory] = useState<FaxCategory | "">("");
  const [overrideReason, setOverrideReason] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const fetchFaxes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/?limit=100`;
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      if (urgentOnly) {
        url += `&urgent_only=true`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to load faxes");
      }
      const data = await res.json();
      setFaxes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, urgentOnly]);

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_BASE}/summary`);
      if (res.ok) {
        setSummary(await res.json());
      }
    } catch {}
  };

  const fetchWatcherStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/watcher/status`);
      if (res.ok) {
        setWatcherStatus(await res.json());
      }
    } catch {}
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch {}
  };

  useEffect(() => {
    fetchFaxes();
    fetchSummary();
    fetchWatcherStatus();
    fetchCategories();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchFaxes();
      fetchSummary();
      fetchWatcherStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchFaxes]);

  const handleViewDetail = async (fax: FaxRecord) => {
    setActiveFax(fax);
    setActiveDetail(null);
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const res = await fetch(`${API_BASE}/${fax.id}`);
      if (res.ok) {
        setActiveDetail(await res.json());
      }
    } catch {}
    setDetailLoading(false);
  };

  const handleOpenReview = (fax: FaxRecord, action: "approve" | "override") => {
    setReviewFax(fax);
    setReviewAction(action);
    setOverrideCategory("");
    setOverrideReason("");
    setReviewOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewFax) return;
    if (reviewAction === "override" && !overrideCategory) {
      toast.error("Please select a category");
      return;
    }

    setReviewLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${reviewFax.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: reviewAction,
          category: reviewAction === "override" ? overrideCategory : undefined,
          reason: overrideReason || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to review fax");
      }

      toast.success(reviewAction === "approve" ? "Fax approved" : "Category overridden");
      setReviewOpen(false);
      fetchFaxes();
      fetchSummary();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) {
      toast.error("No faxes selected");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/batch/approve?${[...selectedIds].map(id => `fax_ids=${id}`).join('&')}`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to approve faxes");
      }

      const data = await res.json();
      toast.success(data.message);
      setSelectedIds(new Set());
      fetchFaxes();
      fetchSummary();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleStartWatcher = async () => {
    try {
      const res = await fetch(`${API_BASE}/watcher/start`, { method: "POST" });
      if (res.ok) {
        setWatcherStatus(await res.json());
        toast.success("Watcher started");
      }
    } catch {
      toast.error("Failed to start watcher");
    }
  };

  const handleStopWatcher = async () => {
    try {
      const res = await fetch(`${API_BASE}/watcher/stop`, { method: "POST" });
      if (res.ok) {
        setWatcherStatus(await res.json());
        toast.success("Watcher stopped");
      }
    } catch {
      toast.error("Failed to stop watcher");
    }
  };

  const handleTriggerScan = async () => {
    try {
      await fetch(`${API_BASE}/watcher/scan`, { method: "POST" });
      toast.success("Scan triggered");
      setTimeout(() => {
        fetchFaxes();
        fetchSummary();
        fetchWatcherStatus();
      }, 2000);
    } catch {
      toast.error("Failed to trigger scan");
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === faxes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(faxes.map(f => f.id)));
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Fax Queue</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Review and categorize incoming faxes with AI assistance
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => { fetchFaxes(); fetchSummary(); fetchWatcherStatus(); }} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-white/10" />
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-100">Pending Review</CardDescription>
            <CardTitle className="text-4xl font-bold text-white">{summary?.pending_review ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-blue-100">
              <Clock className="h-4 w-4" />
              Awaiting your decision
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-white/10" />
          <CardHeader className="pb-2">
            <CardDescription className="text-red-100">Urgent</CardDescription>
            <CardTitle className="text-4xl font-bold text-white">{summary?.urgent_count ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-red-100">
              <AlertTriangle className="h-4 w-4" />
              Requires immediate attention
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-white/10" />
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-100">Today Received</CardDescription>
            <CardTitle className="text-4xl font-bold text-white">{summary?.today_received ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-emerald-100">
              <Upload className="h-4 w-4" />
              New faxes today
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-white/10" />
          <CardHeader className="pb-2">
            <CardDescription className="text-violet-100">Processed Today</CardDescription>
            <CardTitle className="text-4xl font-bold text-white">{summary?.today_processed ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-violet-100">
              <CheckCircle2 className="h-4 w-4" />
              Reviewed today
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Watcher Status & Controls */}
      <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${watcherStatus?.is_running ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-800"}`}>
                <Play className={`h-5 w-5 ${watcherStatus?.is_running ? "text-emerald-600" : "text-slate-400"}`} />
              </div>
              <div>
                <CardTitle className="text-lg">Folder Watcher</CardTitle>
                <CardDescription className="text-xs font-mono">
                  {watcherStatus?.watch_folder ?? "Not configured"}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className={`px-3 py-1 ${watcherStatus?.is_running ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
              {watcherStatus?.is_running ? "● Running" : "○ Stopped"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-3">
            {watcherStatus?.is_running ? (
              <Button variant="outline" size="sm" onClick={handleStopWatcher} className="gap-2">
                <Square className="h-3.5 w-3.5" />
                Stop Watcher
              </Button>
            ) : (
              <Button size="sm" onClick={handleStartWatcher} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/25">
                <Play className="h-3.5 w-3.5" />
                Start Watcher
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleTriggerScan} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Scan Now
            </Button>
          </div>
          {watcherStatus?.errors && watcherStatus.errors.length > 0 && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">
              ⚠ {watcherStatus.errors[watcherStatus.errors.length - 1]}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters & Batch Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter className="h-4 w-4" />
            <span>Filter:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FaxStatus | "all")}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            <option value="all">All Status</option>
            <option value="categorized">Awaiting Review</option>
            <option value="approved">Approved</option>
            <option value="overridden">Overridden</option>
            <option value="processed">Processed</option>
            <option value="pending">Pending</option>
          </select>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={urgentOnly}
              onChange={(e) => setUrgentOnly(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600 text-red-500 focus:ring-red-500/20"
            />
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Urgent only
          </label>
        </div>

        {selectedIds.size > 0 && statusFilter === "categorized" && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">
              {selectedIds.size} selected
            </span>
            <Button size="sm" onClick={handleBatchApprove} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/25">
              <Check className="h-3.5 w-3.5" />
              Approve Selected
            </Button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && faxes.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="font-medium">Loading faxes...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && faxes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <BarChart3 className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No faxes found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm">
            Start the folder watcher or upload a fax manually to begin processing.
          </p>
        </div>
      )}

      {/* Fax Table */}
      {faxes.length > 0 && (
        <div className="rounded-xl bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
          <TooltipProvider>
            <table className="min-w-full text-sm text-left">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                <tr>
                  {statusFilter === "categorized" && (
                    <th className="px-4 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === faxes.length && faxes.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500/20"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Document</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">AI Category</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Confidence</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pages</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Received</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {faxes.map((fax) => (
                  <tr
                    key={fax.id}
                    className={`group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      fax.is_urgent ? "bg-red-50/50 dark:bg-red-950/10" : ""
                    }`}
                  >
                    {statusFilter === "categorized" && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(fax.id)}
                          onChange={() => toggleSelect(fax.id)}
                          className="rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500/20"
                        />
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {fax.is_urgent && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white truncate max-w-[220px]" title={fax.filename}>
                            {fax.filename}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant="secondary"
                        className={statusColors[fax.status]}
                      >
                        {fax.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      {fax.ai_category && (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={categoryColors[fax.ai_category]}
                          >
                            {categoryLabels[fax.ai_category]}
                          </Badge>
                          {fax.was_overridden && fax.final_category && (
                            <span className="text-xs text-slate-500">
                              → {categoryLabels[fax.final_category]}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {fax.ai_confidence != null && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                fax.ai_confidence >= 0.8
                                  ? "bg-emerald-500"
                                  : fax.ai_confidence >= 0.6
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${fax.ai_confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {Math.round(fax.ai_confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-500">{fax.page_count}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {new Date(fax.received_at).toLocaleDateString()}<br />
                      <span className="text-xs">{new Date(fax.received_at).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => handleViewDetail(fax)}
                              className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View details</TooltipContent>
                        </Tooltip>

                        {fax.status === "categorized" && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon-sm"
                                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/25"
                                  onClick={() => handleOpenReview(fax, "approve")}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Approve</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  onClick={() => handleOpenReview(fax, "override")}
                                  className="hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Override</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TooltipProvider>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fax Details</DialogTitle>
            <DialogDescription>{activeFax?.filename}</DialogDescription>
          </DialogHeader>

          {detailLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

          {activeDetail && (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <Badge variant="secondary" className={statusColors[activeDetail.status]}>
                    {activeDetail.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">AI Category:</span>{" "}
                  {activeDetail.ai_category && (
                    <Badge variant="secondary" className={categoryColors[activeDetail.ai_category]}>
                      {categoryLabels[activeDetail.ai_category]}
                    </Badge>
                  )}
                </div>
                <div>
                  <span className="font-medium">Confidence:</span>{" "}
                  {activeDetail.ai_confidence != null
                    ? `${Math.round(activeDetail.ai_confidence * 100)}%`
                    : "-"}
                </div>
                <div>
                  <span className="font-medium">Pages:</span> {activeDetail.page_count}
                </div>
                <div>
                  <span className="font-medium">Characters:</span> {activeDetail.text_length}
                </div>
                <div>
                  <span className="font-medium">Urgent:</span>{" "}
                  {activeDetail.is_urgent ? "Yes" : "No"}
                </div>
              </div>

              {/* AI Reason */}
              {activeDetail.ai_reason && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="font-medium text-sm mb-1">AI Reasoning</div>
                  <p className="text-sm text-muted-foreground">{activeDetail.ai_reason}</p>
                </div>
              )}

              {/* Override info */}
              {activeDetail.was_overridden && (
                <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
                  <div className="font-medium text-sm mb-1">Override</div>
                  <p className="text-sm">
                    Changed to: {activeDetail.final_category && categoryLabels[activeDetail.final_category]}
                  </p>
                  {activeDetail.override_reason && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Reason: {activeDetail.override_reason}
                    </p>
                  )}
                  {activeDetail.reviewed_by && (
                    <p className="text-xs text-muted-foreground mt-1">
                      By: {activeDetail.reviewed_by} at{" "}
                      {activeDetail.reviewed_at && new Date(activeDetail.reviewed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Summary */}
              {activeDetail.summary && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="font-medium text-sm mb-1">Summary</div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {activeDetail.summary}
                  </p>
                </div>
              )}

              {/* Raw text */}
              {activeDetail.raw_text && (
                <details className="rounded-md border bg-muted/30 p-3">
                  <summary className="cursor-pointer font-medium text-sm">
                    Extracted Text
                  </summary>
                  <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs">
                    {activeDetail.raw_text}
                  </pre>
                </details>
              )}
            </div>
          )}

          <DialogFooter>
            {activeDetail?.status === "categorized" && (
              <>
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setDetailOpen(false);
                    if (activeDetail) handleOpenReview(activeDetail, "approve");
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailOpen(false);
                    if (activeDetail) handleOpenReview(activeDetail, "override");
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Override
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve Categorization" : "Override Category"}
            </DialogTitle>
            <DialogDescription>{reviewFax?.filename}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewAction === "approve" ? (
              <div className="rounded-md border bg-green-50 border-green-200 p-3">
                <p className="text-sm">
                  Accept AI's categorization:{" "}
                  <strong>
                    {reviewFax?.ai_category && categoryLabels[reviewFax.ai_category]}
                  </strong>
                </p>
                {reviewFax?.ai_confidence != null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Confidence: {Math.round(reviewFax.ai_confidence * 100)}%
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select correct category:</label>
                  <select
                    value={overrideCategory}
                    onChange={(e) => setOverrideCategory(e.target.value as FaxCategory)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Choose a category...</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason (optional):</label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Why is this the correct category?"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setReviewOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={reviewLoading || (reviewAction === "override" && !overrideCategory)}
              className={reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {reviewLoading ? "Saving..." : reviewAction === "approve" ? "Approve" : "Override"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
