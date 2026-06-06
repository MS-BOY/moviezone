import React, { useState, useEffect } from "react";
import { Movie, ActiveRoute, RouteState } from "./types";
import Header from "./components/Header";
import BannerSlider from "./components/BannerSlider";
import MovieGrid from "./components/MovieGrid";
import MovieDetail from "./components/MovieDetail";
import AdminPanel from "./components/AdminPanel";
import { Film, Star, Sparkles, Bookmark, Heart, Grid, AlertCircle, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Hook to parse current browser URL paths dynamically for genuine client-side routing
const parseLocation = (): RouteState => {
  const path = window.location.pathname;
  if (path.startsWith("/movie/")) {
    const slug = path.replace("/movie/", "");
    return { route: "movie-detail", params: { slug } };
  }
  if (path === "/admin") {
    return { route: "admin", params: {} };
  }
  return { route: "home", params: {} };
};

export default function App() {
  const [routeState, setRouteState] = useState<RouteState>(parseLocation());
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(true);

  // Search & Filter state on Home explore deck
  const [filterGenre, setFilterGenre] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Listen to back/forward browser navigation actions
  useEffect(() => {
    const handlePopState = () => {
      setRouteState(parseLocation());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync route and path
  const navigateTo = (route: ActiveRoute, slug?: string) => {
    let path = "/";
    if (route === "movie-detail" && slug) {
      path = `/movie/${slug}`;
    } else if (route === "admin") {
      path = "/admin";
    }
    window.history.pushState({}, "", path);
    setRouteState({ route, params: { slug } });
    
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fetch updated list of movie posts from Express endpoint
  const fetchMovies = async () => {
    setLoading(true);
    try {
      const url = `/api/movies?genre=${filterGenre}&search=${searchQuery}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMovies(data);
      }
    } catch (err) {
      console.error("Error fetching movies from server:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load movies list on init, and when search queries update
  useEffect(() => {
    fetchMovies();
  }, [filterGenre, searchQuery]);

  // Sync dark/light mode class dynamically
  useEffect(() => {
    // Persist user selection
    const saved = localStorage.getItem("cineglass-dark-theme");
    if (saved !== null) {
      setDarkMode(saved === "true");
    } else {
      setDarkMode(true); // default dark
    }

    // Watchlist loading
    const savedWatchlist = localStorage.getItem("cineglass-watchlist");
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
  }, []);

  useEffect(() => {
    // Manage class toggle
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("cineglass-dark-theme", String(darkMode));
  }, [darkMode]);

  const toggleWatchlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // preserve outer card selection
    let updated = [...watchlist];
    if (updated.includes(id)) {
      updated = updated.filter((item) => item !== id);
    } else {
      updated.push(id);
    }
    setWatchlist(updated);
    localStorage.setItem("cineglass-watchlist", JSON.stringify(updated));
  };

  // Callback to refresh standard movie specifications
  const handleRefreshMovieDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/movies/${id}`);
      if (res.ok) {
        const updatedMovie = await res.json();
        // Update local list
        setMovies((prev) => prev.map((m) => (m.id === id ? updatedMovie : m)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Extract variables
  const featuredMovies = movies.filter((m) => m.featured);
  const trendingMovies = movies.filter((m) => m.trending);
  const watchlistedMovies = movies.filter((m) => watchlist.includes(m.id));

  // Determine active displayed movie under detail route
  let activeSelectedMovie: Movie | null = null;
  if (routeState.route === "movie-detail" && routeState.params.slug) {
    activeSelectedMovie = movies.find((m) => m.slug === routeState.params.slug) || null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-150 transition-colors duration-500 pb-20 flex flex-col items-center">
      
      {/* Decorative iOS-Style Dynamic Ambient Blur Nodes */}
      <div className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/10 dark:bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Floating Header */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onNavigate={navigateTo}
        currentRoute={routeState.route}
      />

      {/* Main Container */}
      <main className="w-full px-4 md:px-8 max-w-7xl mx-auto mt-8 flex-grow z-10 space-y-12">
        <AnimatePresence mode="wait">
          {routeState.route === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-12"
            >
              {/* IMAX Featured Slider */}
              {featuredMovies.length > 0 && (
                <BannerSlider
                  movies={featuredMovies}
                  onMovieSelect={(slug) => navigateTo("movie-detail", slug)}
                />
              )}

              {/* Personal Watchlist Collapsible iOS Dashboard Tray */}
              {watchlistedMovies.length > 0 && (
                <div 
                  id="watchlist-panel"
                  className="w-full p-6 bg-white/35 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl shadow-xl text-left"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Bookmark className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                    <h3 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-white">Your Streaming Watchlist</h3>
                    <span className="text-xs text-zinc-450 font-mono">({watchlistedMovies.length} movies saved)</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {watchlistedMovies.map((m) => (
                      <div
                        id={`watchlist-item-${m.id}`}
                        key={m.id}
                        onClick={() => navigateTo("movie-detail", m.slug)}
                        className="group cursor-pointer bg-white/20 dark:bg-zinc-950/20 hover:bg-white/40 dark:hover:bg-zinc-900/40 p-2 rounded-2xl border border-zinc-200/30 dark:border-zinc-800/40 flex flex-col space-y-2 transition-all hover:scale-[1.02] relative"
                      >
                        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900">
                          <img
                            src={m.poster}
                            alt={m.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate px-1">{m.title}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main explore deck - search, filter and responsive grid */}
              <MovieGrid
                onMovieSelect={(slug) => navigateTo("movie-detail", slug)}
                movies={movies}
                loading={loading}
                filterGenre={filterGenre}
                setFilterGenre={setFilterGenre}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                watchlist={watchlist}
                toggleWatchlist={toggleWatchlist}
              />
            </motion.div>
          )}

          {routeState.route === "movie-detail" && (
            <motion.div
              key="movie-detail"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              {activeSelectedMovie ? (
                <MovieDetail
                  movie={activeSelectedMovie}
                  allMovies={movies}
                  onBack={() => navigateTo("home")}
                  onMovieSelect={(slug) => navigateTo("movie-detail", slug)}
                  onRefreshMovie={handleRefreshMovieDetail}
                />
              ) : (
                <div className="py-24 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
                    <AlertCircle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Film Specification Loading...</h3>
                    <p className="text-xs text-zinc-450 mt-1">If the movie detail does not load instantly, click exploring catalogs below.</p>
                  </div>
                  <button
                    onClick={() => navigateTo("home")}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow cursor-pointer"
                  >
                    Return to Explore
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {routeState.route === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              <AdminPanel
                onMovieAdded={fetchMovies}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="w-full border-t border-zinc-200/50 dark:border-zinc-900/60 mt-20 pt-8 pb-12 text-center text-xs text-zinc-400 font-light z-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <p className="font-bold text-zinc-700 dark:text-zinc-300">CineGlass Movie Platform</p>
            <p className="text-[10px]">Premium 3D glassmorphic system conforming to high-end mobile interface patterns.</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono">
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="hover:text-indigo-500 transition-colors">Sitemap XML</a>
            <span>•</span>
            <span>Structured JSON-LD Schema Enabled</span>
            <span>•</span>
            <span>Responsive 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
