import fs from "fs";
import path from "path";

const LOCAL_FILE_PATH = path.join(process.cwd(), "movies-local.json");

/**
 * Read movies stored locally on the server filesystem.
 */
export function getLocalMovies(): any[] {
  try {
    if (!fs.existsSync(LOCAL_FILE_PATH)) {
      return [];
    }
    const data = fs.readFileSync(LOCAL_FILE_PATH, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to read local movies file:", err);
    return [];
  }
}

/**
 * Save movies locally on the server filesystem.
 */
export function saveLocalMovies(movies: any[]): boolean {
  try {
    fs.writeFileSync(LOCAL_FILE_PATH, JSON.stringify(movies, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to write local movies file:", err);
    return false;
  }
}

/**
 * Save or update a single movie locally on the server filesystem.
 */
export function saveLocalMovie(newMovie: any): boolean {
  try {
    const movies = getLocalMovies();
    const existingIndex = movies.findIndex(m => m.id === newMovie.id);
    if (existingIndex !== -1) {
      movies[existingIndex] = newMovie;
    } else {
      movies.push(newMovie);
    }
    return saveLocalMovies(movies);
  } catch (err) {
    console.error("Failed to append local movie:", err);
    return false;
  }
}
