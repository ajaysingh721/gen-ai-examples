"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Upload, FileText, CheckCircle2, Sparkles, ArrowRight, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  status: string;
  ai_category: FaxCategory | null;
  ai_confidence: number | null;
  ai_reason: string | null;
  summary: string | null;
  is_urgent: boolean;
}

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

const formSchema = z.object({
  file: z
    .custom<File>((value) => value instanceof File, {
      message: "Please select a PDF or TIFF file.",
    })
    .refine(
      (file) => {
        const name = file?.name?.toLowerCase?.() ?? "";
        return name.endsWith(".pdf") || name.endsWith(".tif") || name.endsWith(".tiff");
      },
      { message: "Supported types: PDF, TIFF." },
    ),
});

export default function FaxUploadPage() {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<"uploading" | "analyzing" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FaxRecord | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined as unknown as File,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError(null);
    setResult(null);

    try {
      setLoading(true);
      setUploadProgress(0);
      setUploadPhase("uploading");

      const formData = new FormData();
      formData.append("file", values.file);

      const response: FaxRecord = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:8000/api/v1/faxes/upload");

        xhr.upload.onprogress = (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 50);
            setUploadProgress(percent);
          }
        };

        xhr.upload.onload = () => {
          setUploadPhase("analyzing");
          setUploadProgress(50);
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                setUploadProgress(100);
                resolve(data as FaxRecord);
              } catch {
                reject(new Error("Invalid response from server."));
              }
            } else {
              try {
                const data = JSON.parse(xhr.responseText);
                reject(new Error(data?.detail ?? "Failed to upload fax."));
              } catch {
                reject(new Error("Failed to upload fax."));
              }
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));

        xhr.send(formData);
      });

      setResult(response);
      toast.success("Fax uploaded and categorized!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setUploadPhase(null);
      window.setTimeout(() => setUploadProgress(null), 400);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <header className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
          <Upload className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Upload Fax
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manually upload a fax for AI categorization
          </p>
        </div>
      </header>

      <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <FileText className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Upload Document</CardTitle>
              <CardDescription>
                The AI will analyze content and suggest a category
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Fax Document</FormLabel>
                    <FormControl>
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 transition-all group">
                          <div className="flex flex-col items-center justify-center py-6">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 mb-3 group-hover:scale-110 transition-transform">
                              <Upload className="w-7 h-7 text-violet-600" />
                            </div>
                            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                              <span className="font-semibold text-violet-600">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">PDF or TIFF files (max 50MB)</p>
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.tif,.tiff,application/pdf,image/tiff"
                            onChange={(e) => {
                              const selected = e.target.files?.[0] ?? null;
                              field.onChange(selected);
                              setResult(null);
                              setError(null);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </FormControl>
                    {field.value && (
                      <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/50">
                        <FileText className="h-5 w-5 text-violet-600" />
                        <p className="text-sm text-violet-700 dark:text-violet-300 font-medium">
                          {field.value.name}
                        </p>
                      </div>
                    )}
                    <FormDescription className="text-xs text-slate-500">
                      Supported types: PDF, TIFF. Maximum file size: 50MB.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {uploadProgress !== null && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      {uploadPhase === "analyzing" ? (
                        <>
                          <Sparkles className="h-4 w-4 text-violet-500 animate-pulse" />
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4" />
                          Uploading...
                        </>
                      )}
                    </span>
                    <span className="font-semibold text-violet-600">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading || form.formState.isSubmitting} 
                className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 h-12 text-base"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Upload & Categorize
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 dark:border-emerald-900/50 shadow-xl shadow-emerald-200/50 dark:shadow-emerald-950/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-emerald-800 dark:text-emerald-300">
                  Fax Categorized Successfully!
                </CardTitle>
                <CardDescription className="text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                  {result.filename}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/30 border border-emerald-200/50 dark:border-emerald-800/50">
                <p className="text-xs font-medium text-slate-500 mb-2">AI Category</p>
                {result.ai_category && (
                  <Badge variant="secondary" className={categoryColors[result.ai_category]}>
                    {categoryLabels[result.ai_category]}
                  </Badge>
                )}
              </div>
              <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/30 border border-emerald-200/50 dark:border-emerald-800/50">
                <p className="text-xs font-medium text-slate-500 mb-2">Confidence</p>
                <div className="flex items-center gap-2">
                  {result.ai_confidence != null && (
                    <>
                      <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            result.ai_confidence >= 0.8
                              ? "bg-emerald-500"
                              : result.ai_confidence >= 0.6
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${result.ai_confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {Math.round(result.ai_confidence * 100)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/30 border border-emerald-200/50 dark:border-emerald-800/50">
                <p className="text-xs font-medium text-slate-500 mb-2">Urgent</p>
                <Badge variant="secondary" className={result.is_urgent ? "bg-red-100 text-red-700 border border-red-200" : "bg-slate-100 text-slate-600 border border-slate-200"}>
                  {result.is_urgent ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/30 border border-emerald-200/50 dark:border-emerald-800/50">
                <p className="text-xs font-medium text-slate-500 mb-2">Status</p>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border border-blue-200">
                  Awaiting Review
                </Badge>
              </div>
            </div>

            {result.ai_reason && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">AI Reasoning</p>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">{result.ai_reason}</p>
              </div>
            )}

            {result.summary && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white mb-2">Summary</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{result.summary}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button asChild className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25">
                <Link href="/faxes">
                  Go to Fax Queue
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  form.reset();
                }}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
