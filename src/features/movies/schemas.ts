import { z } from "zod";
import { MOVIE_LISTS } from "@/features/movies/types";

export const movieListQuerySchema = z.object({
  list: z.enum(MOVIE_LISTS, { error: "List must be now_playing or upcoming" }),
});

export const movieIdSchema = z.object({
  id: z.coerce.number({ error: "Movie id must be a number" }).int().positive("Movie id must be positive"),
});
