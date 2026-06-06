import { MongoClient } from 'mongodb';
const uri = "mongodb://atlas-sql-6975e0aabb80b493a414b600-ts1jqp.g.query.mongodb.net/sample_mflix?ssl=true&authSource=admin";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db("sample_mflix");
    const collections = await db.collections();
    console.log("Collections:", collections.map(c => c.collectionName));
    
    // Also fetch one movie to see its schema
    const movies = db.collection("movies");
    const movie = await movies.findOne({});
    console.log("Sample movie:", movie);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
