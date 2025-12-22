"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings, Folder, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FaxSettings {
  watch_folder: string;
  auto_process: boolean;
  require_review: boolean;
  confidence_threshold: number;
}

const API_BASE = "http://localhost:8000/api/v1/faxes";

export default function FaxSettingsPage() {
  const [settings, setSettings] = useState<FaxSettings | null>(null);
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

  useEffect(() => {
    setLoading(true);
    fetchSettings().finally(() => setLoading(false));
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
            Fax Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Configure the fax processing system behavior and preferences.
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
    </div>
  );
}
