export const MOVIE_LISTS = ["now_playing", "upcoming"] as const;
export type MovieList = (typeof MOVIE_LISTS)[number];

export type MovieSummary = {
  id: number;
  title: string;
  originalTitle: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  /** Indonesian theatrical release date (YYYY-MM-DD), falling back to the primary release date. */
  releaseDate: string | null;
  /** Indonesian age rating (SU, 13+, 17+, 21+), when TMDB has one. */
  certification: string | null;
  voteAverage: number;
  voteCount: number;
  genres: string[];
  overview: string;
};

export type MovieListData = {
  list: MovieList;
  items: MovieSummary[];
};

export type MovieDetail = MovieSummary & {
  runtime: number | null;
  tagline: string | null;
  directors: string[];
  cast: string[];
  /** YouTube video id of the best trailer (official Trailer before Teaser). */
  trailerKey: string | null;
  tmdbUrl: string;
};
