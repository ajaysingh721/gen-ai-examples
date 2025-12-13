import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </div>
  );
}
