import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";

import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

dotenv.config();

const app = express();
app.use(cors());
const PORT = 3000;

// MongoDB Connection
let uri = process.env.MONGODB_URI || "mongodb+srv://exsanyamin22_db_user:MSSANYAMIN@cluster0.di5rdll.mongodb.net/?appName=Cluster0";
if (uri.includes("<db_password>") || uri.includes("YOUR_REAL_PASSWORD_HERE")) {
  uri = "mongodb+srv://exsanyamin22_db_user:MSSANYAMIN@cluster0.di5rdll.mongodb.net/sample_mflix?appName=Cluster0";
}
const MONGODB_URI = uri;
const mongoClient = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
let mongoDb: any = null;
let mongoConnectPromise: Promise<any> | null = null;

async function getMongoDb() {
  if (mongoDb) return mongoDb;

  if (!mongoConnectPromise) {
    mongoConnectPromise = mongoClient.connect().then(() => {
      mongoDb = mongoClient.db("sample_mflix");
      console.log("Connected to MongoDB!");
      return mongoDb;
    }).catch(err => {
      mongoConnectPromise = null;
      console.error("Failed to connect to MongoDB", err);
      throw err;
    });
  }
  return mongoConnectPromise;
}


app.use(express.json());

// MongoDB Async movie loader
let _cachedMovies: any[] | null = null;
let _cachedMoviesTime = 0;

async function readMoviesAsync(): Promise<any[]> {
  const now = Date.now();
  if (_cachedMovies && now - _cachedMoviesTime < 30000) {
    return _cachedMovies;
  }
  
  try {
    const db = await getMongoDb();
    const moviesCol = db.collection("movies");
    const moviesList = (await moviesCol.find({}).toArray()).map((m: any) => ({ ...m, id: m.id || m._id.toString(), _id: m._id.toString() }));

    const filtered = moviesList;
    _cachedMovies = filtered;
    _cachedMoviesTime = Date.now();
    return filtered;
  } catch (err) {
    console.error("MongoDB access error:", err);
    return [];
  }
}

// MongoDB Async movie writer
async function writeMovieToFirestore(movie: any): Promise<boolean> {
  _cachedMovies = null; // Invalidate cache
  try {
    const db = await getMongoDb();
    const moviesCol = db.collection("movies");
    await moviesCol.updateOne({ id: movie.id }, { $set: movie }, { upsert: true });
    return true;
  } catch (err) {
    console.error("MongoDB write failure:", err);
    return false;
  }
}

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini SDK successfully initialized.");
  } catch (err) {
    console.error("Gemini SDK init failed:", err);
  }
}

// --- API ROUTES ---

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET SITEMAP XML
app.get("/sitemap.xml", async (req, res) => {
  const host = "https://moviezone-9ogo.onrender.com";
  const movies = await readMoviesAsync();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Home Page
  xml += `  <url>\n`;
  xml += `    <loc>${host}/</loc>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // Admin Page
  xml += `  <url>\n`;
  xml += `    <loc>${host}/admin</loc>\n`;
  xml += `    <changefreq>weekly</changefreq>\n`;
  xml += `    <priority>0.5</priority>\n`;
  xml += `  </url>\n`;

  // Movie posts sitemap entries
  movies.forEach((m: any) => {
    xml += `  <url>\n`;
    xml += `    <loc>${host}/movie/${m.slug}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.send(xml);
});

