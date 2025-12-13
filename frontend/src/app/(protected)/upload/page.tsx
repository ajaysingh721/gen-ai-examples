"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

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

type DocumentType = "discharge_summary" | "inpatient_document" | "census" | "junk";

type DocumentAnalysisResponse = {
  type: DocumentType;
  summary: string;
  text_length: number;
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

export default function UploadSummarizePage() {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<
    "uploading" | "analyzing" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentAnalysisResponse | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined as any,
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

      const response: DocumentAnalysisResponse = await new Promise(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "http://localhost:8000/documents/analyze");

          xhr.upload.onprogress = (progressEvent) => {
            if (progressEvent.lengthComputable) {
              const percent = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100,
              );
              setUploadProgress(percent);
            }
          };

          xhr.upload.onload = () => {
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
                } catch {
                  reject(new Error("Invalid response from server."));
                }
              } else {
                try {
                  const data = JSON.parse(xhr.responseText);
                  reject(
                    new Error(data?.detail ?? "Failed to analyze document."),
                  );
                } catch {
                  reject(new Error("Failed to analyze document."));
                }
              }
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));

          xhr.send(formData);
        },
      );

      setResult(response);
    } catch (err: any) {
      const message = err?.message ?? "Unexpected error";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setUploadPhase(null);
      setUploadProgress(null);
    }
  };

  return (
    <div className="w-full max-w-2xl rounded-xl bg-white shadow-sm border border-zinc-200 p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Upload & summarize
        </h1>
        <p className="text-sm text-zinc-500">
          Upload a PDF or TIFF. The backend will classify the document type and
          generate a concise summary using a local LLM.
        </p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document file</FormLabel>
                <FormControl>
                  <input
                    type="file"
                    accept=".pdf,.tif,.tiff,application/pdf,image/tiff"
                    onChange={(e) => {
                      const selected = e.target.files?.[0] ?? null;
                      field.onChange(selected);
                      setResult(null);
                      setError(null);
                    }}
                    className="block w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Supported types: PDF, TIFF.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <Button
            type="submit"
            disabled={loading || form.formState.isSubmitting}
          >
            {loading ? "Analyzing…" : "Analyze document"}
          </Button>
        </form>
      </Form>

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
    </div>
  );
}
