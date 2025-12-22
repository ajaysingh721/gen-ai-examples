"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, TrendingUp, CheckCircle2, XCircle, Clock, Sparkles, Activity, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

const categoryColors: Record<string, string> = {
  medical_records: "from-blue-500 to-blue-600",
  lab_results: "from-emerald-500 to-teal-600",
  prescriptions: "from-purple-500 to-violet-600",
  referrals: "from-orange-500 to-amber-600",
  insurance: "from-cyan-500 to-blue-600",
  billing: "from-yellow-500 to-orange-600",
  patient_correspondence: "from-pink-500 to-rose-600",
  administrative: "from-slate-500 to-slate-600",
  urgent: "from-red-500 to-rose-600",
  unknown: "from-zinc-500 to-slate-600",
};

export default function FaxStatisticsPage() {
  const [stats, setStats] = useState<FaxStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {
      toast.error("Failed to load statistics");
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStats().finally(() => setLoading(false));
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="animate-spin h-5 w-5 border-2 border-slate-300 border-t-blue-500 rounded-full" />
          <span className="font-medium">Loading statistics...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
          <BarChart3 className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No statistics available</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          Process some faxes to see statistics.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Fax Statistics
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Performance metrics and analytics for the fax processing system
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchStats} className="gap-2">
          <Activity className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-lg shadow-slate-500/25">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-20 w-20 rounded-full bg-white/10" />
          <CardContent className="pt-6 relative">
            <FileText className="h-5 w-5 text-slate-300 mb-2" />
            <p className="text-sm text-slate-300">Total Faxes</p>
            <p className="text-3xl font-bold">{stats.total_faxes}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-20 w-20 rounded-full bg-white/10" />
          <CardContent className="pt-6 relative">
            <Clock className="h-5 w-5 text-amber-100 mb-2" />
            <p className="text-sm text-amber-100">Pending</p>
            <p className="text-3xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-20 w-20 rounded-full bg-white/10" />
          <CardContent className="pt-6 relative">
            <Activity className="h-5 w-5 text-blue-100 mb-2" />
            <p className="text-sm text-blue-100">Awaiting Review</p>
            <p className="text-3xl font-bold">{stats.categorized}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-20 w-20 rounded-full bg-white/10" />
          <CardContent className="pt-6 relative">
            <CheckCircle2 className="h-5 w-5 text-emerald-100 mb-2" />
            <p className="text-sm text-emerald-100">Approved</p>
            <p className="text-3xl font-bold">{stats.approved}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-20 w-20 rounded-full bg-white/10" />
          <CardContent className="pt-6 relative">
            <XCircle className="h-5 w-5 text-orange-100 mb-2" />
            <p className="text-sm text-orange-100">Overridden</p>
            <p className="text-3xl font-bold">{stats.overridden}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-20 w-20 rounded-full bg-white/10" />
          <CardContent className="pt-6 relative">
            <CheckCircle2 className="h-5 w-5 text-violet-100 mb-2" />
            <p className="text-sm text-violet-100">Processed</p>
            <p className="text-3xl font-bold">{stats.processed}</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Accuracy & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="h-32 w-32 -rotate-90 transform">
                  <circle
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r="52"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className="text-emerald-500"
                    strokeWidth="12"
                    strokeDasharray={`${stats.accuracy_rate * 3.27} 327`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="52"
                    cx="64"
                    cy="64"
                  />
                </svg>
                <span className="absolute text-3xl font-bold text-slate-900 dark:text-white">
                  {stats.accuracy_rate.toFixed(0)}%
                </span>
              </div>
              <div className="space-y-3 flex-1">
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
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500">
                    {stats.total_reviewed > 0 ? (
                      <>AI correctly categorized {stats.approved} out of {stats.total_reviewed} reviewed faxes</>
                    ) : (
                      <>No faxes reviewed yet</>
                    )}
                  </p>
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
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Today</span>
                    <p className="text-xs text-slate-500">Faxes processed</p>
                  </div>
                </div>
                <span className="text-3xl font-bold text-emerald-600">{stats.processed_today}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">This Week</span>
                    <p className="text-xs text-slate-500">Faxes processed</p>
                  </div>
                </div>
                <span className="text-3xl font-bold text-blue-600">{stats.processed_this_week}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <BarChart3 className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Category Distribution</CardTitle>
                <CardDescription>Breakdown of faxes by category</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm font-semibold">
              {Object.keys(stats.category_counts).length} Categories
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.category_counts).length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(stats.category_counts)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => {
                  const percentage = ((count / stats.total_faxes) * 100).toFixed(1);
                  const gradientClass = categoryColors[category] || "from-slate-500 to-slate-600";
                  
                  return (
                    <div key={category} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:shadow-md transition-shadow">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${gradientClass} text-white flex-shrink-0 shadow-md`}>
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {categoryLabels[category] || category}
                          </span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-2">
                            {count}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500 w-10 text-right">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
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
    </div>
  );
}
