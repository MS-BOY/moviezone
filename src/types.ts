export interface Review {
  id: string;
  user: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string;
  poster: string;
  backdrop: string;
  videoUrl: string;
  downloadUrl?: string;
  category: string;
  year: number;
  rating: number;
  votes: number;
  director?: string;
  cast?: string[];
  duration?: string;
  keywords?: string[];
  reviews?: Review[];
  featured?: boolean;
  trending?: boolean;
  createdAt: string;
  seoTitle?: string;
  seoDescription?: string;
}

export type ActiveRoute = "home" | "movie-detail" | "admin";

export interface RouteState {
  route: ActiveRoute;
  params: {
    slug?: string;
  };
}
