import { MongoClient, type Db } from "mongodb"

// Read MongoDB connection from environment to avoid embedding credentials in source.
const MONGODB_URI = process.env.MONGODB_URI || ""
const MONGODB_DB = process.env.MONGODB_DB || "easybraille"

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

const options = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 60000,
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 120000,
  retryWrites: true,
  retryReads: true,
}

export async function connectToDatabase() {
  try {
    if (cachedClient && cachedDb) {
      console.log("✅ Usando conexión a MongoDB existente")
      return { client: cachedClient, db: cachedDb }
    }

    console.log("🔄 Conectando a MongoDB Atlas...")

    if (!MONGODB_URI) {
      throw new Error("❌ MONGODB_URI no está definida. Para despliegues en CI/Amplify, configure la variable de entorno MONGODB_URI o habilite un modo de build sin DB.")
    }

    const client = new MongoClient(MONGODB_URI, options)
    await client.connect()
    console.log("✅ Conectado a MongoDB Atlas")

    const db = client.db(MONGODB_DB)
    await db.command({ ping: 1 })
    console.log("✅ Conexión verificada con ping")

    cachedClient = client
    cachedDb = db

    return { client, db }
  } catch (error: any) {
    console.error("❌ Error al conectar a MongoDB:", error)
    throw error
  }
}

// Backwards-compatible alias
export async function connectDB() {
  return await connectToDatabase()
}

export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase()
  return db
}

// Exportaciones de colecciones
export async function getUsersCollection() {
  const db = await getDatabase()
  return db.collection("users")
}

export async function getTranslationsCollection() {
  const db = await getDatabase()
  return db.collection("translations")
}

export async function getAiInteractionsCollection() {
  const db = await getDatabase()
  return db.collection("ai_interactions")
}

export async function getKeyboardStatsCollection() {
  const db = await getDatabase()
  return db.collection("keyboard_stats")
}

export async function getEcoKeyboardsCollection() {
  const db = await getDatabase()
  return db.collection("eco_keyboards")
}

export async function closeConnection() {
  if (cachedClient) {
    await cachedClient.close()
    cachedClient = null
    cachedDb = null
    console.log("✅ Conexión a MongoDB cerrada")
  }
}
