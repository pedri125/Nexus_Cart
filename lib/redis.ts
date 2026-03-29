import { Redis } from "@upstash/redis"

const url = process.env.KV_REST_API_URL?.trim()
const token = process.env.KV_REST_API_TOKEN?.trim()

/**
 * Cliente Redis (Upstash). Es `null` si las variables de entorno no están configuradas.
 * Siempre verifica `if (redis)` antes de usar.
 */
export const redis: Redis | null =
  url && token
    ? new Redis({ url, token })
    : null
