import React, { useState } from "react";
import {
  Star,
  Clock,
  Calendar,
  Film,
  ArrowLeft,
  Send,
  CheckCircle2,
  Copy,
  Share2,
  CornerDownRight,
  MessageCircle,
  Download,
} from "lucide-react";
import { Movie } from "../types";

interface MovieDetailProps {
  movie: Movie;
  allMovies: Movie[];
  onBack: () => void;
  onMovieSelect: (slug: string) => void;
  onRefreshMovie: (id: string) => void;
}

export default function MovieDetail({
  movie,
  allMovies,
  onBack,
  onMovieSelect,
  onRefreshMovie,
}: MovieDetailProps) {
  const [userName, setUserName] = useState("");
  const [userRating, setUserRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Helper to convert standard youtube urls into embed compatible iframe links
  const getEmbedVideoUrl = (rawUrl: string) => {
    if (!rawUrl) return "";
    let clean = rawUrl.trim();
    // YouTube watch links? e.g. youtube.com/watch?v=XYZ
    if (clean.includes("youtube.com/watch")) {
      const match = clean.match(/[?&]v=([^&#]+)/);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0`;
      }
    }
    // YouTube short links? e.g. youtu.be/XYZ
    if (clean.includes("youtu.be/")) {
      const parts = clean.split("youtu.be/");
      if (parts[1]) {
        const id = parts[1].split(/[?#]/)[0];
        return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
      }
    }
    // Already an embed links? Just make sure it starts correctly
    if (clean.includes("embed")) {
      return clean;
    }
    return clean;
  };

  const embedUrl = getEmbedVideoUrl(movie.videoUrl);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !reviewText.trim()) {
      setReviewMessage("Please complete both username and comment content.");
      return;
    }

    setSubmitting(true);
    setReviewMessage("");

    try {
      const res = await fetch(`/api/movies/${movie.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: userName,
          rating: Number(userRating),
          content: reviewText,
        }),
      });

      if (!res.ok) {
        throw new Error("Could not upload review data.");
      }

      setUserName("");
      setReviewText("");
      setUserRating(5);
      setReviewMessage("Review published successfully!");

      // Refresh movie detail parent state
      onRefreshMovie(movie.id);
    } catch (err) {
      console.error(err);
      setReviewMessage("Encountered error uploading review.");
    } finally {
      setSubmitting(false);
    }
  };

  // Find related movies (same category or similar)
  const relatedMovies = allMovies
    .filter(
      (m) =>
        m.id !== movie.id &&
        (m.category === movie.category || m.year === movie.year),
    )
    .slice(0, 3);

  // Copy share URLs
  const handleCopyLink = () => {
    const movieUrl = `${window.location.origin}/movie/${movie.slug}`;
    navigator.clipboard.writeText(movieUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-8 text-left animate-fade-in">
      {/* Back navigation CTA */}
      <button
        onClick={onBack}
        className="group px-4 py-2 rounded-2xl border border-zinc-250 dark:border-white/10 bg-white/40 dark:bg-black/35 text-sm font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 backdrop-blur-xl shadow hover:bg-white/80 dark:hover:bg-white/5 cursor-pointer transition-all flex items-center gap-2 active:scale-95 self-start"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Explore Movies
      </button>

      {/* Main Grid View */}
      <div className="flex flex-col lg:grid border-0 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Cinema Stage Left Block (Col-span 2) */}
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
          {/* Header information */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="bg-blue-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded uppercase tracking-widest leading-none">
                {movie.category}
              </span>
              <span className="text-zinc-400 text-xs font-mono">
                {movie.year}
              </span>
              {movie.duration && (
                <span className="text-zinc-400 text-xs font-mono">
                  • {movie.duration}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
              {movie.title}
            </h1>
          </div>

          {/* Premium Video/Embed Cinema Player Stage */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
              <Film className="w-5 h-5 text-blue-550 dark:text-blue-400" />
              Official Trailer Showcase
            </h2>
            <div className="relative aspect-video rounded-xl md:rounded-3xl overflow-hidden border border-zinc-200 dark:border-white/5 bg-zinc-950 shadow-2xl group">
              {embedUrl ? (
                <iframe
                  id="movie-primary-player"
                  src={embedUrl}
                  title={`${movie.title} Trailer Player`}
                  className="w-full h-full border-0 absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 gap-3 text-zinc-500">
                  <Film className="w-12 h-12 text-zinc-600 animate-pulse" />
                  <p className="text-sm font-semibold">
                    Trailers are loading...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Share Deck (For OG + Twitter test confirmation) */}
          <div className="bg-white/40 dark:bg-black/35 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2.5 text-zinc-650 dark:text-white/60 text-xs">
              <Share2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="font-medium">
                SEO share link loaded with Open Graph & Twitter Cards.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                id="btn-copy-og-link"
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-700 text-zinc-750 dark:text-zinc-100 flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SEO URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Featured Download Section */}
          {movie.downloadUrl && (
            <div className="pt-2 pb-2">
              <a
                href={movie.downloadUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="w-full py-5 text-base md:text-lg font-black uppercase tracking-widest rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white flex items-center justify-center gap-3 transition-all outline-none cursor-pointer shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0 active:scale-95 border border-emerald-400/30"
              >
                <Download className="w-7 h-7" />
                <span>Download Full Movie</span>
              </a>
            </div>
          )}

          {/* Description & Specifications Panel */}
          <div className="bg-white/40 dark:bg-black/35 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 p-6 md:p-8 rounded-[32px] shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight mb-3">
                Synopsis
              </h2>
              <p className="text-zinc-700 dark:text-white/70 text-sm md:text-base leading-relaxed font-light">
                {movie.description}
              </p>
            </div>

            {/* Structured Specifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-zinc-150/40 dark:border-zinc-800/40">
              {movie.director && (
                <div className="flex items-start gap-2.5">
                  <CornerDownRight className="w-4 h-4 text-blue-500 mt-1" />
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-white/40 uppercase tracking-widest font-mono">
                      Director
                    </span>
                    <p className="text-zinc-800 dark:text-white/80 text-sm font-semibold">
                      {movie.director}
                    </p>
                  </div>
                </div>
              )}

              {movie.duration && (
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-blue-500 mt-1" />
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-white/40 uppercase tracking-widest font-mono">
                      Running Time
                    </span>
                    <p className="text-zinc-800 dark:text-zinc-200 text-sm font-semibold">
                      {movie.duration}
                    </p>
                  </div>
                </div>
              )}

              {movie.cast && movie.cast.length > 0 && (
                <div className="flex items-start gap-2.5 md:col-span-2">
                  <CornerDownRight className="w-4 h-4 text-blue-500 mt-1" />
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-white/40 uppercase tracking-widest font-mono">
                      Starring Cast
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {movie.cast.map((actor) => (
                        <span
                          key={actor}
                          className="text-xs bg-zinc-100 dark:bg-white/5 text-zinc-750 dark:text-white/80 px-2.5 py-1 rounded-lg border border-zinc-200/40 dark:border-white/10"
                        >
                          {actor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {movie.keywords && movie.keywords.length > 0 && (
                <div className="flex items-start gap-2.5 md:col-span-2">
                  <CornerDownRight className="w-4 h-4 text-blue-500 mt-1" />
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-white/40 uppercase tracking-widest font-mono">
                      SEO Index tags / Keywords
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {movie.keywords.map((k) => (
                        <span
                          key={k}
                          className="text-xs font-mono text-zinc-500 dark:text-blue-400"
                        >
                          #{k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Reviews and Log lists */}
          <div className="bg-white/40 dark:bg-black/35 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 p-6 md:p-8 rounded-[32px] shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-550 dark:text-blue-400" />
              User Reviews & Ratings
              <span className="text-xs font-normal text-zinc-400 dark:text-white/40 font-mono">
                ({movie.reviews?.length || 0} reviews)
              </span>
            </h2>

            {/* List */}
            {!movie.reviews || movie.reviews.length === 0 ? (
              <div className="text-center py-8 bg-zinc-100/50 dark:bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-250 dark:border-zinc-800 p-6">
                <p className="text-zinc-500 text-sm">
                  No reviews posted yet. Be the first to catalog your feedback!
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                {movie.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850/80 space-y-2 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {rev.user}
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < rev.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-zinc-300 dark:text-zinc-700"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-300 text-xs md:text-sm leading-relaxed font-light">
                      {rev.content}
                    </p>
                    <span className="text-[10px] text-zinc-400 block font-mono">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Submit review Form */}
            <form
              onSubmit={handleReviewSubmit}
              className="space-y-4 pt-6 border-t border-zinc-150/45 dark:border-white/10"
            >
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider font-mono">
                Post Your Review
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-450 dark:text-white/40 mb-1.5 block">
                    Reviewer Username
                  </label>
                  <input
                    id="review-user"
                    type="text"
                    required
                    maxLength={30}
                    placeholder="e.g., Cinecritic99"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-450 dark:text-white/40 mb-1.5 block">
                    Your Score / Rating
                  </label>
                  <div className="flex gap-1 items-center h-10">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setUserRating(i + 1)}
                        className="p-1 cursor-pointer transition-all active:scale-90"
                      >
                        <Star
                          className={`w-6 h-6 hover:scale-110 transition-transform ${
                            i < userRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-350 dark:text-zinc-650"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-zinc-550 dark:text-white/40 ml-2 font-mono">
                      ({userRating}/5)
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-450 dark:text-white/40 mb-1.5 block">
                  Review Comments
                </label>
                <textarea
                  id="review-comment"
                  rows={3}
                  required
                  placeholder="Share details of what you liked or disliked about this film post..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-white leading-relaxed"
                />
              </div>

              {reviewMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    reviewMessage.includes("successfully")
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {reviewMessage}
                </div>
              )}

              <button
                id="btn-submit-review"
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {submitting ? "Publishing Review..." : "Publish Review"}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Cinematic Side Specifications Deck (Col-span 1) */}
        <div className="order-1 lg:order-2 space-y-6">
          {/* Movie Poster iOS-style rounded box */}
          <div className="bg-white/40 dark:bg-black/35 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row lg:flex-col items-center gap-6">
            <div className="w-40 sm:w-48 lg:w-full overflow-hidden rounded-2xl shadow-lg border border-white/10 aspect-[2/3] relative flex-shrink-0">
              <img
                src={movie.poster}
                alt={`${movie.title} poster cover`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Live aggregated scoring stats */}
            <div className="w-full flex-grow p-4 rounded-2xl bg-zinc-100/50 dark:bg-zinc-950/50 text-center space-y-2 border border-zinc-200/50 dark:border-zinc-850 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                CineGlass Rating
              </span>
              <div className="flex items-center justify-center gap-1">
                <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
                  {movie.rating.toFixed(1)}
                </span>
                <span className="text-xs text-zinc-400">/ 5.0</span>
              </div>
              <p className="text-[10px] text-zinc-500">
                {movie.votes} cumulative verified user reactions
              </p>
            </div>
          </div>

          {/* Related Collections Slider */}
          <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 p-6 rounded-3xl shadow-xl text-left space-y-4">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider font-mono">
              Related Movies
            </h3>

            {relatedMovies.length === 0 ? (
              <p className="text-xs text-zinc-500 font-light">
                No other additions inside {movie.category} yet.
              </p>
            ) : (
              <div className="space-y-4">
                {relatedMovies.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onMovieSelect(rel.slug)}
                    className="flex gap-3 group items-center cursor-pointer p-2 rounded-xl hover:bg-zinc-100/50 dark:hover:bg-zinc-800/20 transition-all border border-transparent hover:border-zinc-200/40 dark:hover:border-zinc-850"
                  >
                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 border border-white/10 aspect-[2/3] relative">
                      <img
                        src={rel.poster}
                        alt={rel.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {rel.title}
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {rel.category} • {rel.year}
                      </p>
                      <div className="flex items-center gap-1 mt-1 font-mono text-[11px] text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{rel.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