// GET movies list (supports search, genres, year filter, sorting)
app.get("/api/movies", async (req, res) => {
  let movies = await readMoviesAsync();
  const search = req.query.search ? String(req.query.search).toLowerCase() : "";
  const genre = req.query.genre ? String(req.query.genre) : "";
  const year = req.query.year ? Number(req.query.year) : NaN;
  const rating = req.query.rating ? Number(req.query.rating) : NaN;
  const filterType = req.query.type ? String(req.query.type) : ""; // "trending", "featured"

  if (search) {
    movies = movies.filter(
      (m: any) =>
        m.title.toLowerCase().includes(search) ||
        m.description.toLowerCase().includes(search) ||
        (m.director && m.director.toLowerCase().includes(search)) ||
        (m.keywords &&
          m.keywords.some((k: string) => k.toLowerCase().includes(search))),
    );
  }

  if (genre && genre !== "All") {
    movies = movies.filter((m: any) => {
      // support comma separated list or single category
      if (m.category) {
        return m.category.toLowerCase().includes(genre.toLowerCase());
      }
      return false;
    });
  }

  if (!isNaN(year)) {
    movies = movies.filter((m: any) => m.year === year);
  }

  if (!isNaN(rating)) {
    movies = movies.filter((m: any) => m.rating >= rating);
  }

  if (filterType === "trending") {
    movies = movies.filter((m: any) => m.trending);
  } else if (filterType === "featured") {
    movies = movies.filter((m: any) => m.featured);
  }

  // default sort: newest added first
  movies.sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  res.json(movies);
});

// GET single movie post by slug or ID
app.get("/api/movies/:slugOrId", async (req, res) => {
  const movies = await readMoviesAsync();
  const identifier = req.params.slugOrId;

  const movie = movies.find(
    (m: any) => m.id === identifier || m.slug === identifier,
  );

  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  res.json(movie);
});

