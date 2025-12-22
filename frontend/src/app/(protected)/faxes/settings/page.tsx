"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings, Folder, BarChart3, TrendingUp, CheckCircle2, XCircle, Clock, Sparkles, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FaxSettings {
  watch_folder: string;
  auto_process: boolean;
  require_review: boolean;
  confidence_threshold: number;
}

interface FaxStats {
  total_faxes: number;
  pending: number;
  categorized: number;
  approved: number;
  overridden: number;
  processed: number;
  category_counts: Record<string, number>;
  total_reviewed: number;
  accuracy_rate: number;
  processed_today: number;
  processed_this_week: number;
}

const API_BASE = "http://localhost:8000/api/v1/faxes";

const categoryLabels: Record<string, string> = {
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

export default function FaxSettingsPage() {
  const [settings, setSettings] = useState<FaxSettings | null>(null);
  const [stats, setStats] = useState<FaxStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [watchFolder, setWatchFolder] = useState("");
  const [autoProcess, setAutoProcess] = useState(true);
  const [requireReview, setRequireReview] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setWatchFolder(data.watch_folder);
        setAutoProcess(data.auto_process);
        setRequireReview(data.require_review);
        setConfidenceThreshold(data.confidence_threshold);
      }
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {}
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSettings(), fetchStats()]).finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watch_folder: watchFolder,
          auto_process: autoProcess,
          require_review: requireReview,
          confidence_threshold: confidenceThreshold,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      const data = await res.json();
      setSettings(data);
      toast.success("Settings saved");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="animate-spin h-5 w-5 border-2 border-slate-300 border-t-blue-500 rounded-full" />
          <span className="font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <header className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg shadow-slate-500/25">
          <Settings className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Fax Settings & Statistics
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Configure the fax processing system and view performance metrics.
          </p>
        </div>
      </header>

      {/* Settings Card */}
      <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
        <CardHeader>
          <CardTitle className="text-xl">Processing Settings</CardTitle>
          <CardDescription>
            Configure how the system processes incoming faxes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Folder className="h-4 w-4 text-slate-500" />
              Watch Folder
            </label>
            <input
              type="text"
              value={watchFolder}
              onChange={(e) => setWatchFolder(e.target.value)}
              placeholder="./fax_inbox"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Path to the folder where new faxes arrive.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Confidence Threshold</label>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceThreshold * 100}
                  onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              <div className="flex h-10 w-16 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-sm">
                {Math.round(confidenceThreshold * 100)}%
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Faxes with confidence below this threshold will be flagged for manual review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoProcess}
                onChange={(e) => setAutoProcess(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500/20 h-5 w-5"
              />
              <span className="text-sm font-medium">Auto-process new faxes</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requireReview}
                onChange={(e) => setRequireReview(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500/20 h-5 w-5"
              />
              <span className="text-sm font-medium">Require human review</span>
            </label>
          </div>

          <Button 
            onClick={handleSaveSettings} 
            disabled={saving}
            className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-lg shadow-slate-500/25">
              <div className="absolute right-0 top-0 -mr-4 -mt-4 h-20 w-20 rounded-full bg-white/10" />
              <CardContent className="pt-6">
                <p className="text-sm text-slate-300">Total Faxes</p>
                <p className="text-3xl font-bold">{stats.total_faxes}</p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
              <div className="absolute right-0 top-0 -mr-4 -mt-4 h-20 w-20 rounded-full bg-white/10" />
              <CardContent className="pt-6">
                <p className="text-sm text-blue-100">Awaiting Review</p>
                <p className="text-3xl font-bold">{stats.categorized}</p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <div className="absolute right-0 top-0 -mr-4 -mt-4 h-20 w-20 rounded-full bg-white/10" />
              <CardContent className="pt-6">
                <p className="text-sm text-emerald-100">Approved</p>
                <p className="text-3xl font-bold">{stats.approved}</p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25">
              <div className="absolute right-0 top-0 -mr-4 -mt-4 h-20 w-20 rounded-full bg-white/10" />
              <CardContent className="pt-6">
                <p className="text-sm text-orange-100">Overridden</p>
                <p className="text-3xl font-bold">{stats.overridden}</p>
              </CardContent>
            </Card>
          </div>

          {/* AI Accuracy & Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Sparkles className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI Accuracy</CardTitle>
                    <CardDescription>
                      Categorization approval rate
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <svg className="h-24 w-24 -rotate-90 transform">
                      <circle
                        className="text-slate-200 dark:text-slate-700"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="48"
                        cy="48"
                      />
                      <circle
                        className="text-emerald-500"
                        strokeWidth="8"
                        strokeDasharray={`${stats.accuracy_rate * 2.51} 251`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="48"
                        cy="48"
                      />
                    </svg>
                    <span className="absolute text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.accuracy_rate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Reviewed</span>
                      <span className="font-semibold">{stats.total_reviewed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Approved
                      </span>
                      <span className="font-semibold">{stats.approved}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-600 flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Overridden
                      </span>
                      <span className="font-semibold">{stats.overridden}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <CardDescription>Faxes processed recently</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium">Today</span>
                    </div>
                    <span className="text-2xl font-bold">{stats.processed_today}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">This Week</span>
                    </div>
                    <span className="text-2xl font-bold">{stats.processed_this_week}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Distribution */}
          <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <BarChart3 className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Category Distribution</CardTitle>
                  <CardDescription>Breakdown of faxes by category</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.category_counts).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.category_counts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, count]) => (
                      <div key={category} className="flex items-center gap-4">
                        <Badge variant="secondary" className="min-w-[140px] justify-center border border-slate-200 dark:border-slate-700">
                          {categoryLabels[category] || category}
                        </Badge>
                        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${(count / stats.total_faxes) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-12 text-right text-slate-700 dark:text-slate-300">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                    <BarChart3 className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No category data available yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
