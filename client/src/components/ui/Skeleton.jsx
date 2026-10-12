export default function Skeleton({ className = 'h-4 w-full', rounded = 'rounded-lg' }) {
  return <div className={`skeleton ${rounded} ${className}`} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3" aria-busy="true" aria-label="Loading…">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12" rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 w-24" rounded="rounded-xl" />
        <Skeleton className="h-8 w-24" rounded="rounded-xl" />
      </div>
    </div>
  );
}
