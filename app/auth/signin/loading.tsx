import { Skeleton } from '@/components/ui/skeleton';

export default function SignUpLoading() {
  return (
    <div className="mx-auto grid w-[350px] gap-6">
      <div className="grid gap-2 text-center">
        <Skeleton className="h-9 w-3/4 mx-auto" />
        <Skeleton className="h-5 w-full" />
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="mt-4 text-center">
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  );
} 