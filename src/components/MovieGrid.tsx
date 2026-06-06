import React, { useState, useEffect } from "react";
import { Star, MessageSquare, ArrowUpDown, Flame, Search, Grid, Eye, Bookmark, BookmarkCheck, Download } from "lucide-react";
import { Movie } from "../types";

interface MovieGridProps {
  onMovieSelect: (slug: string) => void;
  movies: Movie[];
  loading: boolean;
  filterGenre: string;
  setFilterGenre: (genre: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  watchlist: string[];
  toggleWatchlist: (id: string, e: React.MouseEvent) => void;
}

export default function MovieGrid({
  onMovieSelect,
  movies,
  loading,
  filterGenre,
  setFilterGenre,
  searchQuery,
  setSearchQuery,
  watchlist,
  toggleWatchlist,
}: MovieGridProps) {
  const [filterYear, setFilterYear] = useState<string>("All");
  const [filterRating, setFilterRating] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Local state options gathered dynamically
  const genres = ["All", "Sci-Fi", "Action", "Drama", "Thriller"];
  const years = ["All", "2026", "2025", "2024", "2023"];
  const ratings = ["All", "4.8+", "4.5+", "4.0+"];

  // Filter movies client-side to ensure instant responsive action, 
  // since the parent fetched the query base
  let displayedMovies = [...movies];

  if (filterYear !== "All") {
    displayedMovies = displayedMovies.filter((m) => m.year === Number(filterYear));
  }

  if (filterRating !== "All") {
    const minRating = parseFloat(filterRating.replace("+", ""));
    displayedMovies = displayedMovies.filter((m) => m.rating >= minRating);
  }

  // Sorting
  displayedMovies.sort((a, b) => {
    if (sortBy === "rating") {
      return b.rating - a.rating;
    }
    if (sortBy === "votes") {
      return b.votes - a.votes;
    }
    if (sortBy === "alphabetical") {
      return a.title.localeCompare(b.title);
    }
    // Newest default
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <div className="w-full space-y-8 text-left">
      
      {/* Search & Filter IOS Panel */}
      <div 
        id="ios-filter-panel"
        className="w-full bg-white/40 dark:bg-black/35 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 p-5 md:p-6 rounded-[32px] shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] space-y-4"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
            <input
              id="search-input"
              type="text"
              placeholder="Search movie title, director, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-5 py-3 rounded-2xl bg-zinc-100/80 dark:bg-zinc-950/60 border border-zinc-200/50 dark:border-zinc-800/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white transition-all shadow-inner placeholder-zinc-400 dark:placeholder-zinc-550"
            />
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <ArrowUpDown className="w-4 h-4 text-zinc-400" />
            <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">Sort by</span>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-3 font-semibold text-xs rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="newest">Latest Releases</option>
              <option value="rating">Highest Ratings</option>
              <option value="votes">Popularity (Votes)</option>
              <option value="alphabetical">Title Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Categories, Release Year, and Ratings Toggle Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-zinc-150/40 dark:border-zinc-800/40">
          
          {/* Genre categories scrolling list */}
          <div>
            <label className="text-[11px] font-bold text-zinc-500 dark:text-white/40 uppercase tracking-widest font-mono mb-2 block">
              Genre
            </label>
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setFilterGenre(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filterGenre === g
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg font-bold"
                      : "bg-white/50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200/40 dark:border-white/10 text-zinc-700 dark:text-white/75"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Release Year selection */}
          <div>
            <label className="text-[11px] font-bold text-zinc-500 dark:text-white/40 uppercase tracking-widest font-mono mb-2 block">
              Release Year
            </label>
            <div className="flex flex-wrap gap-1.5">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setFilterYear(y)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    filterYear === y
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg font-bold"
                      : "bg-white/50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200/40 dark:border-white/10 text-zinc-700 dark:text-white/75"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Minimal Rating Selector */}
          <div>
            <label className="text-[11px] font-bold text-zinc-500 dark:text-white/40 uppercase tracking-widest font-mono mb-2 block">
              Average Rating
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ratings.map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRating(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    filterRating === r
                      ? "bg-amber-400 text-zinc-950 font-bold shadow-md"
                      : "bg-white/50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200/40 dark:border-white/10 text-zinc-700 dark:text-white/75"
                  }`}
                >
                  {r !== "All" && <Star className="w-3 h-3 fill-current inline mr-1 -mt-0.5" />}
                  {r}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Grid Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <Grid className="w-5 h-5 text-indigo-500" />
          {filterGenre === "All" ? "All Movie Posts" : `${filterGenre} Collection`}
          <span className="text-xs font-normal text-zinc-500 font-mono">
            ({displayedMovies.length} results)
          </span>
        </h3>
      </div>

      {/* Movies Cards Container */}
      {loading ? (
        <div className="w-full flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-zinc-500">Querying updates...</p>
        </div>
      ) : displayedMovies.length === 0 ? (
        <div className="w-full bg-white/20 dark:bg-zinc-900/20 border border-zinc-200/50 dark:border-zinc-800/60 p-12 text-center rounded-3xl shadow">
          <p className="text-base font-semibold text-zinc-600 dark:text-zinc-300 mb-1">No Movie Posts Match Your Selection</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">Try resetting or updating your search query or look at alternative genre categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {displayedMovies.map((m) => {
            const isWatchlisted = watchlist.includes(m.id);
            return (
              <div
                id={`movie-card-${m.id}`}
                key={m.id}
                onClick={() => onMovieSelect(m.slug)}
                className="group relative cursor-pointer flex flex-col h-full rounded-[24px] border border-zinc-200/50 dark:border-white/10 bg-white/40 dark:bg-black/35 backdrop-blur-xl hover:bg-white/60 dark:hover:bg-white/5 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5"
              >
                {/* Glossy Overlay Reflection Effect */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-10" />

                {/* Poster Box */}
                <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900 flex-shrink-0">
                  <img
                    src={m.poster}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />

                  {/* Badges/Category Overlay */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                    <span className="bg-zinc-950/75 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border border-white/10 backdrop-blur-sm shadow">
                      {m.category}
                    </span>
                    {m.trending && (
                      <span className="bg-rose-600/90 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                        <Flame className="w-3 h-3 fill-current" /> TRENDING
                      </span>
                    )}
                  </div>

                  {/* Watchlist Bookmark Icon Button */}
                  <button
                    onClick={(e) => toggleWatchlist(m.id, e)}
                    className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-white backdrop-blur-md transition-all active:scale-90 cursor-pointer"
                    title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
                  >
                    {isWatchlisted ? (
                      <BookmarkCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <Bookmark className="w-4 h-4 text-white hover:text-indigo-400" />
                    )}
                  </button>

                  {/* Floating Rating overlay on bottom-right of poster */}
                  <div className="absolute bottom-3 right-3 bg-amber-500/90 text-zinc-950 text-xs font-black px-2 py-1 rounded-xl shadow backdrop-blur-sm flex items-center gap-1 z-10">
                    <Star className="w-3.5 h-3.5 fill-zinc-950" />
                    <span>{m.rating.toFixed(1)}</span>
                  </div>

                  {/* Hover Quick Specifications Screen */}
                  <div className="absolute inset-0 bg-zinc-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center z-10 gap-2">
                    <Eye className="w-10 h-10 text-white mb-1 animate-pulse" />
                    <p className="text-white font-bold text-sm leading-tight">{m.title}</p>
                    <p className="text-xs text-zinc-300">{m.year} • {m.duration || "2h"}</p>
                    {m.director && <p className="text-[11px] text-zinc-400">Dir: {m.director}</p>}
                    <span className="mt-2 text-xs font-bold text-indigo-400 px-3 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                      View Post & Trailer
                    </span>
                    {m.downloadUrl && (
                      <a
                        href={m.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="mt-1 text-[11px] font-bold text-white px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" /> Direct Download
                      </a>
                    )}
                  </div>
                </div>

                {/* Info Deck */}
                <div className="p-4 flex flex-col justify-between flex-grow space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-zinc-400 text-[11px] font-semibold font-mono tracking-wider uppercase">
                        RELEASED {m.year}
                      </span>
                      {m.reviews && m.reviews.length > 0 && (
                        <span className="text-zinc-550 dark:text-zinc-400 text-[10px] font-semibold font-mono flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {m.reviews.length} {m.reviews.length === 1 ? "review" : "reviews"}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-base text-zinc-900 dark:text-white leading-tight line-clamp-1 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                      {m.title}
                    </h4>
                    <p className="text-zinc-500 dark:text-white/60 text-xs line-clamp-2 mt-1.5 leading-relaxed font-light">
                      {m.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
