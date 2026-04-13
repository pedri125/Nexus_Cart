import mongoose from "mongoose"

// ---------------------------------------------------------------------------
// Don't validate MONGODB_URI at module-level — during `next build` env vars
// may not be available yet. Validation happens inside connectDB() instead.
// ---------------------------------------------------------------------------

const MONGODB_URI = process.env.MONGODB_URI as string

// Cache de conexión para Next.js (hot-reload en dev)
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null }
global._mongooseCache = cached

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  const uri = MONGODB_URI || process.env.MONGODB_URI
  if (!uri) {
    throw new Error("MONGODB_URI is not defined. Add it to your environment variables.")
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default connectDB
