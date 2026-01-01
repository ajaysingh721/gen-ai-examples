"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  FileText,
  History,
  TrendingUp,
  Users,
  Activity,
  Upload,
  BarChart3,
  Sparkles,
  ArrowRight,
  Clock,
  Inbox,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QueueSummary {
  pending_review: number;
  urgent_count: number;
  today_received: number;
  today_processed: number;
}

export default function HomePage() {
  const { data: session } = useSession();
  const [faxSummary, setFaxSummary] = useState<QueueSummary | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/faxes/summary")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setFaxSummary(data))
      .catch(() => {});
  }, []);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-in zoom-in duration-700">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-purple-900 dark:from-slate-100 dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
              Welcome back, {session?.user?.name || "Doctor"}!
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Your AI-powered medical document analysis platform
            </p>
          </div>
        </div>
      </div>

      {/* Fax Queue Alert */}
      {faxSummary && faxSummary.pending_review > 0 && (
        <Card className="border-2 border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 shadow-lg hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 shadow-md">
                  <Inbox className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-blue-900 dark:text-blue-100">Fax Queue Needs Attention</CardTitle>
              </div>
              {faxSummary.urgent_count > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1 px-3 py-1 shadow-md animate-pulse">
                  <AlertTriangle className="h-4 w-4" />
                  {faxSummary.urgent_count} Urgent
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-base text-blue-800 dark:text-blue-200 mb-4">
              You have <strong className="font-bold">{faxSummary.pending_review}</strong> faxes awaiting review.
            </p>
            <Link href="/faxes">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                Review Fax Queue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions - Primary Focus */}
      <div className="space-y-5">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/faxes" className="block group">
            <Card className="h-full border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 hover:shadow-2xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-red-50/80 via-white to-red-50/40 dark:from-red-950/30 dark:via-slate-900 dark:to-red-950/20 hover-lift">
              <CardHeader className="space-y-4 pb-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-red-500/30">
                    <Inbox className="h-8 w-8 text-white" />
                  </div>
                  {faxSummary && faxSummary.pending_review > 0 && (
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold shadow-lg animate-bounce">
                      {faxSummary.pending_review}
                    </div>
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl mb-2 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    Fax Queue
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                    Review and categorize incoming faxes with AI assistance
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-red-600 dark:text-red-400 font-bold group-hover:gap-2 transition-all">
                  Review Now
                  <ArrowRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/upload" className="block group">
            <Card className="h-full border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-2xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20 hover-lift">
              <CardHeader className="space-y-4 pb-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-blue-500/30">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl mb-2 text-slate-900 dark:text-slate-100">Upload & Analyze</CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                    Upload PDF or TIFF documents and get instant AI-powered analysis
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold group-hover:gap-2 transition-all">
                  Get Started
                  <ArrowRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/documents" className="block group">
            <Card className="h-full border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:shadow-2xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-green-50/80 via-white to-green-50/40 dark:from-green-950/30 dark:via-slate-900 dark:to-green-950/20 hover-lift">
              <CardHeader className="space-y-4 pb-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-green-500/30">
                  <History className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl mb-2 text-slate-900 dark:text-slate-100">Document History</CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                    Browse previously analyzed documents and their summaries
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-600 dark:text-green-400 font-bold group-hover:gap-2 transition-all">
                  View All
                  <ArrowRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/faxes/settings" className="block group">
            <Card className="h-full border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-2xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-50/80 via-white to-purple-50/40 dark:from-purple-950/30 dark:via-slate-900 dark:to-purple-950/20 hover-lift">
              <CardHeader className="space-y-4 pb-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-purple-500/30">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl mb-2 text-slate-900 dark:text-slate-100">
                    Analytics & Settings
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                    View AI accuracy metrics and configure the fax system
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-purple-600 dark:text-purple-400 font-bold group-hover:gap-2 transition-all">
                  View Stats
                  <ArrowRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="space-y-5">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Overview Statistics</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-400 dark:hover:border-blue-600 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Documents</CardTitle>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900 dark:text-slate-100">1,247</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1">
              <span className="text-green-600 dark:text-green-400 font-bold">↑ 12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-green-400 dark:hover:border-green-600 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">AI Analyses</CardTitle>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900 dark:text-slate-100">892</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1">
              <span className="text-green-600 dark:text-green-400 font-bold">↑ 8%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-400 dark:hover:border-purple-600 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Avg Processing Time</CardTitle>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900 dark:text-slate-100">2.3s</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1">
              <span className="text-green-600 dark:text-green-400 font-bold">↓ 15%</span> faster than before
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-400 dark:hover:border-orange-600 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active Users</CardTitle>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Users className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900 dark:text-slate-100">24</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Currently online
            </p>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Recent Activity</h2>
          <Link href="/documents">
            <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
        <Card className="border-2 shadow-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">Patient report analyzed</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Medical examination results successfully processed</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3" />
                    2 minutes ago
                  </p>
                </div>
                <Badge className="bg-green-500 text-white dark:bg-green-600 flex-shrink-0 shadow-md">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-green-50 dark:hover:bg-green-950/30 transition-all duration-200 border border-transparent hover:border-green-200 dark:hover:border-green-800">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">Medical scan uploaded</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">TIFF document ready for AI analysis</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3" />
                    15 minutes ago
                  </p>
                </div>
                <Badge className="bg-blue-500 text-white dark:bg-blue-600 flex-shrink-0 shadow-md animate-pulse">
                  Processing
                </Badge>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-200 border border-transparent hover:border-purple-200 dark:hover:border-purple-800">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">AI summary generated</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Diagnostic report summary created</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3" />
                    1 hour ago
                  </p>
                </div>
                <Badge className="bg-green-500 text-white dark:bg-green-600 flex-shrink-0 shadow-md">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
