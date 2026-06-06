import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Star, Clock, User } from "lucide-react";
import { Movie } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface BannerSliderProps {
  movies: Movie[];
  onMovieSelect: (slug: string) => void;
}

export default function BannerSlider({ movies, onMovieSelect }: BannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // auto rotation
  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [movies]);

  if (movies.length === 0) return null;

  const currentMovie = movies[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/20 dark:border-white/5 bg-zinc-950 shadow-2xl group min-h-[360px] md:min-h-[480px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Backdrop image */}
          <img
            src={currentMovie.backdrop}
            alt={`${currentMovie.title} banner backdrop`}
            className="w-full h-full object-cover brightness-[0.4] scale-100 transition-all duration-[7000ms] group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        </motion.div>
      </AnimatePresence>

      {/* Cinematic Blur Bottom Shield */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/40 pointer-events-none" />

      {/* Slider Controls */}
      {movies.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/30 hover:bg-black/60 border border-white/10 backdrop-blur-md flex items-center justify-center text-white cursor-pointer transition-all active:scale-90 opacity-0 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/30 hover:bg-black/60 border border-white/10 backdrop-blur-md flex items-center justify-center text-white cursor-pointer transition-all active:scale-90 opacity-0 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Film Poster Detail Overlay (iPhone Rounded Glass Card Design) */}
      <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8 p-6 md:p-8 bg-zinc-550/15 dark:bg-black/35 backdrop-blur-2xl rounded-[32px] border border-zinc-200/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col md:flex-row gap-6 items-center md:items-end z-10">
        
        {/* Poster - hidden on tiny mobile, visible on medium+ */}
        <div className="hidden md:block w-32 overflow-hidden rounded-2xl border border-white/20 shadow-xl flex-shrink-0 animate-fade-in relative aspect-[2/3]">
          <span className="absolute top-2 left-2 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-sm z-10 shadow">
            Featured
          </span>
          <img
            src={currentMovie.poster}
            alt={currentMovie.title}
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        </div>

        {/* Content Details */}
        <div className="flex-grow text-left">
          {/* Badge & Year */}
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase shadow">
              {currentMovie.category}
            </span>
            <span className="text-zinc-200 dark:text-white/60 text-xs font-mono">
              • {currentMovie.year}
            </span>
            {currentMovie.duration && (
              <span className="text-zinc-200 dark:text-white/60 text-xs font-mono flex items-center gap-1 ml-1">
                <Clock className="w-3.5 h-3.5 text-zinc-300 dark:text-white/40" /> {currentMovie.duration}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-display font-bold text-white tracking-tight mb-3 drop-shadow-md">
            {currentMovie.title}
          </h2>

          {/* Description */}
          <p className="text-zinc-200 dark:text-white/70 text-xs md:text-sm font-normal max-w-2xl line-clamp-2 md:line-clamp-3 mb-5 leading-relaxed drop-shadow">
            {currentMovie.description}
          </p>

          {/* Core metadata: rating & director */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl text-amber-400 text-xs font-semibold backdrop-blur-sm shadow-sm">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{currentMovie.rating.toFixed(1)}</span>
              <span className="text-amber-500/60 font-medium text-[10px]">({currentMovie.votes} votes)</span>
            </div>

            {currentMovie.director && (
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-zinc-300 dark:text-white/80 text-xs backdrop-blur-sm shadow-sm">
                <User className="w-3.5 h-3.5 text-zinc-400 dark:text-white/40" />
                <span>Dir: {currentMovie.director}</span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              id={`play-banner-${currentMovie.id}`}
              onClick={() => onMovieSelect(currentMovie.slug)}
              className="px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-zinc-950 font-bold text-xs tracking-wide shadow-xl flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-zinc-950" />
              Watch Trailer
            </button>
            <button
              onClick={() => onMovieSelect(currentMovie.slug)}
              className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs tracking-wide backdrop-blur-md shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              Film Specifications
            </button>
          </div>
        </div>
      </div>

      {/* Bullet Indicators */}
      {movies.length > 1 && (
        <div className="absolute right-6 bottom-6 flex items-center gap-2 z-10 bg-black/20 border border-white/5 py-1.5 px-3 rounded-full backdrop-blur-md">
          {movies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? "bg-white w-4" : "bg-white/40 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
