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
    <div className="w-full space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome back, {session?.user?.name || "Doctor"}!
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
              Your AI-powered medical document analysis platform
            </p>
          </div>
        </div>
      </div>

      {/* Fax Queue Alert */}
      {faxSummary && faxSummary.pending_review > 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg text-blue-800">Fax Queue Needs Attention</CardTitle>
              </div>
              {faxSummary.urgent_count > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {faxSummary.urgent_count} Urgent
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-blue-700 mb-3">
              You have <strong>{faxSummary.pending_review}</strong> faxes awaiting review.
            </p>
            <Link href="/faxes">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Review Fax Queue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions - Primary Focus */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/faxes" className="block group">
            <Card className="h-full border-2 hover:border-red-500 hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
              <CardHeader className="space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Inbox className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl mb-2 flex items-center gap-2">
                    Fax Queue
                    {faxSummary && faxSummary.pending_review > 0 && (
                      <Badge variant="destructive" className="text-xs">{faxSummary.pending_review}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-base">
                    Review and categorize incoming faxes with AI assistance
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-red-600 dark:text-red-400 font-semibold group-hover:gap-2 transition-all">
                  Review Now
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/upload" className="block group">
            <Card className="h-full border-2 hover:border-blue-500 hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
              <CardHeader className="space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Upload className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl mb-2">Upload & Analyze</CardTitle>
                  <CardDescription className="text-base">
                    Upload PDF or TIFF documents and get instant AI-powered analysis
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-2 transition-all">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/documents" className="block group">
            <Card className="h-full border-2 hover:border-green-500 hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
              <CardHeader className="space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <History className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl mb-2">Document History</CardTitle>
                  <CardDescription className="text-base">
                    Browse previously analyzed documents and their summaries
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-600 dark:text-green-400 font-semibold group-hover:gap-2 transition-all">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/faxes/settings" className="block group">
            <Card className="h-full border-2 hover:border-purple-500 hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
              <CardHeader className="space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl mb-2">
                    Analytics & Settings
                  </CardTitle>
                  <CardDescription className="text-base">
                    View AI accuracy metrics and configure the fax system
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold group-hover:gap-2 transition-all">
                  View Stats
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Overview Statistics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-semibold">↑ 12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Analyses</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">892</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-semibold">↑ 8%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2.3s</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-semibold">↓ 15%</span> faster than before
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently online
            </p>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
          <Link href="/documents">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-sm font-semibold">Patient report analyzed</p>
                  <p className="text-xs text-muted-foreground">Medical examination results successfully processed</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    2 minutes ago
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
                  Completed
                </Badge>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                  <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-sm font-semibold">Medical scan uploaded</p>
                  <p className="text-xs text-muted-foreground">TIFF document ready for AI analysis</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    15 minutes ago
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex-shrink-0">
                  Processing
                </Badge>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-sm font-semibold">AI summary generated</p>
                  <p className="text-xs text-muted-foreground">Diagnostic report summary created</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    1 hour ago
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
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
