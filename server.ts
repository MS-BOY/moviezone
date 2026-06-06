import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

// ✅ IMPORTANT: Vercel compatible PORT
const PORT = process.env.PORT || 3000;

app.use(express.json());

/* ---------------- MONGODB ---------------- */

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://exsanyamin22_db_user:MSSANYAMIN@cluster0.di5rdll.mongodb.net/sample_mflix?appName=Cluster0";

const client = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db = null;

async function getDb() {
  if (db) return db;
  await client.connect();
  db = client.db("sample_mflix");
  console.log("MongoDB connected");
  return db;
}

/* ---------------- CACHE ---------------- */

let moviesCache = null;

async function getMovies() {
  if (moviesCache) return moviesCache;

  const db = await getDb();
  const data = await db.collection("movies").find({}).toArray();

  moviesCache = data.map((m) => ({
    ...m,
    id: m.id || m._id.toString(),
    _id: m._id.toString(),
  }));

  return moviesCache;
}

/* ---------------- AI (optional) ---------------- */

let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

/* ---------------- API ROUTES (IMPORTANT FIRST) ---------------- */

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Get movies
app.get("/api/movies", async (req, res) => {
  try {
    const movies = await getMovies();
    res.json(movies); // ✅ MUST JSON
  } catch (err) {
    res.status(500).json({ error: "Failed to load movies" });
  }
});

// Single movie
app.get("/api/movies/:id", async (req, res) => {
  const movies = await getMovies();
  const movie = movies.find(
    (m) => m.id === req.params.id || m.slug === req.params.id
  );

  if (!movie) return res.status(404).json({ error: "Not found" });

  res.json(movie);
});

/* ---------------- FRONTEND (MUST BE LAST) ---------------- */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), "dist");

    app.use(express.static(dist));

    // ✅ IMPORTANT FIX: API skip
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(dist, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
