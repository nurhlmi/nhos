import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Button asChild variant="outline" size="sm"><Link href="/">Back to overview</Link></Button>
    </div>
  );
}
