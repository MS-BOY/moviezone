import { Sun, Moon, Film, PlusCircle, Search, FileCode } from "lucide-react";
import { motion } from "motion/react";

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onNavigate: (route: "home" | "admin" | "movie-detail", slug?: string) => void;
  currentRoute: string;
}

export default function Header({
  darkMode,
  setDarkMode,
  onNavigate,
  currentRoute,
}: HeaderProps) {
  return (
    <header className="sticky top-4 z-50 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div 
        id="ios-navbar"
        className="w-full bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 py-3 px-5 md:px-8 rounded-2xl flex items-center justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] transition-all duration-300"
      >
        {/* Branding */}
        <div 
          onClick={() => onNavigate("home")} 
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all text-white border border-white/10">
            <Film className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              CINEGLASS
            </h1>
            <p className="text-[9px] font-bold tracking-widest text-zinc-500 dark:text-white/40 uppercase font-mono">
              SLEEK INTERFACE
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden sm:flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
          <button
            id="nav-home"
            onClick={() => onNavigate("home")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              currentRoute === "home"
                ? "bg-white/80 dark:bg-white/15 text-indigo-600 dark:text-white shadow-md font-bold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Explore
          </button>
          
          <button
            id="nav-admin"
            onClick={() => onNavigate("admin")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              currentRoute === "admin"
                ? "bg-white/80 dark:bg-white/15 text-indigo-600 dark:text-white shadow-md font-bold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Post Movie</span>
          </button>
        </nav>

        {/* Right Interactions and Mobile Nav (when small) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Admin Icon (only on strictly small screens) */}
          <button
            onClick={() => onNavigate("admin")}
            className="sm:hidden p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          {/* Sitemap / Indexability indicator */}
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            title="XML Sitemap for SEO Indexability"
            className="hidden sm:flex p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 transition-colors cursor-pointer items-center gap-1"
          >
            <FileCode className="w-4 h-4" />
            <span className="text-[10px] hidden md:inline font-mono">Sitemap.xml</span>
          </a>

          {/* Theme Toggle */}
          <button
            id="theme-toggler"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl border border-white/20 dark:border-white/5 bg-white/20 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-100 cursor-pointer transition-all shadow-md active:scale-95"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>
        </div>
      </div>
    </header>
  );
}
