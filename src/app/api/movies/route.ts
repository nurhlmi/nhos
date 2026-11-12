import { apiRoute, searchParamsObject } from "@/lib/api-route";
import { movieListQuerySchema } from "@/features/movies/schemas";
import { getMovieList } from "@/services/tmdb";

export const GET = apiRoute(async (request) => {
  const { list } = movieListQuerySchema.parse(searchParamsObject(request));
  return getMovieList(list);
});