// POST to generate AI metadata using Gemini API
app.post("/api/generate-seo", async (req, res) => {
  const { title, description, category, year } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  // Deterministic fallbacks
  const fallbackKeywords = [
    category ? category.toLowerCase() : "movie",
    "watch movie",
    "cineglass reviews",
    "stream trailer",
    year ? `released ${year}` : "cinema",
    "movie post",
  ];

  const fallbackSeoTitle = `${title} (${year || new Date().getFullYear()}) - Watch Trailer & Read Reviews | CineGlass`;
  const fallbackSeoDescription = description
    ? `${description.substring(0, 150)}... Read expert reviews, user ratings, and watch the full cinematic trailer on CineGlass.`
    : `Watch trailer, check real-time user reviews and specifications for ${title} (${year}) on CineGlass under premium glassmorphism experience.`;

  if (!ai) {
    return res.json({
      seoTitle: fallbackSeoTitle,
      seoDescription: fallbackSeoDescription,
      keywords: fallbackKeywords,
      isAiGenerated: false,
    });
  }

  try {
    const prompt = `You are a film critic and movie marketing SEO expert.
Create highly professional and attractive SEO metadata for:
Movie Title: "${title}"
Description: "${description || "No description provided."}"
Genre/Category: "${category || "General"}"
Year: ${year || new Date().getFullYear()}

Provide search-optimized details including an eye-catching SEO Title that includes keywords like 'Review' or 'Trailer', a high-clickthrough meta description between 130 and 155 characters, and a list of 5-8 relevant SEO keywords/tags.

Response MUST be complete valid JSON matching this schema exactly:
{
  "seoTitle": "string (max 60 characters)",
  "seoDescription": "string (130-155 characters)",
  "keywords": ["string", "string", "string"]
}

Return ONLY the raw JSON string. Do not wrap in markdown block backticks or any other text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const textOutput = response.text || "";
    let cleanJson = textOutput
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const data = JSON.parse(cleanJson);
    res.json({
      seoTitle: data.seoTitle || fallbackSeoTitle,
      seoDescription: data.seoDescription || fallbackSeoDescription,
      keywords: data.keywords || fallbackKeywords,
      isAiGenerated: true,
    });
  } catch (err) {
    console.error("Gemini SEO derivation failed, degrading gracefully:", err);
    res.json({
      seoTitle: fallbackSeoTitle,
      seoDescription: fallbackSeoDescription,
      keywords: fallbackKeywords,
      isAiGenerated: false,
    });
  }
});

// POST a new movie (Admin upload)
app.post("/api/movies", async (req, res) => {
  const {
    title,
    description,
    poster,
    backdrop,
    videoUrl,
    category,
    year,
    director,
    cast,
    duration,
    featured,
    trending,
    seoTitle,
    seoDescription,
    keywords,
    downloadUrl,
  } = req.body;

  if (!title || !description || !category || !videoUrl) {
    return res
      .status(400)
      .json({
        error: "Title, description, category, and video link are required.",
      });
  }

  const movies = await readMoviesAsync();

  // Create clean URL slug
  let slugBase = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove special characters
    .trim()
    .replace(/\s+/g, "-"); // replace spaces with hyphens

  const releaseYear = year ? Number(year) : new Date().getFullYear();
  let baseSlug = `${slugBase}-${releaseYear}`;
  let finalSlug = baseSlug;
  let counter = 1;

  // Collision handling for slug
  while (movies.some((m: any) => m.slug === finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Pre-supplied image fallback
  const finalPoster =
    poster ||
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600";
  const finalBackdrop =
    backdrop ||
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200";

  const newMovie = {
    id: "m_" + Date.now(),
    title,
    slug: finalSlug,
    description,
    poster: finalPoster,
    backdrop: finalBackdrop,
    videoUrl,
    downloadUrl,
    category,
    year: releaseYear,
    rating: 5.0, // default first rating
    votes: 1, // first vote
    director: director || "Unknown Director",
    cast: Array.isArray(cast)
      ? cast
      : cast
        ? String(cast)
            .split(",")
            .map((c) => c.trim())
        : [],
    duration: duration || "2h 00m",
    keywords: Array.isArray(keywords)
      ? keywords
      : keywords
        ? String(keywords)
            .split(",")
            .map((k) => k.trim())
        : [category.toLowerCase()],
    featured: !!featured,
    trending: !!trending,
    reviews: [],
    seoTitle: seoTitle || `${title} (${releaseYear}) - CineGlass`,
    seoDescription: seoDescription || description.substring(0, 150),
    createdAt: new Date().toISOString(),
  };

  const success = await writeMovieToFirestore(newMovie);
  if (!success) {
    return res
      .status(500)
      .json({ error: "Failed to write movie to Firestore." });
  }

  res.status(201).json(newMovie);
});

// POST to add a rating/review to a movie
app.post("/api/movies/:id/reviews", async (req, res) => {
  const { user, rating, content } = req.body;
  const movieId = req.params.id;

  if (!user || !rating) {
    return res.status(400).json({ error: "User and rating are required." });
  }

  const movies = await readMoviesAsync();
  const index = movies.findIndex((m: any) => m.id === movieId);

  if (index === -1) {
    return res.status(404).json({ error: "Movie not found" });
  }

  const movie = movies[index];
  const parsedRating = Math.max(1, Math.min(5, Number(rating)));

  const newReview = {
    id: "r_" + Date.now(),
    user,
    rating: parsedRating,
    content: content || "",
    createdAt: new Date().toISOString(),
  };

  movie.reviews = movie.reviews || [];
  movie.reviews.push(newReview);

  // Recalculate movie statistics
  const totalVotes = movie.votes + 1;
  const newAvgRating = parseFloat(
    ((movie.rating * movie.votes + parsedRating) / totalVotes).toFixed(1),
  );

  movie.rating = newAvgRating;
  movie.votes = totalVotes;

  const success = await writeMovieToFirestore(movie);
  if (!success) {
    return res
      .status(500)
      .json({ error: "Failed to save review to Firestore." });
  }

  res.status(201).json({ movie, review: newReview });
});

// DELETE a movie by ID
app.delete("/api/movies/:id", async (req, res) => {
  const movieId = req.params.id;
  try {
    const db = await getMongoDb();
    const moviesCol = db.collection("movies");
    let result = await moviesCol.deleteOne({ id: movieId });
    
    if (result.deletedCount === 0) {
       // Might be stored by _id alone
       try {
         const resultById = await moviesCol.deleteOne({ _id: new ObjectId(movieId) });
         if (resultById.deletedCount === 0) {
           return res.status(404).json({ error: "Movie not found" });
         }
       } catch (e) {
           return res.status(404).json({ error: "Movie not found and invalid ID format" });
       }
    }
    
    // update cache
    _cachedMovies = null;

    res.json({ success: true, message: "Movie deleted successfully" });
  } catch (err) {
    console.error("Failed to delete movie", err);
    res.status(500).json({ error: "Failed to delete movie" });
  }
});

// Helper function to inject HTML metadata server-side
function seoInjectedHtml(html: string, movie: any) {
  const host = process.env.APP_URL || `http://localhost:${PORT}`;

  // Custom metadata
  const title =
    movie.seoTitle ||
    `${movie.title} (${movie.year}) - Reviews, Cast & Trailer | CineGlass`;
  const description = (movie.seoDescription || movie.description || "")
    .replace(/"/g, "&quot;")
    .substring(0, 155);
  const keywords = Array.isArray(movie.keywords)
    ? movie.keywords.join(", ")
    : movie.category;
  const canonicalUrl = `${host}/movie/${movie.slug}`;

  // Structured Data (Schema.org Movie Spec)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    image: movie.poster,
    description: movie.description,
    dateCreated: `${movie.year}-01-01`,
    director: {
      "@type": "Person",
      name: movie.director || "Unknown Director",
    },
    actor: (movie.cast || []).map((actorName: string) => ({
      "@type": "Person",
      name: actorName,
    })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: movie.rating,
      bestRating: "5",
      ratingCount: movie.votes,
    },
  };

  // Replacement elements
  const metaTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="${keywords}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="video.movie" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${movie.poster}" />
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${canonicalUrl}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${movie.poster}" />
    <!-- Google Rich Snippet Structured Schema -->
    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
  `;

  // We find where <head> resides and append after it, and we replace any existing <title>.
  let result = html;

  // Remove existing title tags if simple replacement is requested
  result = result.replace(/<title>[^<]*<\/title>/g, "");

  // Inject metaTags straight after <head> or similar tag
  if (result.includes("<head>")) {
    result = result.replace("<head>", `<head>${metaTags}`);
  } else {
    // If not found, inject at front
    result = metaTags + result;
  }

  return result;
}

// --- INTERCEPT ALL FRONTEND PAGES ---

async function startServer() {
  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // Intercept Movie detail requests before static middleware for Server Side SEO injection
    app.get("/movie/:slug", async (req, res, next) => {
      const slug = req.params.slug;
      const movies = await readMoviesAsync();
      const movie = movies.find((m: any) => m.slug === slug);

      if (!movie) {
        return next(); // let Client-side router handle 404
      }

      try {
        let template = fs.readFileSync(
          path.resolve(process.cwd(), "index.html"),
          "utf-8",
        );
        // transform with development Vite
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const seoHtml = seoInjectedHtml(template, movie);
        res.status(200).set({ "Content-Type": "text/html" }).end(seoHtml);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.all("/api/*", (req, res) => {
      res.status(404).json({ error: "API Route Not Found" });
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    // Intercept Movie detail requests before standard static delivery for Server Side SEO injection
    app.get("/movie/:slug", async (req, res, next) => {
      const slug = req.params.slug;
      const movies = await readMoviesAsync();
      const movie = movies.find((m: any) => m.slug === slug);

      if (!movie) {
        return next(); // let React router 404 Client-side
      }

      try {
        const templatePath = path.join(distPath, "index.html");
        if (fs.existsSync(templatePath)) {
          const template = fs.readFileSync(templatePath, "utf-8");
          const seoHtml = seoInjectedHtml(template, movie);
          res.status(200).set({ "Content-Type": "text/html" }).end(seoHtml);
        } else {
          next();
        }
      } catch (err) {
        next(err);
      }
    });

    app.all("/api/*", (req, res) => {
      res.status(404).json({ error: "API Route Not Found" });
    });

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `CineGlass Fullstack dev server running on http://localhost:${PORT}`,
    );
  });
}

startServer();
