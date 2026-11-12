import { QueryClient } from "@tanstack/react-query";
import { HttpError } from "@/lib/http";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        // Controlled retry: never retry client errors (4xx) except 429,
        // at most two retries with exponential backoff otherwise.
        retry: (failureCount, error) => {
          if (error instanceof HttpError && error.status >= 400 && error.status < 500 && error.status !== 429) {
            return false;
          }
          return failureCount < (error instanceof HttpError && error.status === 429 ? 3 : 2);
        },
        retryDelay: (attempt, error) => {
          if (error instanceof HttpError && error.retryAfterSeconds) {
            return Math.min(error.retryAfterSeconds * 1000 + 250, 30_000);
          }
          return Math.min(1000 * 2 ** attempt, 8000);
        },
      },
    },
  });
}
