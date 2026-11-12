"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/http";
import type { ApiResponse } from "@/types/api";
import type { MovieDetail, MovieList, MovieListData } from "@/features/movies/types";

export const movieKeys = {
  list: (list: MovieList) => ["movies", "list", list] as const,
  detail: (id: number) => ["movies", "detail", id] as const,
};

export function useMovieList(list: MovieList) {
  return useQuery({
    queryKey: movieKeys.list(list),
    queryFn: () => fetchJson<ApiResponse<MovieListData>>(`/api/movies?${new URLSearchParams({ list })}`),
    staleTime: 60 * 60 * 1000,
  });
}

export function useMovieDetail(id: number | null) {
  return useQuery({
    queryKey: movieKeys.detail(id ?? 0),
    queryFn: () => fetchJson<ApiResponse<MovieDetail>>(`/api/movies/${id}`),
    enabled: id !== null,
    staleTime: 6 * 60 * 60 * 1000,
  });
}
