import { apiRoute } from "@/lib/api-route";
import { movieIdSchema } from "@/features/movies/schemas";
import { getMovieDetail } from "@/services/tmdb";

export const GET = apiRoute<{ id: string }>(async (_request, { params }) => {
  const { id } = movieIdSchema.parse(params);
  return getMovieDetail(id);
});
