import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Save,
  HelpCircle,
  Lock,
  Unlock,
  Image,
  Video,
  Monitor,
  Globe,
  Plus,
  AlertCircle,
  UploadCloud,
  Check,
  Trash2,
} from "lucide-react";

interface AdminPanelProps {
  onMovieAdded: () => void;
}

export default function AdminPanel({ onMovieAdded }: AdminPanelProps) {
  const [authorized, setAuthorized] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Sci-Fi");
  const [year, setYear] = useState(new Date().getFullYear());
  const [duration, setDuration] = useState("2h 15m");
  const [director, setDirector] = useState("");
  const [cast, setCast] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  // Images
  const [poster, setPoster] = useState("");
  const [backdrop, setBackdrop] = useState("");

  // Custom SEO / Metadata
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [keywords, setKeywords] = useState("");

  // Cloudinary state
  const [cloudName, setCloudName] = useState(
    (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || "msboy",
  );
  const [uploadPreset] = useState("unsigned_videos");
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);
  const [cloudinaryError, setCloudinaryError] = useState("");

  // UI Status
  const [aiGenerating, setAiGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);
  const [adminMovies, setAdminMovies] = useState<any[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authorized) {
      fetchAdminMovies();
    }
  }, [authorized]);

  const fetchAdminMovies = async () => {
    setLoadingMovies(true);
    try {
      const res = await fetch("/api/movies");
      const list = await res.json();
      setAdminMovies(list);
    } catch(err) {
      console.error(err);
    } finally {
      setLoadingMovies(false);
    }
  };

  const handleDeleteMovie = async (id: string, title: string) => {
    // Replaced window.confirm with direct deletion since native dialogs are blocked in iframes
    setDeletingId(id);
    setFeedback(`Deleting movie "${title}"...`);
    setIsError(false);

    try {
      const res = await fetch(`/api/movies/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setAdminMovies((prev) => prev.filter(m => m.id !== id));
        onMovieAdded(); // refresh grid
        setFeedback(`Movie "${title}" successfully deleted.`);
      } else {
        setFeedback(data.error || "Failed to delete movie");
        setIsError(true);
      }
    } catch(err) {
      console.error(err);
      setFeedback("Failed to delete movie due to network error.");
      setIsError(true);
    } finally {
      setDeletingId(null);
    }
  };

  const uploadToCloudinary = async (
    file: File,
    type: "poster" | "backdrop",
  ) => {
    setCloudinaryError("");
    if (type === "poster") {
      setUploadingPoster(true);
    } else {
      setUploadingBackdrop(true);
    }

    try {
      if (!cloudName) {
        throw new Error(
          "Cloudinary Cloud Name is required. Please fill it below.",
        );
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || "Cloudinary upload failed.");
      }

      const data = await response.json();
      if (data.secure_url) {
        if (type === "poster") {
          setPoster(data.secure_url);
          setFeedback("Poster successfully uploaded to Cloudinary!");
        } else {
          setBackdrop(data.secure_url);
          setFeedback("Backdrop successfully uploaded to Cloudinary!");
        }
        setIsError(false);
      } else {
        throw new Error("No secure URL found in response.");
      }
    } catch (err: any) {
      console.error(err);
      setCloudinaryError(
        err.message ||
          "Failed to upload to Cloudinary. Check your Cloud Name & unsigned_videos preset.",
      );
      setIsError(true);
    } finally {
      if (type === "poster") {
        setUploadingPoster(false);
      } else {
        setUploadingBackdrop(false);
      }
    }
  };

  // Cinematic Unsplash Presets for Easy Mock Testing
  const presets = [
    {
      name: "Deep Space Sci-Fi",
      poster:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600",
      backdrop:
        "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1200",
    },
    {
      name: "Cyberpunk Streets",
      poster:
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600",
      backdrop:
        "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200",
    },
    {
      name: "Cinematic Film Roll",
      poster:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600",
      backdrop:
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200",
    },
    {
      name: "Moody Coastal Drama",
      poster:
        "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=600",
      backdrop:
        "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=1200",
    },
  ];

  const handleApplyPreset = (p: (typeof presets)[0]) => {
    setPoster(p.poster);
    setBackdrop(p.backdrop);
    setFeedback(`Applied images preset: "${p.name}"`);
    setIsError(false);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "admin123" || passcode === "admin") {
      setAuthorized(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect system passcode. (Hint: use 'admin123')");
    }
  };

  const handleGenerateSeo = async () => {
    if (!title) {
      setFeedback(
        "Please fill out the Movie Title first before running Gemini AI SEO generation.",
      );
      setIsError(true);
      return;
    }

    setAiGenerating(true);
    setFeedback(
      "Gemini AI is crafting Search Optimized Titles, Descriptions, and Indexing Keywords...",
    );
    setIsError(false);

    try {
      const res = await fetch("/api/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          year,
        }),
      });

      if (!res.ok) {
        throw new Error("SEO generation API failed");
      }

      const info = await res.json();
      setSeoTitle(info.seoTitle);
      setSeoDescription(info.seoDescription);
      setKeywords(Array.isArray(info.keywords) ? info.keywords.join(", ") : "");

      setFeedback(
        info.isAiGenerated
          ? "Successfully crafted bespoke SEO tags utilizing server-side Gemini 3.5-Flash!"
          : "Crafted elegant default SEO tags. (Configure GEMINI_API_KEY inside Settings > Secrets for customized AI generation).",
      );
    } catch (err) {
      console.error(err);
      setFeedback(
        "Failed to contact SEO generator. Applied standard meta configurations.",
      );
      setIsError(true);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !videoUrl) {
      setFeedback(
        "Please complete all required fields (Title, Description, and Trailer link).",
      );
      setIsError(true);
      return;
    }

    setSubmitting(true);
    setFeedback("Publishing new movie post to server-side database...");
    setIsError(false);

    try {
      const res = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          year: Number(year),
          duration,
          director,
          cast,
          videoUrl,
          downloadUrl: downloadUrl || undefined,
          poster: poster || undefined,
          backdrop: backdrop || undefined,
          seoTitle: seoTitle || undefined,
          seoDescription: seoDescription || undefined,
          keywords: keywords
            ? keywords.split(",").map((k) => k.trim())
            : undefined,
          featured: true, // Default added items to featured list for explore UI
          trending: false,
        }),
      });

      if (!res.ok) {
        const errInfo = await res.json();
        throw new Error(errInfo.error || "Upload failed");
      }

      // Reset fields
      setTitle("");
      setDescription("");
      setDuration("2h 15m");
      setDirector("");
      setCast("");
      setVideoUrl("");
      setDownloadUrl("");
      setPoster("");
      setBackdrop("");
      setSeoTitle("");
      setSeoDescription("");
      setKeywords("");

      setFeedback(
        "Movie post successfully published! Clean URL slug has been auto-indexed.",
      );
      onMovieAdded();
      fetchAdminMovies();
    } catch (err: any) {
      console.error(err);
      setFeedback(err.message || "Encountered server error uploading movie.");
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!authorized) {
    return (
      <div className="max-w-md mx-auto w-full my-12 animate-fade-in text-left">
        <div className="bg-white/40 dark:bg-black/35 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 p-8 rounded-[32px] shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Admin Control Gate
            </h2>
            <p className="text-xs text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed">
              Authenticate using the default system password code to post new
              films, override SEO meta heads, and sitemaps.
            </p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                id="admin-passcode-field"
                type="password"
                placeholder="Enter Passcode (Hint: use 'admin123')"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-250 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white text-center font-mono tracking-widest"
              />
              {authError && (
                <p className="text-xs font-semibold text-rose-505 dark:text-rose-450 mt-2 flex items-center gap-1 justify-center">
                  <AlertCircle className="w-3.5 h-3.5" /> {authError}
                </p>
              )}
            </div>
            <button
              id="admin-submit-passcode"
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-95 text-white font-bold text-sm tracking-wide shadow-md transform active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Admin Panel</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in text-left">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Banner */}
        <div className="p-6 rounded-3xl bg-blue-600/10 dark:bg-blue-600/15 border border-blue-500/20 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-blue-705 dark:text-blue-300 flex items-center gap-1.5 leading-tight">
              <Unlock className="w-4.5 h-4.5 text-blue-500" />
              Administrative Mode
            </h2>
            <p className="text-xs text-zinc-655 dark:text-white/60 leading-relaxed font-light">
              You are unlocked as System Admin. Creating a film post
              auto-generates sitemap files, and Google indexes.
            </p>
          </div>
          <button
            onClick={() => setAuthorized(false)}
            className="px-4 py-2 font-bold rounded-xl border border-rose-505/20 text-rose-505 bg-rose-500/10 hover:bg-rose-500/20 text-xs transition-all cursor-pointer"
          >
            Lock Dashboard
          </button>
        </div>

        {/* Upload Form Dashboard */}
        <div className="bg-white/40 dark:bg-black/35 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 p-6 md:p-8 rounded-[32px] shadow-xl space-y-8">
          <div className="flex items-center gap-3 border-b border-zinc-150/40 dark:border-zinc-800/40 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
                Publish New Movie Post
              </h3>
              <p className="text-xs text-zinc-450 dark:text-white/40">
                Fill out primary metadata, configure images, and auto-catalog
                with AI.
              </p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* SECTION 1: CORE FILM INFO */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-blue-500 tracking-widest uppercase font-mono block">
                1. Core Information
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Movie Title <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="field-title"
                    type="text"
                    required
                    placeholder="e.g., Avatar: Fire and Ash"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Genre Category <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="field-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-150/40 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none text-zinc-900 dark:text-white font-semibold cursor-pointer"
                  >
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Action">Action</option>
                    <option value="Drama">Drama</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Thriller">Thriller</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">
                  Synopsis / Summary description{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="field-description"
                  rows={4}
                  required
                  placeholder="Insert a majestic synopsis detailing the plot outlines, hooks, and highlights of the film..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white leading-relaxed font-light"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Release Year
                  </label>
                  <input
                    id="field-year"
                    type="number"
                    min={1900}
                    max={2030}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Director
                  </label>
                  <input
                    id="field-director"
                    type="text"
                    placeholder="e.g., James Cameron"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Duration / Running Time
                  </label>
                  <input
                    id="field-duration"
                    type="text"
                    placeholder="e.g., 2h 45m"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">
                  Starring Cast{" "}
                  <span className="text-[10px] text-zinc-400 font-mono">
                    (Comma separated list)
                  </span>
                </label>
                <input
                  id="field-cast"
                  type="text"
                  placeholder="e.g., Sam Worthington, Zoe Saldana, Sigourney Weaver"
                  value={cast}
                  onChange={(e) => setCast(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* SECTION 2: STREAM MEDIA */}
            <div className="space-y-4 pt-4 border-t border-zinc-150/40 dark:border-zinc-800/40">
              <span className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase font-mono block">
                2. Cinematic Video stream
              </span>
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-zinc-405" /> Trailer Video
                  URL <span className="text-rose-600">*</span>
                </label>
                <input
                  id="field-videourl"
                  type="url"
                  required
                  placeholder="e.g., https://www.youtube.com/watch?v=vKQi3bBA1y8"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white font-mono"
                />
                <span className="text-[10px] text-zinc-450 mt-1 block leading-relaxed font-light">
                  Copy and paste any direct YouTube, Vimeo watch link, or
                  embedded URL. The system automatically normalizes watch
                  strings safely.
                </span>
              </div>
              <div className="pt-2">
                <label className="text-xs text-zinc-500 mb-1.5 block flex items-center gap-1">
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-405" />{" "}
                  Download URL{" "}
                  <span className="text-xs text-zinc-400 font-normal">
                    (Optional)
                  </span>
                </label>
                <input
                  id="field-downloadurl"
                  type="url"
                  placeholder="e.g., https://mega.nz/file/..."
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-white font-mono"
                />
                <span className="text-[10px] text-zinc-450 mt-1 block leading-relaxed font-light">
                  Provide a direct download link for the full movie.
                </span>
              </div>
            </div>

            {/* SECTION 3: REELS AND GRAPHICS PRESETS */}
            <div className="space-y-4 pt-4 border-t border-zinc-150/40 dark:border-zinc-800/40">
              <span className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase font-mono block">
                3. Film Covers & Backdrops
              </span>

              {/* Presets Grid */}
              <div>
                <span className="text-xs text-zinc-500 mb-2 block font-medium">
                  Quick Image Presets for Mock Entries:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-3 py-2 rounded-xl bg-zinc-105 dark:bg-zinc-950 hover:bg-zinc-200/50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800/50 text-[11px] font-semibold tracking-wide transition-colors cursor-pointer text-center"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-100/30 dark:bg-white/5 p-6 rounded-3xl border border-zinc-200/50 dark:border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
                    <Image className="w-4 h-4 text-blue-500" />
                    Poster Graphic configuration
                  </h4>

                  <div className="space-y-4">
                    {/* Drag-and-drop area */}
                    <div className="relative border-2 border-dashed border-zinc-300 dark:border-white/10 rounded-2xl p-4 hover:border-blue-500 hover:bg-blue-50/10 dark:hover:bg-white/5 transition-all text-center group cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadToCloudinary(file, "poster");
                        }}
                      />
                      {uploadingPoster ? (
                        <div className="space-y-2 py-4 flex flex-col justify-center items-center">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-xs text-zinc-500 mt-2">
                            Uploading poster to Cloudinary...
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 py-2">
                          <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-blue-500 mx-auto transition-colors" />
                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                            Click or drag profile photo / poster to upload
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            Supports PNG, JPG, WEBP formats
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-zinc-500 mb-1.5 block">
                        Or Paste Direct Poster Image URL
                      </label>
                      <input
                        id="field-poster"
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={poster}
                        onChange={(e) => setPoster(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none text-zinc-700 dark:text-zinc-300 font-mono text-xs"
                      />
                    </div>

                    {poster && (
                      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                        <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-emerald-500/30">
                          <img
                            src={poster}
                            alt="Poster preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block font-mono">
                            Cover Configured
                          </span>
                          <p className="text-[10px] text-zinc-550 dark:text-white/40 truncate max-w-xs">
                            {poster}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
                    <Monitor className="w-4 h-4 text-blue-500" />
                    Backdrop Banner graphic
                  </h4>

                  <div className="space-y-4">
                    {/* Drag-and-drop area */}
                    <div className="relative border-2 border-dashed border-zinc-300 dark:border-white/10 rounded-2xl p-4 hover:border-blue-500 hover:bg-blue-50/10 dark:hover:bg-white/5 transition-all text-center group cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadToCloudinary(file, "backdrop");
                        }}
                      />
                      {uploadingBackdrop ? (
                        <div className="space-y-2 py-4 flex flex-col justify-center items-center">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-xs text-zinc-500 mt-2">
                            Uploading backdrop template to Cloudinary...
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 py-2">
                          <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-blue-500 mx-auto transition-colors" />
                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                            Click or drag banner file to upload
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            Recommended landscape 16:9 ratio
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-zinc-500 mb-1.5 block">
                        Or Paste Direct Backdrop Image URL
                      </label>
                      <input
                        id="field-backdrop"
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={backdrop}
                        onChange={(e) => setBackdrop(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none text-zinc-700 dark:text-zinc-300 font-mono text-xs"
                      />
                    </div>

                    {backdrop && (
                      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                        <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-emerald-500/30">
                          <img
                            src={backdrop}
                            alt="Backdrop preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block font-mono">
                            Banner Configured
                          </span>
                          <p className="text-[10px] text-zinc-550 dark:text-white/40 truncate max-w-xs">
                            {backdrop}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cloud name settings */}
                <div className="md:col-span-2 pt-4 border-t border-zinc-200/50 dark:border-white/5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-100/50 dark:bg-white/5 p-4 rounded-2xl">
                    <div className="text-left">
                      <span className="text-xs font-bold text-zinc-700 dark:text-white block font-mono">
                        Cloudinary Configuration
                      </span>
                      <p className="text-[11px] text-zinc-500 dark:text-white/40 mt-1 leading-relaxed">
                        Direct image uploads leverage your specific Cloud name
                        and the{" "}
                        <code className="font-mono bg-blue-500/15 px-1 py-0.5 rounded text-blue-500 dark:text-blue-400">
                          unsigned_videos
                        </code>{" "}
                        unsigned preset.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="text-right hidden sm:block">
                        <label className="text-[10px] text-zinc-400 uppercase block font-mono">
                          Cloud Name
                        </label>
                      </div>
                      <input
                        id="cloudinary-cloud-name"
                        type="text"
                        placeholder="Cloud Name (e.g. msboy)"
                        value={cloudName}
                        onChange={(e) => setCloudName(e.target.value)}
                        className="w-full sm:w-44 px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-mono tracking-wide focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {cloudinaryError && (
                  <div className="md:col-span-2 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{cloudinaryError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: SEO METADATA & GEMINI GENERATOR */}
            <div className="space-y-4 pt-4 border-t border-zinc-150/40 dark:border-zinc-800/40">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <span className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase font-mono block">
                    4. Search Engine Optimization (SEO)
                  </span>
                  <p className="text-xs text-zinc-450 leading-relaxed font-light">
                    Supply custom meta indices or trigger Gemini to construct
                    them.
                  </p>
                </div>

                <button
                  id="btn-gemini-seo"
                  type="button"
                  disabled={aiGenerating}
                  onClick={handleGenerateSeo}
                  className="px-4 py-2 bg-gradient-to-r from-sky-505 via-indigo-605 to-purple-650 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wide shadow-lg flex items-center gap-1.5 cursor-pointer transform active:scale-95 transition-all flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>
                    {aiGenerating
                      ? "Generating SEO with AI..."
                      : "Generative AI SEO Draft"}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Bespoke SEO Title Tag
                  </label>
                  <input
                    id="field-seotitle"
                    type="text"
                    placeholder="e.g., Beyond the Cosmos (2026) - Full reviews & specifications"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none text-zinc-900 dark:text-white"
                  />
                  <span className="text-[9px] text-zinc-450 mt-1 block">
                    Optimal search length is 50-60 characters.
                  </span>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Search Keywords / indexing Tags{" "}
                    <span className="text-[10px] text-zinc-400 font-mono">
                      (Comma separated)
                    </span>
                  </label>
                  <input
                    id="field-keywords"
                    type="text"
                    placeholder="e.g., scifi, interstellar, space exploration, cosmic voyage"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none text-zinc-900 dark:text-white"
                  />
                  <span className="text-[9px] text-zinc-450 mt-1 block">
                    Separating keywords helps robots index search structures
                    precisely.
                  </span>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Bespoke SEO Meta Description
                  </label>
                  <textarea
                    id="field-seodescription"
                    rows={2}
                    placeholder="Enter meta synopsis snippet between 130 and 155 characters to drive searches and high click-through ratios."
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none text-zinc-900 dark:text-white leading-normal"
                  />
                  <div className="flex items-center justify-between text-[9px] text-zinc-450 mt-1">
                    <span>
                      Recommends 130-155 characters representing rich synopsis
                      previews.
                    </span>
                    <span className="font-mono">
                      {seoDescription.length} characters
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* FEEDBACK STATUS INDICATOR */}
            {feedback && (
              <div
                id="form-feedback"
                className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 border ${
                  isError
                    ? "bg-rose-500/10 text-rose-505 dark:text-rose-400 border-rose-500/20"
                    : feedback.includes("successful") ||
                        feedback.includes("published")
                      ? "bg-emerald-500/10 text-emerald-505 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-indigo-500/10 text-indigo-505 dark:text-indigo-400 border-indigo-500/20"
                }`}
              >
                <div className="mt-0.5">•</div>
                <div>{feedback}</div>
              </div>
            )}

            {/* FORM OPERATIONS SUBMISSION */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-150/40 dark:border-zinc-800/40">
              <button
                id="btn-upload-movie-submit"
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 transform active:scale-95 transition-all outline-none cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {submitting ? "Publishing Film Post..." : "Publish Film Post"}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* MANAGE MOVIES SECTION */}
        <div className="mt-8 bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 shadow-lg p-6 sm:p-8 rounded-3xl mx-auto backdrop-blur-xl relative z-10 transition-colors max-w-4xl">
          <div className="flex items-center justify-between border-b border-zinc-150/40 dark:border-zinc-800/40 pb-5 mb-5 space-y-1">
            <div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-900 dark:from-white dark:to-zinc-300 font-sans tracking-tight flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-indigo-500" />
                Manage Published Films
              </h2>
              <p className="text-sm text-zinc-500 font-light mt-1">
                View and delete currently active posts in the database.
              </p>
            </div>
          </div>

          <div className="space-y-3">
             {loadingMovies ? (
                <div className="text-sm text-zinc-500">Loading movies...</div>
             ) : adminMovies.length === 0 ? (
                <div className="text-sm text-zinc-500">No movies found.</div>
             ) : (
                <div className="grid gap-3">
                  {adminMovies.map((movie) => (
                    <div key={movie.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <div className="flex items-center gap-4">
                        {movie.poster && (
                          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-800">
                             <img src={movie.poster} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover"/>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-zinc-900 dark:text-white">{movie.title} <span className="font-mono text-xs text-zinc-500 dark:text-zinc-600 font-normal">({movie.year})</span></div>
                          <div className="text-xs text-zinc-500 truncate max-w-xs sm:max-w-md">{movie.description}</div>
                        </div>
                      </div>
                      <button 
                        disabled={deletingId === movie.id}
                        onClick={() => handleDeleteMovie(movie.id, movie.title)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
                        title="Delete Post"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
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
